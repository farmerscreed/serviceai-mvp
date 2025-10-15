-- Migration: Fix organization_members foreign key to user_profiles
-- Date: 2025-10-11
-- Purpose: Add missing foreign key relationship between organization_members and user_profiles

-- First, check if the foreign key already exists and drop it if it does
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'organization_members_user_id_fkey'
        AND table_name = 'organization_members'
    ) THEN
        ALTER TABLE organization_members
        DROP CONSTRAINT organization_members_user_id_fkey;
    END IF;
END $$;

-- Add the foreign key relationship
ALTER TABLE organization_members
ADD CONSTRAINT organization_members_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES user_profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id
ON organization_members(user_id);

-- Create an index for organization lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_org_user
ON organization_members(organization_id, user_id);

-- Add comment to document the relationship
COMMENT ON CONSTRAINT organization_members_user_id_fkey ON organization_members IS
'Foreign key linking organization members to their user profiles. Cascades on delete to remove memberships when users are deleted.';

-- Verify the foreign key was created successfully
DO $$
DECLARE
    fk_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'organization_members_user_id_fkey'
        AND table_name = 'organization_members'
    ) INTO fk_exists;

    IF fk_exists THEN
        RAISE NOTICE '✅ Foreign key organization_members_user_id_fkey created successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to create foreign key organization_members_user_id_fkey';
    END IF;
END $$;
