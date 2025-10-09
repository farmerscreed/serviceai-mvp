-- Task 1.2: Multi-Language Database Schema & Template Storage
-- Consolidated migration for ServiceAI multi-language support

-- =====================================================
-- 1. Enhanced Multi-Tenant Tables
-- =====================================================

-- Add industry_code to organizations if it doesn't exist
DO $$ BEGIN
    ALTER TABLE organizations ADD COLUMN industry_code VARCHAR(50);
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Add language and timezone to organizations if they don't exist
DO $$ BEGIN
    ALTER TABLE organizations ADD COLUMN primary_language VARCHAR(5) DEFAULT 'en';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE organizations ADD COLUMN timezone VARCHAR(50) DEFAULT 'America/New_York';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Create organization_settings table for more granular settings
CREATE TABLE IF NOT EXISTS organization_settings (
    organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    default_language VARCHAR(5) DEFAULT 'en',
    supported_languages VARCHAR(5)[] DEFAULT '{"en", "es"}',
    default_timezone VARCHAR(50) DEFAULT 'America/New_York',
    sms_enabled BOOLEAN DEFAULT TRUE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for organization_settings
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Policies for organization_settings
CREATE POLICY "Organization members can view settings"
ON organization_settings FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Owners and admins can update settings"
ON organization_settings FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- =====================================================
-- 2. Industry Templates Table
-- =====================================================

CREATE TABLE IF NOT EXISTS industry_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_code VARCHAR(50) NOT NULL,
    language_code VARCHAR(5) NOT NULL, -- 'en', 'es'
    display_name VARCHAR(255) NOT NULL,
    template_config JSONB NOT NULL, -- General AI assistant configuration
    emergency_patterns JSONB NOT NULL, -- Language-specific emergency detection patterns
    appointment_types JSONB NOT NULL, -- Configurable appointment types and workflows
    required_fields JSONB NOT NULL, -- Fields required for booking, lead qualification etc.
    sms_templates JSONB NOT NULL, -- SMS message templates for various events
    cultural_guidelines JSONB NOT NULL, -- Communication style guidelines
    integration_requirements JSONB NOT NULL, -- Requirements for external integrations
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(industry_code, language_code)
);

-- Enable RLS for industry_templates
ALTER TABLE industry_templates ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view templates
CREATE POLICY "Authenticated users can view industry templates"
ON industry_templates FOR SELECT
USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_industry_templates_code_lang ON industry_templates(industry_code, language_code);

-- =====================================================
-- 3. Customer Configurations Table
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    industry_template_id UUID REFERENCES public.industry_templates(id),
    primary_language VARCHAR(5) DEFAULT 'en',
    secondary_languages VARCHAR[] DEFAULT '{}',
    sms_preferences JSONB NOT NULL DEFAULT '{}', -- SMS settings and preferences (e.g., opt-in, types of messages)
    custom_config JSONB DEFAULT '{}', -- Any custom overrides to the template config
    vapi_assistant_id VARCHAR(255),
    vapi_phone_number VARCHAR(20),
    twilio_phone_number VARCHAR(20), -- Dedicated SMS number for this customer/organization
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, industry_template_id) -- An organization can only have one config per template
);

-- Enable RLS for customer_configurations
ALTER TABLE customer_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can view their customer configurations
CREATE POLICY "Organization members can view their customer configurations"
ON customer_configurations FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- Policy: Owners and admins can manage their customer configurations
CREATE POLICY "Owners and admins can manage their customer configurations"
ON customer_configurations FOR ALL
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_configs_org_id ON customer_configurations(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_configs_vapi_assistant_id ON customer_configurations(vapi_assistant_id);

-- =====================================================
-- 4. SMS Communications Table
-- =====================================================

CREATE TABLE IF NOT EXISTS sms_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.user_profiles(id), -- Link to user_profiles if customer is a user, or can be NULL
    phone_number VARCHAR(20) NOT NULL, -- The recipient/sender phone number
    message_type VARCHAR(50) NOT NULL, -- 'appointment_confirmation', 'emergency_alert', 'incoming_reply', etc.
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')), -- 'inbound' or 'outbound'
    language_code VARCHAR(5) DEFAULT 'en',
    message_content TEXT NOT NULL,
    external_message_id VARCHAR(255), -- e.g., Twilio SID
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'received', 'read')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ, -- For inbound messages
    read_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for sms_communications
