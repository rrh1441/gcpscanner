-- Run these queries in Supabase SQL editor to check current state

-- 1. Check findings table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'findings'
ORDER BY ordinal_position;

-- 2. Check if these required columns exist:
-- Expected by sync worker: id, scan_id, finding_type, description, recommendation, severity, created_at, artifact_id
SELECT 
    'findings' as table_name,
    'Required columns' as check_type,
    CASE 
        WHEN COUNT(*) FILTER (WHERE column_name = 'id') > 0 THEN '✓ id' ELSE '✗ id missing' 
    END || ', ' ||
    CASE 
        WHEN COUNT(*) FILTER (WHERE column_name = 'scan_id') > 0 THEN '✓ scan_id' ELSE '✗ scan_id missing' 
    END || ', ' ||
    CASE 
        WHEN COUNT(*) FILTER (WHERE column_name = 'finding_type') > 0 THEN '✓ finding_type' ELSE '✗ finding_type missing' 
    END || ', ' ||
    CASE 
        WHEN COUNT(*) FILTER (WHERE column_name = 'description') > 0 THEN '✓ description' ELSE '✗ description missing' 
    END || ', ' ||
    CASE 
        WHEN COUNT(*) FILTER (WHERE column_name = 'recommendation') > 0 THEN '✓ recommendation' ELSE '✗ recommendation missing' 
    END || ', ' ||
    CASE 
        WHEN COUNT(*) FILTER (WHERE column_name = 'severity') > 0 THEN '✓ severity' ELSE '✗ severity missing' 
    END || ', ' ||
    CASE 
        WHEN COUNT(*) FILTER (WHERE column_name = 'created_at') > 0 THEN '✓ created_at' ELSE '✗ created_at missing' 
    END || ', ' ||
    CASE 
        WHEN COUNT(*) FILTER (WHERE column_name = 'artifact_id') > 0 THEN '✓ artifact_id' ELSE '✗ artifact_id missing' 
    END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'findings';

-- 3. Check artifacts table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'artifacts'
ORDER BY ordinal_position;

-- 4. Check what the 'type' column issue might be
SELECT 
    c.column_name,
    c.data_type,
    c.column_default,
    c.is_generated,
    c.generation_expression
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
  AND c.table_name = 'findings'
  AND c.column_name = 'type';

-- 5. Check for any RLS policies that might block inserts
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('findings', 'artifacts', 'scan_status', 'compromised_credentials')
ORDER BY tablename, policyname;