-- ============================================================================
-- MIGRATION 028: Create call_logs table
-- Purpose: Track all VAPI calls for each organization
-- ============================================================================

-- Create the table
CREATE TABLE IF NOT EXISTS public.call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    vapi_call_id VARCHAR(255) UNIQUE,
    
    -- Call details
    phone_number VARCHAR(20),
    direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
    status VARCHAR(50) DEFAULT 'in_progress',
    
    -- Timing
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Content
    transcript TEXT,
    summary TEXT,
    detected_language VARCHAR(10),
    
    -- Costs & Metadata
    cost DECIMAL(10,4),
    raw_vapi_data JSONB,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_org_id ON public.call_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_vapi_call_id ON public.call_logs(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON public.call_logs(status);
CREATE INDEX IF NOT EXISTS idx_call_logs_start_time ON public.call_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_call_logs_phone ON public.call_logs(phone_number);

-- Enable RLS
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can do everything
CREATE POLICY "Allow full access for service_role" 
ON public.call_logs FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policy: Organization members can view their calls
CREATE POLICY "Allow read access for organization members" 
ON public.call_logs FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);

-- Create trigger for updated_at
-- Note: Assumes the function 'update_updated_at_column' already exists from a previous migration.
CREATE TRIGGER update_call_logs_updated_at
    BEFORE UPDATE ON public.call_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.call_logs TO postgres, service_role;
GRANT SELECT ON public.call_logs TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 028 completed: call_logs table created';
END$$;
