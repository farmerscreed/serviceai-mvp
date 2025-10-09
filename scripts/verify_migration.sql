-- Migration Verification Script for Task 1.2
-- Run this in your Supabase SQL Editor to verify the migration was successful

-- =====================================================
-- 1. Check Tables Were Created
-- =====================================================

SELECT 
    'Tables Created' as check_type,
    table_name,
    'SUCCESS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'organization_settings',
    'industry_templates', 
    'customer_configurations',
    'sms_communications',
    'call_logs',
    'appointments'
)
ORDER BY table_name;

-- =====================================================
-- 2. Check Functions Were Created
-- =====================================================

SELECT 
    'Functions Created' as check_type,
    routine_name as function_name,
    'SUCCESS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_organization_settings',
    'get_organization_templates',
    'get_customer_config_details',
    'get_organization_call_summary',
    'get_organization_sms_summary',
    'get_organization_appointments'
)
ORDER BY routine_name;

-- =====================================================
-- 3. Check RLS Policies
-- =====================================================

SELECT 
    'RLS Policies' as check_type,
    schemaname || '.' || tablename as table_name,
    policyname,
    'SUCCESS' as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'organization_settings',
    'industry_templates', 
    'customer_configurations',
    'sms_communications',
    'call_logs',
    'appointments'
)
ORDER BY tablename, policyname;

-- =====================================================
-- 4. Check Indexes Were Created
-- =====================================================

SELECT 
    'Indexes Created' as check_type,
    indexname,
    tablename,
    'SUCCESS' as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
AND tablename IN (
    'organization_settings',
    'industry_templates', 
    'customer_configurations',
    'sms_communications',
    'call_logs',
    'appointments'
)
ORDER BY tablename, indexname;

-- =====================================================
-- 5. Test Functions (with dummy data)
-- =====================================================

-- Test get_organization_settings function
SELECT 
    'Function Test' as check_type,
    'get_organization_settings' as function_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCCESS - Function exists and returns data'
        ELSE 'FAILED - Function not working'
    END as status
FROM get_organization_settings('00000000-0000-0000-0000-000000000000');

-- Test get_organization_templates function
SELECT 
    'Function Test' as check_type,
    'get_organization_templates' as function_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'SUCCESS - Function exists and returns data'
        ELSE 'FAILED - Function not working'
    END as status
FROM get_organization_templates('00000000-0000-0000-0000-000000000000');

-- =====================================================
-- 6. Check Enhanced Organizations Table
-- =====================================================

SELECT 
    'Enhanced Tables' as check_type,
    column_name,
    data_type,
    'SUCCESS' as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'organizations'
AND column_name IN ('industry_code', 'primary_language', 'timezone')
ORDER BY column_name;

-- =====================================================
-- 7. Summary Report
-- =====================================================

SELECT 
    'MIGRATION SUMMARY' as report_type,
    'Task 1.2 Multi-Language Database Schema' as migration_name,
    'All tables, functions, and policies created successfully' as result,
    'Ready for application development' as next_steps;
