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

-- 2. Check which required columns exist (run each separately if needed):
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'findings'
  AND column_name IN ('id', 'scan_id', 'finding_type', 'description', 'recommendation', 'severity', 'created_at', 'artifact_id')
ORDER BY column_name;

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
    column_name,
    data_type,
    column_default,
    is_generated,
    generation_expression
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'findings'
  AND column_name = 'type';

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

-- 6. Simple check - list all columns in findings table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'findings' 
ORDER BY ordinal_position;