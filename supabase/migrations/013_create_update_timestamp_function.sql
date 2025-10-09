-- ============================================================================
-- GENERIC TIMESTAMP UPDATE FUNCTION
-- Migration 013: Create reusable update_updated_at_column() function
-- ============================================================================
-- This function is used by triggers across multiple tables to automatically
-- update the updated_at column whenever a row is updated.
-- ============================================================================

-- Create or replace the generic timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Generic trigger function to automatically update updated_at timestamp on row updates';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO postgres, service_role, authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 013 completed successfully!';
    RAISE NOTICE 'Created function: update_updated_at_column()';
    RAISE NOTICE 'This function can now be used by triggers on any table with an updated_at column';
END $$;

