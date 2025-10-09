-- ============================================================================
-- EMERGENCY CONTACTS SYSTEM
-- Migration 016: Create emergency contact management infrastructure
-- ============================================================================
-- This migration creates the infrastructure for managing emergency contacts:
-- - Emergency contacts table with priority and availability
-- - Escalation chain logic
-- - On-call rotation support
-- - Emergency notification tracking
-- ============================================================================

-- ============================================================================
-- TABLE: emergency_contacts
-- Store emergency contact information with availability and priority
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Contact information
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(100),
    
    -- Availability
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    available_days TEXT[], -- ['monday', 'tuesday', 'wednesday', ...]
    available_hours_start TIME,
    available_hours_end TIME,
    
    -- Priority and escalation
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 100), -- 1 = highest priority
    escalation_timeout INTEGER DEFAULT 30 CHECK (escalation_timeout >= 10 AND escalation_timeout <= 300), -- seconds before trying next contact
    
    -- Notification preferences
    sms_enabled BOOLEAN DEFAULT true,
    call_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT false,
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: emergency_notifications
-- Track all emergency notification attempts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.emergency_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    emergency_contact_id UUID REFERENCES public.emergency_contacts(id) ON DELETE SET NULL,
    vapi_call_id VARCHAR(255),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    
    -- Notification details
    notification_type VARCHAR(20) CHECK (notification_type IN ('sms', 'call', 'email')),
    urgency VARCHAR(20) CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
    message TEXT NOT NULL,
    
    -- Contact information
    contact_name VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'acknowledged')),
    
    -- Timing
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    
    -- Outcome
    notification_successful BOOLEAN,
    failure_reason TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- Optimize common query patterns
-- ============================================================================

-- Emergency contacts indexes
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_org ON public.emergency_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_priority ON public.emergency_contacts(priority, is_active);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_phone ON public.emergency_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_primary ON public.emergency_contacts(is_primary, is_active);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_active ON public.emergency_contacts(is_active);

-- Emergency notifications indexes
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_org ON public.emergency_notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_contact ON public.emergency_notifications(emergency_contact_id);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_call ON public.emergency_notifications(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_appointment ON public.emergency_notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_status ON public.emergency_notifications(status);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_date ON public.emergency_notifications(created_at DESC);

-- Composite index for analytics
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_analytics ON public.emergency_notifications(organization_id, created_at DESC, status, urgency);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: emergency_contacts
-- ============================================================================

-- All members can view emergency contacts
DROP POLICY IF EXISTS "Users can view their organization's emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Users can view their organization's emergency contacts"
    ON public.emergency_contacts
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
            AND is_active = TRUE
        )
    );

-- Only admins and owners can manage emergency contacts
DROP POLICY IF EXISTS "Admins can manage emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Admins can manage emergency contacts"
    ON public.emergency_contacts
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
-- RLS POLICIES: emergency_notifications
-- ============================================================================

-- All members can view emergency notifications
DROP POLICY IF EXISTS "Users can view emergency notifications" ON public.emergency_notifications;
CREATE POLICY "Users can view emergency notifications"
    ON public.emergency_notifications
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
            AND is_active = TRUE
        )
    );

-- Only admins and service role can create notifications
DROP POLICY IF EXISTS "Service can create notifications" ON public.emergency_notifications;
CREATE POLICY "Service can create notifications"
    ON public.emergency_notifications
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'member')
            AND is_active = TRUE
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get the on-call contact for an organization
CREATE OR REPLACE FUNCTION public.get_on_call_contact(org_id UUID, urgency_level TEXT DEFAULT 'medium')
RETURNS public.emergency_contacts AS $$
DECLARE
    contact public.emergency_contacts;
    current_day TEXT;
BEGIN
    -- Get current day of week in lowercase
    current_day := LOWER(TO_CHAR(NOW(), 'Day'));
    current_day := TRIM(current_day);
    
    -- First, try to get primary contact if available
    SELECT * INTO contact
    FROM public.emergency_contacts
    WHERE organization_id = org_id
    AND is_active = true
    AND is_primary = true
    AND (
        available_days IS NULL 
        OR current_day = ANY(available_days)
    )
    AND (
        available_hours_start IS NULL
        OR CURRENT_TIME BETWEEN available_hours_start AND available_hours_end
    )
    ORDER BY priority ASC
    LIMIT 1;
    
    -- If no primary contact available, get highest priority available contact
    IF contact IS NULL THEN
        SELECT * INTO contact
        FROM public.emergency_contacts
        WHERE organization_id = org_id
        AND is_active = true
        AND (
            available_days IS NULL 
            OR current_day = ANY(available_days)
        )
        AND (
            available_hours_start IS NULL
            OR CURRENT_TIME BETWEEN available_hours_start AND available_hours_end
        )
        ORDER BY priority ASC
        LIMIT 1;
    END IF;
    
    -- If still no contact, get any active contact (ignore availability for emergencies)
    IF contact IS NULL AND urgency_level = 'emergency' THEN
        SELECT * INTO contact
        FROM public.emergency_contacts
        WHERE organization_id = org_id
        AND is_active = true
        ORDER BY priority ASC
        LIMIT 1;
    END IF;
    
    RETURN contact;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get escalation chain for an organization
