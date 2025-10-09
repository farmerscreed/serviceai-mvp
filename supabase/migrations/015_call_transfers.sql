-- ============================================================================
-- CALL TRANSFER SYSTEM
-- Migration 015: Create call transfer infrastructure
-- ============================================================================
-- This migration creates the infrastructure for transferring AI calls to humans:
-- - Transfer configuration in organizations
-- - Call transfers tracking table
-- - Transfer logging and analytics
-- ============================================================================

-- ============================================================================
-- ADD TRANSFER SETTINGS TO ORGANIZATIONS
-- ============================================================================
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS transfer_phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS transfer_mode VARCHAR(10) DEFAULT 'warm' CHECK (transfer_mode IN ('warm', 'cold')),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS max_transfer_wait_time INTEGER DEFAULT 30 CHECK (max_transfer_wait_time > 0 AND max_transfer_wait_time <= 300);

-- Add comments for documentation
COMMENT ON COLUMN public.organizations.transfer_phone_number IS 'Primary phone number for transferring calls to human agents';
COMMENT ON COLUMN public.organizations.transfer_mode IS 'Transfer type: warm (AI briefs human first) or cold (immediate connection)';
COMMENT ON COLUMN public.organizations.emergency_contact_phone IS 'Emergency contact phone number for urgent situations';
COMMENT ON COLUMN public.organizations.max_transfer_wait_time IS 'Maximum seconds to wait before escalating (default: 30)';

-- ============================================================================
-- TABLE: call_transfers
-- Track all call transfer attempts and outcomes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.call_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    vapi_call_id VARCHAR(255) NOT NULL,
    
    -- Transfer details
    reason VARCHAR(255),
    urgency VARCHAR(20) CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
    summary TEXT,
    customer_name VARCHAR(255),
    transfer_to VARCHAR(20),
    transfer_mode VARCHAR(10) CHECK (transfer_mode IN ('warm', 'cold')),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'initiated' CHECK (status IN ('initiated', 'connecting', 'connected', 'completed', 'failed', 'no_answer', 'timeout')),
    
    -- Timing
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    connected_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Outcome
    transfer_successful BOOLEAN,
    failure_reason TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- Optimize common query patterns
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_call_transfers_org ON public.call_transfers(organization_id);
CREATE INDEX IF NOT EXISTS idx_call_transfers_call ON public.call_transfers(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_call_transfers_status ON public.call_transfers(status);
CREATE INDEX IF NOT EXISTS idx_call_transfers_urgency ON public.call_transfers(urgency);
CREATE INDEX IF NOT EXISTS idx_call_transfers_date ON public.call_transfers(created_at DESC);

-- Composite index for analytics
CREATE INDEX IF NOT EXISTS idx_call_transfers_analytics ON public.call_transfers(organization_id, created_at DESC, status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.call_transfers ENABLE ROW LEVEL SECURITY;

-- Users can view transfers in their organization
DROP POLICY IF EXISTS "Users can view their organization's transfers" ON public.call_transfers;
CREATE POLICY "Users can view their organization's transfers"
    ON public.call_transfers
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
            AND is_active = TRUE
        )
    );

-- Only admins and owners can manage transfers
DROP POLICY IF EXISTS "Admins can manage transfers" ON public.call_transfers;
CREATE POLICY "Admins can manage transfers"
    ON public.call_transfers
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = TRUE
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get transfer statistics for an organization
CREATE OR REPLACE FUNCTION public.get_transfer_stats(
    org_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_transfers', COUNT(*),
        'successful_transfers', COUNT(*) FILTER (WHERE transfer_successful = true),
        'failed_transfers', COUNT(*) FILTER (WHERE transfer_successful = false),
        'success_rate', ROUND(
            (COUNT(*) FILTER (WHERE transfer_successful = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100), 
            2
        ),
        'by_urgency', json_object_agg(
            urgency, 
            urgency_count
        ),
        'avg_connection_time', ROUND(
            AVG(EXTRACT(EPOCH FROM (connected_at - initiated_at)))::NUMERIC,
            2
        ),
        'avg_duration', ROUND(AVG(duration_seconds)::NUMERIC, 2)
    ) INTO result
    FROM (
        SELECT 
            urgency,
            COUNT(*) as urgency_count,
            transfer_successful,
            initiated_at,
            connected_at,
            duration_seconds
        FROM public.call_transfers
        WHERE organization_id = org_id
        AND created_at >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY urgency, transfer_successful, initiated_at, connected_at, duration_seconds
    ) stats;
    
    RETURN COALESCE(result, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent transfers for monitoring
CREATE OR REPLACE FUNCTION public.get_recent_transfers(
    org_id UUID,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    transfer_id UUID,
    call_id VARCHAR,
    customer_name VARCHAR,
    reason VARCHAR,
    urgency VARCHAR,
    status VARCHAR,
    transfer_successful BOOLEAN,
    created_at TIMESTAMPTZ,
    duration_seconds INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ct.id,
        ct.vapi_call_id,
        ct.customer_name,
        ct.reason,
        ct.urgency,
        ct.status,
        ct.transfer_successful,
        ct.created_at,
        ct.duration_seconds
    FROM public.call_transfers ct
    WHERE ct.organization_id = org_id
    ORDER BY ct.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update transfer duration when completed
CREATE OR REPLACE FUNCTION public.update_transfer_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate duration when transfer is completed
    IF NEW.status IN ('completed', 'failed', 'no_answer', 'timeout') 
       AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'failed', 'no_answer', 'timeout')) THEN
        
        NEW.completed_at = NOW();
        
        IF NEW.connected_at IS NOT NULL THEN
            NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.connected_at))::INTEGER;
        END IF;
        
        -- Set transfer_successful based on status
        NEW.transfer_successful = (NEW.status = 'completed');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update transfer duration
DROP TRIGGER IF EXISTS update_transfer_duration_trigger ON public.call_transfers;
CREATE TRIGGER update_transfer_duration_trigger
    BEFORE UPDATE ON public.call_transfers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_transfer_duration();

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT ALL ON public.call_transfers TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.call_transfers TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.get_transfer_stats(UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_recent_transfers(UUID, INTEGER) TO authenticated, service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    ASSERT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'call_transfers'
    ), 'call_transfers table was not created';
    
    RAISE NOTICE 'Migration 015 completed successfully!';
    RAISE NOTICE 'Created table: call_transfers';
    RAISE NOTICE 'Added transfer configuration columns to organizations';
    RAISE NOTICE 'Created RLS policies for transfer data isolation';
    RAISE NOTICE 'Created helper functions for transfer analytics';
    RAISE NOTICE 'Created triggers for automatic duration calculation';
END $$;

