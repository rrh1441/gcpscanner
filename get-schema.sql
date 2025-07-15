-- Get complete schema information for findings and artifacts tables

-- Table structure for 'findings'
SELECT 
    'findings' as table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'findings'
ORDER BY ordinal_position;

-- Add a separator
SELECT '---' as separator;

-- Table structure for 'artifacts'
SELECT 
    'artifacts' as table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'artifacts'
ORDER BY ordinal_position;

-- Get constraints for findings
SELECT '---' as separator;
SELECT 
    'findings_constraints' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'findings'::regclass;

-- Get constraints for artifacts
SELECT '---' as separator;
SELECT 
    'artifacts_constraints' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'artifacts'::regclass;

-- Get indexes
SELECT '---' as separator;
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('findings', 'artifacts')
ORDER BY tablename, indexname;