-- Add organization-specific phone number configuration
-- This allows each organization (tenant) to have their own phone number settings

-- Add phone configuration columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS phone_provider VARCHAR(20) DEFAULT 'vapi',
ADD COLUMN IF NOT EXISTS twilio_account_sid VARCHAR(255),
ADD COLUMN IF NOT EXISTS twilio_auth_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS twilio_phone_numbers TEXT[], -- Array of available Twilio numbers
ADD COLUMN IF NOT EXISTS byo_sip_credential_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone_config_metadata JSONB DEFAULT '{}';

-- Add comment explaining the columns
COMMENT ON COLUMN organizations.phone_provider IS 'Preferred phone provider: vapi (free), twilio, byo-sip';
COMMENT ON COLUMN organizations.twilio_account_sid IS 'Organization-specific Twilio Account SID';
COMMENT ON COLUMN organizations.twilio_auth_token IS 'Organization-specific Twilio Auth Token (encrypted recommended)';
COMMENT ON COLUMN organizations.twilio_phone_numbers IS 'Array of Twilio phone numbers owned by this organization';
COMMENT ON COLUMN organizations.byo_sip_credential_id IS 'Vapi credential ID for organization BYO SIP trunk';
COMMENT ON COLUMN organizations.phone_config_metadata IS 'Additional phone configuration metadata';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_phone_provider ON organizations(phone_provider);

-- Add phone number tracking to vapi_assistants
ALTER TABLE vapi_assistants
ADD COLUMN IF NOT EXISTS phone_provider VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_number_metadata JSONB DEFAULT '{}';

COMMENT ON COLUMN vapi_assistants.phone_provider IS 'Provider used for this assistant phone number: vapi, twilio, byo-sip';
COMMENT ON COLUMN vapi_assistants.phone_number_metadata IS 'Additional metadata about the phone number assignment';

-- Create a table to track phone number usage across organizations
CREATE TABLE IF NOT EXISTS phone_number_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    phone_provider VARCHAR(20) NOT NULL,
    vapi_phone_number_id VARCHAR(255),
    assistant_id UUID REFERENCES vapi_assistants(id) ON DELETE SET NULL,
    vapi_assistant_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for phone_number_assignments
CREATE INDEX IF NOT EXISTS idx_phone_assignments_org ON phone_number_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_phone_assignments_number ON phone_number_assignments(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_assignments_status ON phone_number_assignments(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_assignments_active_number ON phone_number_assignments(phone_number) 
    WHERE status = 'active';

-- Enable RLS
ALTER TABLE phone_number_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phone_number_assignments
CREATE POLICY "Users can view their organization's phone assignments"
    ON phone_number_assignments
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage their organization's phone assignments"
    ON phone_number_assignments
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Function to get available phone numbers for an organization
CREATE OR REPLACE FUNCTION get_available_phone_numbers(org_id UUID)
RETURNS TABLE (
    phone_number VARCHAR(20),
    phone_provider VARCHAR(20),
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        UNNEST(o.twilio_phone_numbers) as phone_number,
        'twilio' as phone_provider,
        NOT EXISTS (
            SELECT 1 FROM phone_number_assignments pa
            WHERE pa.phone_number = UNNEST(o.twilio_phone_numbers)
            AND pa.status = 'active'
        ) as is_available
    FROM organizations o
    WHERE o.id = org_id
    AND o.twilio_phone_numbers IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track phone number usage stats
CREATE OR REPLACE FUNCTION get_phone_number_stats(org_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_numbers', COUNT(*),
        'active_numbers', COUNT(*) FILTER (WHERE status = 'active'),
        'by_provider', json_object_agg(phone_provider, provider_count)
    ) INTO result
    FROM (
        SELECT 
            phone_provider,
            COUNT(*) as provider_count
        FROM phone_number_assignments
        WHERE organization_id = org_id
        GROUP BY phone_provider
    ) provider_stats;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at trigger
CREATE TRIGGER update_phone_assignments_updated_at
    BEFORE UPDATE ON phone_number_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

