-- Remove remediation column from findings table
-- Remediation functionality has been moved to Supabase

-- Check if column exists before dropping to avoid errors
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'findings' AND column_name = 'remediation'
  ) THEN
    ALTER TABLE findings DROP COLUMN remediation;
    RAISE NOTICE 'Removed remediation column from findings table';
  ELSE
    RAISE NOTICE 'Remediation column does not exist in findings table';
  END IF;
END$$;