ALTER TABLE sms_communications ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can view their SMS communications
CREATE POLICY "Organization members can view their SMS communications"
ON sms_communications FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- Policy: Organization members can insert outbound SMS communications
CREATE POLICY "Organization members can insert outbound SMS communications"
ON sms_communications FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    ) AND direction = 'outbound'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_org_id ON sms_communications(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_phone_number ON sms_communications(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_external_id ON sms_communications(external_message_id);

-- =====================================================
-- 5. Call Logs Table
-- =====================================================

CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_configuration_id UUID REFERENCES public.customer_configurations(id),
    vapi_call_id VARCHAR(255) UNIQUE NOT NULL, -- Unique ID from Vapi.ai
    phone_number VARCHAR(20) NOT NULL, -- Customer's phone number
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    status VARCHAR(50) NOT NULL, -- 'completed', 'failed', 'in_progress', 'abandoned'
    detected_language VARCHAR(5) DEFAULT 'en',
    transcript TEXT,
    summary TEXT,
    call_outcome JSONB, -- e.g., {'type': 'appointment_booked', 'appointment_id': '...' }
    emergency_detected BOOLEAN DEFAULT FALSE,
    emergency_details JSONB,
    cost NUMERIC(10, 4), -- Cost of the call (Vapi.ai, LLM, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for call_logs
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can view their call logs
CREATE POLICY "Organization members can view their call logs"
ON call_logs FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- Policy: Organization members can insert call logs (e.g., from webhook)
CREATE POLICY "Organization members can insert call logs"
ON call_logs FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_logs_org_id ON call_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_vapi_call_id ON call_logs(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_phone_number ON call_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_start_time ON call_logs(start_time);

-- =====================================================
-- 6. Appointments Table
-- =====================================================

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_configuration_id UUID REFERENCES public.customer_configurations(id),
    call_log_id UUID REFERENCES public.call_logs(id), -- Link to the call that booked this appointment
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    service_type VARCHAR(100) NOT NULL, -- e.g., 'Emergency HVAC', 'Routine Plumbing', 'Dental Checkup'
    scheduled_start_time TIMESTAMPTZ NOT NULL,
    scheduled_end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    confirmation_sent_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can view their appointments
CREATE POLICY "Organization members can view their appointments"
ON appointments FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- Policy: Organization members can insert appointments
CREATE POLICY "Organization members can insert appointments"
ON appointments FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- Policy: Owners and admins can update appointments
CREATE POLICY "Owners and admins can update appointments"
ON appointments FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_org_id ON appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone ON appointments(customer_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_time ON appointments(scheduled_start_time);

-- =====================================================
-- 7. Database Functions
-- =====================================================

-- Function to get organization settings
CREATE OR REPLACE FUNCTION get_organization_settings(p_organization_id UUID)
RETURNS TABLE (
    organization_id UUID,
    default_language VARCHAR,
    supported_languages VARCHAR[],
    default_timezone VARCHAR,
    sms_enabled BOOLEAN,
    email_notifications_enabled BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        os.organization_id,
        os.default_language,
        os.supported_languages,
        os.default_timezone,
        os.sms_enabled,
        os.email_notifications_enabled
    FROM organization_settings os
    WHERE os.organization_id = p_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all active templates for an organization's supported languages
CREATE OR REPLACE FUNCTION get_organization_templates(p_organization_id UUID)
RETURNS TABLE (
    template_id UUID,
    industry_code VARCHAR,
    language_code VARCHAR,
    display_name VARCHAR,
    template_config JSONB,
    emergency_patterns JSONB,
    appointment_types JSONB,
    required_fields JSONB,
    sms_templates JSONB,
    cultural_guidelines JSONB,
    integration_requirements JSONB,
    version INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        it.id,
        it.industry_code,
        it.language_code,
        it.display_name,
        it.template_config,
        it.emergency_patterns,
        it.appointment_types,
        it.required_fields,
        it.sms_templates,
        it.cultural_guidelines,
        it.integration_requirements,
        it.version
    FROM industry_templates it
    JOIN organization_settings os ON os.organization_id = p_organization_id
    WHERE it.is_active = TRUE
    AND it.language_code = ANY(os.supported_languages);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get detailed customer configuration including template details
CREATE OR REPLACE FUNCTION get_customer_config_details(p_customer_config_id UUID)
RETURNS TABLE (
    config_id UUID,
    organization_id UUID,
    industry_template_id UUID,
    primary_language VARCHAR,
    secondary_languages VARCHAR[],
    sms_preferences JSONB,
    custom_config JSONB,
    vapi_assistant_id VARCHAR,
    vapi_phone_number VARCHAR,
    twilio_phone_number VARCHAR,
    template_display_name VARCHAR,
    template_industry_code VARCHAR,
    template_language_code VARCHAR,
    template_emergency_patterns JSONB,
    template_appointment_types JSONB,
    template_sms_templates JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.id,
        cc.organization_id,
        cc.industry_template_id,
        cc.primary_language,
        cc.secondary_languages,
        cc.sms_preferences,
        cc.custom_config,
        cc.vapi_assistant_id,
        cc.vapi_phone_number,
        cc.twilio_phone_number,
        it.display_name,
        it.industry_code,
        it.language_code,
        it.emergency_patterns,
        it.appointment_types,
        it.sms_templates
    FROM customer_configurations cc
    LEFT JOIN industry_templates it ON cc.industry_template_id = it.id
    WHERE cc.id = p_customer_config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a summary of call logs for an organization
CREATE OR REPLACE FUNCTION get_organization_call_summary(p_organization_id UUID, p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS TABLE (
    total_calls BIGINT,
    completed_calls BIGINT,
    emergency_calls BIGINT,
    avg_duration_seconds NUMERIC,
    calls_by_language JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(cl.id) AS total_calls,
        COUNT(CASE WHEN cl.status = 'completed' THEN 1 END) AS completed_calls,
        COUNT(CASE WHEN cl.emergency_detected = TRUE THEN 1 END) AS emergency_calls,
        AVG(cl.duration_seconds) AS avg_duration_seconds,
        jsonb_object_agg(cl.detected_language, language_counts.count) AS calls_by_language
    FROM call_logs cl
    LEFT JOIN (
        SELECT detected_language, COUNT(id) AS count
        FROM call_logs
        WHERE organization_id = p_organization_id
        AND start_time BETWEEN p_start_date AND p_end_date
        GROUP BY detected_language
    ) AS language_counts ON cl.detected_language = language_counts.detected_language
    WHERE cl.organization_id = p_organization_id
    AND cl.start_time BETWEEN p_start_date AND p_end_date
    GROUP BY p_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a summary of SMS communications for an organization
CREATE OR REPLACE FUNCTION get_organization_sms_summary(p_organization_id UUID, p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS TABLE (
    total_sms BIGINT,
    outbound_sms BIGINT,
    inbound_sms BIGINT,
    delivered_sms BIGINT,
    failed_sms BIGINT,
    sms_by_language JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(sc.id) AS total_sms,
        COUNT(CASE WHEN sc.direction = 'outbound' THEN 1 END) AS outbound_sms,
        COUNT(CASE WHEN sc.direction = 'inbound' THEN 1 END) AS inbound_sms,
        COUNT(CASE WHEN sc.status = 'delivered' THEN 1 END) AS delivered_sms,
        COUNT(CASE WHEN sc.status = 'failed' THEN 1 END) AS failed_sms,
        jsonb_object_agg(sc.language_code, language_counts.count) AS sms_by_language
    FROM sms_communications sc
    LEFT JOIN (
        SELECT language_code, COUNT(id) AS count
        FROM sms_communications
        WHERE organization_id = p_organization_id
        AND created_at BETWEEN p_start_date AND p_end_date
        GROUP BY language_code
    ) AS language_counts ON sc.language_code = language_counts.language_code
    WHERE sc.organization_id = p_organization_id
    AND sc.created_at BETWEEN p_start_date AND p_end_date
    GROUP BY p_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get appointments for an organization
CREATE OR REPLACE FUNCTION get_organization_appointments(p_organization_id UUID, p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS TABLE (
    appointment_id UUID,
    customer_name VARCHAR,
    customer_phone VARCHAR,
    service_type VARCHAR,
    scheduled_start_time TIMESTAMPTZ,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.customer_name,
        a.customer_phone,
        a.service_type,
        a.scheduled_start_time,
        a.status
    FROM appointments a
    WHERE a.organization_id = p_organization_id
    AND a.scheduled_start_time BETWEEN p_start_date AND p_end_date
    ORDER BY a.scheduled_start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. Triggers and Auto-Creation
-- =====================================================

-- Trigger to create default settings on new organization creation
CREATE OR REPLACE FUNCTION public.handle_new_organization_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_settings (organization_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_organization_created_create_settings
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization_settings();

-- =====================================================
-- 9. Comments and Documentation
-- =====================================================

COMMENT ON TABLE organization_settings IS 'Organization-specific settings including language preferences and SMS configuration';
COMMENT ON TABLE industry_templates IS 'Multi-language industry templates for AI assistants with cultural guidelines';
COMMENT ON TABLE customer_configurations IS 'Customer-specific AI assistant configurations linked to industry templates';
COMMENT ON TABLE sms_communications IS 'SMS message tracking and analytics with language support';
COMMENT ON TABLE call_logs IS 'AI phone call logs with emergency detection and language tracking';
COMMENT ON TABLE appointments IS 'Service appointments booked through AI assistants with SMS tracking';

COMMENT ON FUNCTION get_organization_settings(UUID) IS 'Get organization settings including language and SMS preferences';
COMMENT ON FUNCTION get_organization_templates(UUID) IS 'Get all active templates for an organization based on supported languages';
COMMENT ON FUNCTION get_customer_config_details(UUID) IS 'Get detailed customer configuration with template information';
COMMENT ON FUNCTION get_organization_call_summary(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Get call analytics summary for an organization';
COMMENT ON FUNCTION get_organization_sms_summary(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Get SMS analytics summary for an organization';
COMMENT ON FUNCTION get_organization_appointments(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Get appointments for an organization within date range';
