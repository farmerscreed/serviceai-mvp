-- ============================================================================
-- VERIFY APPOINTMENTS SCHEMA
-- Migration 017: Ensure service_address column exists
-- ============================================================================

-- This migration ensures the appointments table has the correct schema
-- In case migration 014 wasn't fully applied

DO $$ 
BEGIN
    -- Check if service_address column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'service_address'
    ) THEN
        ALTER TABLE public.appointments 
        ADD COLUMN service_address TEXT;
        
        RAISE NOTICE 'Added service_address column to appointments table';
    ELSE
        RAISE NOTICE 'service_address column already exists';
    END IF;
END $$;

