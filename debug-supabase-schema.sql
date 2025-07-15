-- Debug queries to understand the Supabase schema issue

-- 1. Get the exact schema of the findings table in Supabase
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'findings'
ORDER BY ordinal_position;

-- 2. Get any column privileges that might be blocking inserts
SELECT 
    grantee,
    table_name,
    column_name,
    privilege_type
FROM information_schema.column_privileges
WHERE table_name = 'findings'
  AND column_name = 'type';

-- 3. Check for any triggers on the findings table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'findings';

-- 4. Check if there are any check constraints
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'findings'::regclass
  AND contype = 'c';

-- 5. Get column generation expressions if any
SELECT 
    attname AS column_name,
    pg_get_expr(adbin, adrelid) AS generation_expression
FROM pg_attribute
JOIN pg_attrdef ON attrelid = adrelid AND attnum = adnum
WHERE attrelid = 'findings'::regclass
  AND attname = 'type';