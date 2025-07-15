-- Fix Supabase schema to match Fly PostgreSQL schema
-- Run this in your Supabase SQL editor

-- 1. Add missing columns to findings table if they don't exist
ALTER TABLE findings 
ADD COLUMN IF NOT EXISTS attack_type_code text,
ADD COLUMN IF NOT EXISTS eal_ml numeric,
ADD COLUMN IF NOT EXISTS scan_id text;

-- 2. Check if 'type' column exists in findings (it shouldn't based on the error)
-- If it does exist and is causing issues, we might need to drop it
-- But first, let's see what columns actually exist in your Supabase findings table

-- 3. Add indexes to match Fly database (for performance)
CREATE INDEX IF NOT EXISTS idx_findings_attack_type 
ON findings(attack_type_code) 
WHERE attack_type_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_findings_scan_eal 
ON findings(scan_id, attack_type_code) 
WHERE eal_ml IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_findings_severity_eal 
ON findings(severity, eal_ml) 
WHERE eal_ml > 0;

CREATE INDEX IF NOT EXISTS idx_findings_eal_calc 
ON findings(finding_type, severity, attack_type_code) 
WHERE eal_ml IS NULL;

CREATE INDEX IF NOT EXISTS idx_findings_scan_id 
ON findings(scan_id);

-- 4. Add indexes for artifacts table
CREATE INDEX IF NOT EXISTS idx_artifacts_meta_scan_id 
ON artifacts((meta->>'scan_id'));

CREATE INDEX IF NOT EXISTS idx_artifacts_dow_meta 
ON artifacts USING gin(meta) 
WHERE type = 'denial_wallet_endpoint';

-- 5. First, let's check what columns exist in your Supabase tables
-- Run this query to see current schema:
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('findings', 'artifacts')
ORDER BY table_name, ordinal_position;