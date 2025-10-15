-- Migration 026: Consolidate VAPI Assistant Data (Option A)
-- Purpose: Migrate to single source of truth using vapi_assistants table
-- Date: 2025-10-13

-- Step 1: Migrate any existing data from customer_configurations to vapi_assistants
-- This ensures we don't lose any assistant data that might only exist in customer_configurations
INSERT INTO vapi_assistants (
  organization_id,
  industry_code,
  language_code,
  vapi_assistant_id,
  vapi_phone_number,
  template_id,
  business_data,
  voice_config,
  is_active,
  created_at,
  updated_at
)
SELECT
  cc.organization_id,
  COALESCE(it.industry_code, 'general') as industry_code,
  cc.primary_language as language_code,
  cc.vapi_assistant_id,
  cc.vapi_phone_number,
  cc.industry_template_id as template_id,
  COALESCE(cc.custom_config, '{}'::jsonb) as business_data,
  jsonb_build_object(
    'provider', 'vapi',
    'voiceId', 'Paige',
    'speed', 1.0
  ) as voice_config,
  cc.is_active,
  cc.created_at,
  NOW() as updated_at
FROM customer_configurations cc
LEFT JOIN industry_templates it ON it.id = cc.industry_template_id
WHERE cc.vapi_assistant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM vapi_assistants va
    WHERE va.vapi_assistant_id = cc.vapi_assistant_id
  )
ON CONFLICT (vapi_assistant_id) DO NOTHING;

-- Step 2: Remove duplicate columns from customer_configurations
-- Keep the table for SMS preferences and custom config, but remove VAPI-specific columns
ALTER TABLE customer_configurations
  DROP COLUMN IF EXISTS vapi_assistant_id,
  DROP COLUMN IF EXISTS vapi_phone_number;

-- Step 3: Add comment to document the table's new purpose
COMMENT ON TABLE customer_configurations IS 'Customer-specific configurations for SMS preferences and custom settings. VAPI assistant data is now stored in vapi_assistants table.';

-- Step 4: Verify data integrity
-- This will show a count of assistants in the vapi_assistants table
DO $$
DECLARE
  assistant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO assistant_count FROM vapi_assistants;
  RAISE NOTICE 'Migration complete: % assistants in vapi_assistants table', assistant_count;
END $$;