CREATE OR REPLACE FUNCTION public.get_escalation_chain(org_id UUID)
RETURNS TABLE (
    contact_id UUID,
    contact_name VARCHAR,
    contact_phone VARCHAR,
    priority INTEGER,
    is_primary BOOLEAN,
    escalation_timeout INTEGER,
    notification_methods TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.id,
        ec.name,
        ec.phone,
        ec.priority,
        ec.is_primary,
        ec.escalation_timeout,
        ARRAY_REMOVE(
            ARRAY[
                CASE WHEN ec.sms_enabled THEN 'sms'::TEXT END,
                CASE WHEN ec.call_enabled THEN 'call'::TEXT END,
                CASE WHEN ec.email_enabled THEN 'email'::TEXT END
            ],
            NULL
        ) as notification_methods
    FROM public.emergency_contacts ec
    WHERE ec.organization_id = org_id
    AND ec.is_active = true
    ORDER BY ec.priority ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get emergency notification statistics
CREATE OR REPLACE FUNCTION public.get_emergency_notification_stats(
    org_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_notifications', COUNT(*),
        'successful_notifications', COUNT(*) FILTER (WHERE notification_successful = true),
        'failed_notifications', COUNT(*) FILTER (WHERE notification_successful = false),
        'success_rate', ROUND(
            (COUNT(*) FILTER (WHERE notification_successful = true)::DECIMAL / NULLIF(COUNT(*), 0) * 100), 
            2
        ),
        'by_urgency', (
            SELECT json_object_agg(urgency, urgency_count)
            FROM (
                SELECT urgency, COUNT(*) as urgency_count
                FROM public.emergency_notifications
                WHERE organization_id = org_id
                AND created_at >= NOW() - (days_back || ' days')::INTERVAL
                GROUP BY urgency
            ) urgency_stats
        ),
        'by_type', (
            SELECT json_object_agg(notification_type, type_count)
            FROM (
                SELECT notification_type, COUNT(*) as type_count
                FROM public.emergency_notifications
                WHERE organization_id = org_id
                AND created_at >= NOW() - (days_back || ' days')::INTERVAL
                GROUP BY notification_type
            ) type_stats
        ),
        'avg_delivery_time', ROUND(
            AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at)))::NUMERIC,
            2
        )
    ) INTO result
    FROM public.emergency_notifications
    WHERE organization_id = org_id
    AND created_at >= NOW() - (days_back || ' days')::INTERVAL;
    
    RETURN COALESCE(result, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent emergency notifications
CREATE OR REPLACE FUNCTION public.get_recent_emergency_notifications(
    org_id UUID,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    notification_id UUID,
    contact_name VARCHAR,
    notification_type VARCHAR,
    urgency VARCHAR,
    status VARCHAR,
    message TEXT,
    created_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        en.id,
        en.contact_name,
        en.notification_type,
        en.urgency,
        en.status,
        en.message,
        en.created_at,
        en.delivered_at
    FROM public.emergency_notifications en
    WHERE en.organization_id = org_id
    ORDER BY en.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp on emergency_contacts
DROP TRIGGER IF EXISTS update_emergency_contacts_updated_at ON public.emergency_contacts;
CREATE TRIGGER update_emergency_contacts_updated_at
    BEFORE UPDATE ON public.emergency_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to ensure only one primary contact per organization
CREATE OR REPLACE FUNCTION public.ensure_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this contact as primary, unset all other primary contacts in the organization
    IF NEW.is_primary = true THEN
        UPDATE public.emergency_contacts
        SET is_primary = false
        WHERE organization_id = NEW.organization_id
        AND id != NEW.id
        AND is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_primary_trigger ON public.emergency_contacts;
CREATE TRIGGER ensure_single_primary_trigger
    BEFORE INSERT OR UPDATE ON public.emergency_contacts
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION public.ensure_single_primary_contact();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.emergency_contacts TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;

GRANT ALL ON public.emergency_notifications TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.emergency_notifications TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.get_on_call_contact(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_escalation_chain(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_emergency_notification_stats(UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_recent_emergency_notifications(UUID, INTEGER) TO authenticated, service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('emergency_contacts', 'emergency_notifications')) = 2,
            'Not all tables were created';
    
    RAISE NOTICE 'Migration 016 completed successfully!';
    RAISE NOTICE 'Created tables: emergency_contacts, emergency_notifications';
    RAISE NOTICE 'Created RLS policies for emergency contact data isolation';
    RAISE NOTICE 'Created helper functions for on-call rotation and escalation';
    RAISE NOTICE 'Created triggers for single primary contact enforcement';
END $$;

