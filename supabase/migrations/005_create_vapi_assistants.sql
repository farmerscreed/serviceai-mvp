-- Migration: Create Vapi Assistants Table
-- Task 2.1: Multi-Language Vapi Assistant Creation

-- Create vapi_assistants table
CREATE TABLE IF NOT EXISTS vapi_assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    industry_code VARCHAR(50) NOT NULL,
    language_code VARCHAR(5) NOT NULL DEFAULT 'en',
    vapi_assistant_id VARCHAR(255) UNIQUE NOT NULL,
    vapi_phone_number VARCHAR(20),
    template_id UUID REFERENCES industry_templates(id),
    business_data JSONB NOT NULL,
    voice_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vapi_assistants_org_id ON vapi_assistants(organization_id);
CREATE INDEX IF NOT EXISTS idx_vapi_assistants_industry ON vapi_assistants(industry_code);
CREATE INDEX IF NOT EXISTS idx_vapi_assistants_language ON vapi_assistants(language_code);
CREATE INDEX IF NOT EXISTS idx_vapi_assistants_vapi_id ON vapi_assistants(vapi_assistant_id);
CREATE INDEX IF NOT EXISTS idx_vapi_assistants_active ON vapi_assistants(is_active);

-- Enable RLS
ALTER TABLE vapi_assistants ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access their organization assistants
CREATE POLICY "Users can access their organization assistants"
ON vapi_assistants FOR ALL
USING (
    organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vapi_assistants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_vapi_assistants_updated_at
    BEFORE UPDATE ON vapi_assistants
    FOR EACH ROW
    EXECUTE FUNCTION update_vapi_assistants_updated_at();

-- Create function to get assistant statistics
CREATE OR REPLACE FUNCTION get_assistant_stats(p_organization_id UUID)
RETURNS TABLE (
    total_assistants BIGINT,
    active_assistants BIGINT,
    by_industry JSONB,
    by_language JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_assistants,
        COUNT(*) FILTER (WHERE is_active = TRUE) as active_assistants,
        jsonb_object_agg(industry_code, industry_count) as by_industry,
        jsonb_object_agg(language_code, language_count) as by_language
    FROM (
        SELECT 
            industry_code,
            language_code,
            COUNT(*) as industry_count,
            COUNT(*) as language_count
        FROM vapi_assistants
        WHERE organization_id = p_organization_id
        GROUP BY industry_code, language_code
    ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get assistant by phone number
CREATE OR REPLACE FUNCTION get_assistant_by_phone(p_phone_number VARCHAR)
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    industry_code VARCHAR,
    language_code VARCHAR,
    vapi_assistant_id VARCHAR,
    business_data JSONB,
    voice_config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        va.id,
        va.organization_id,
        va.industry_code,
        va.language_code,
        va.vapi_assistant_id,
        va.business_data,
        va.voice_config
    FROM vapi_assistants va
    WHERE va.vapi_phone_number = p_phone_number
    AND va.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to deactivate old assistants
CREATE OR REPLACE FUNCTION deactivate_old_assistants()
RETURNS INTEGER AS $$
DECLARE
    deactivated_count INTEGER;
BEGIN
    UPDATE vapi_assistants
    SET is_active = FALSE
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND is_active = TRUE;
    
    GET DIAGNOSTICS deactivated_count = ROW_COUNT;
    RETURN deactivated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE vapi_assistants IS 'Stores Vapi.ai assistant configurations with multi-language support';
COMMENT ON COLUMN vapi_assistants.organization_id IS 'Organization that owns this assistant';
COMMENT ON COLUMN vapi_assistants.industry_code IS 'Industry template used (hvac, plumbing, electrical)';
COMMENT ON COLUMN vapi_assistants.language_code IS 'Primary language for assistant (en, es)';
COMMENT ON COLUMN vapi_assistants.vapi_assistant_id IS 'Vapi.ai assistant ID';
COMMENT ON COLUMN vapi_assistants.vapi_phone_number IS 'Phone number assigned to assistant';
COMMENT ON COLUMN vapi_assistants.template_id IS 'Reference to industry template';
COMMENT ON COLUMN vapi_assistants.business_data IS 'Business information and settings';
COMMENT ON COLUMN vapi_assistants.voice_config IS 'Voice configuration (provider, voiceId, speed, pitch)';
COMMENT ON COLUMN vapi_assistants.is_active IS 'Whether assistant is currently active';

-- Create view for active assistants with template info
CREATE OR REPLACE VIEW active_assistants_with_templates AS
SELECT 
    va.id,
    va.organization_id,
    va.industry_code,
    va.language_code,
    va.vapi_assistant_id,
    va.vapi_phone_number,
    va.business_data,
    va.voice_config,
    va.created_at,
    va.updated_at,
    it.display_name as template_display_name,
    it.template_config,
    it.emergency_patterns,
    it.appointment_types,
    it.sms_templates
FROM vapi_assistants va
LEFT JOIN industry_templates it ON va.template_id = it.id
WHERE va.is_active = TRUE;

-- Grant permissions
GRANT SELECT ON active_assistants_with_templates TO authenticated;
GRANT EXECUTE ON FUNCTION get_assistant_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_assistant_by_phone(VARCHAR) TO authenticated;
