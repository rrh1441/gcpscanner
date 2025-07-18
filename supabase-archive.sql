-- ========================================
-- SUPABASE DATABASE ARCHIVAL SCRIPT
-- Archives artifacts, findings, and scan_status data
-- ========================================

-- Step 1: Create archive tables
-- ========================================

-- Create artifacts_archive table
CREATE TABLE IF NOT EXISTS public.artifacts_archive (
  id INTEGER NOT NULL,
  type CHARACTER VARYING(50) NOT NULL,
  val_text TEXT NOT NULL,
  severity CHARACTER VARYING(20) DEFAULT 'INFO',
  src_url TEXT,
  sha256 CHARACTER VARYING(64),
  mime CHARACTER VARYING(100),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP DEFAULT NOW(),
  archive_reason VARCHAR(255) DEFAULT 'production_reset',
  original_table VARCHAR(50) DEFAULT 'artifacts'
);

-- Create findings_archive table  
CREATE TABLE IF NOT EXISTS public.findings_archive (
  id BIGINT NOT NULL,
  artifact_id BIGINT NOT NULL,
  finding_type CHARACTER VARYING(50) NOT NULL,
  recommendation TEXT NOT NULL,
  description TEXT NOT NULL,
  repro_command TEXT,
  remediation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scan_id CHARACTER VARYING(255),
  type CHARACTER VARYING(50),
  severity CHARACTER VARYING(20),
  attack_type_code TEXT,
  state CHARACTER VARYING(50) DEFAULT 'active',
  eal_low BIGINT,
  eal_ml INTEGER,
  eal_high BIGINT,
  eal_daily INTEGER,
  archived_at TIMESTAMP DEFAULT NOW(),
  archive_reason VARCHAR(255) DEFAULT 'production_reset',
  original_table VARCHAR(50) DEFAULT 'findings'
);

-- Create scan_status_archive table
CREATE TABLE IF NOT EXISTS public.scan_status_archive (
  scan_id VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  progress INTEGER DEFAULT 0,
  total_modules INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  archived_at TIMESTAMP DEFAULT NOW(),
  archive_reason VARCHAR(255) DEFAULT 'production_reset',
  original_table VARCHAR(50) DEFAULT 'scan_status'
);

-- Step 2: Archive existing data
-- ========================================

-- Archive artifacts (parent table first)
INSERT INTO public.artifacts_archive 
(id, type, val_text, severity, src_url, sha256, mime, meta, created_at)
SELECT id, type, val_text, severity, src_url, sha256, mime, meta, created_at 
FROM public.artifacts;

-- Archive findings (child table)
INSERT INTO public.findings_archive 
(id, artifact_id, finding_type, recommendation, description, repro_command, 
 remediation, created_at, scan_id, type, severity, attack_type_code, state, 
 eal_low, eal_ml, eal_high, eal_daily)
SELECT id, artifact_id, finding_type, recommendation, description, repro_command,
       remediation, created_at, scan_id, type, severity, attack_type_code, state,
       eal_low, eal_ml, eal_high, eal_daily
FROM public.findings;

-- Archive scan_status
INSERT INTO public.scan_status_archive 
(scan_id, company_name, domain, status, progress, total_modules, 
 created_at, completed_at, tags)
SELECT scan_id, company_name, domain, status, progress, total_modules,
       created_at, completed_at, tags
FROM public.scan_status;

-- Step 3: Verify archive integrity
-- ========================================

-- Check archive counts vs original counts
SELECT 
  'artifacts' as table_name, COUNT(*) as original_count,
  (SELECT COUNT(*) FROM artifacts_archive) as archive_count
FROM artifacts
UNION ALL
SELECT 
  'findings' as table_name, COUNT(*) as original_count,
  (SELECT COUNT(*) FROM findings_archive) as archive_count  
FROM findings
UNION ALL
SELECT 
  'scan_status' as table_name, COUNT(*) as original_count,
  (SELECT COUNT(*) FROM scan_status_archive) as archive_count
FROM scan_status;

-- Step 4: Clean production tables (UNCOMMENT WHEN READY)
-- ========================================

-- WARNING: This will delete all production data!
-- Only run this after verifying archive integrity above

/*
-- Delete in dependency order (child tables first)
DELETE FROM public.findings;
DELETE FROM public.artifacts;  
DELETE FROM public.scan_status;

-- Reset sequences
SELECT setval('artifacts_id_seq', 1, false);
SELECT setval('findings_id_seq', 1, false);
*/

-- Step 5: Create archive access views
-- ========================================

-- View for archived scans with summary stats
CREATE OR REPLACE VIEW archived_scans_summary AS 
SELECT 
  s.scan_id,
  s.company_name,
  s.domain,
  s.status,
  s.progress,
  s.total_modules,
  s.created_at,
  s.completed_at,
  s.tags,
  s.archived_at,
  s.archive_reason,
  s.original_table,
  COUNT(DISTINCT a.id) as artifact_count,
  COUNT(DISTINCT f.id) as finding_count,
  COUNT(DISTINCT f.id) FILTER (WHERE f.severity = 'CRITICAL') as critical_findings,
  COUNT(DISTINCT f.id) FILTER (WHERE f.severity = 'HIGH') as high_findings,
  COUNT(DISTINCT f.id) FILTER (WHERE f.severity = 'MEDIUM') as medium_findings,
  COUNT(DISTINCT f.id) FILTER (WHERE f.severity = 'LOW') as low_findings
FROM scan_status_archive s
LEFT JOIN artifacts_archive a ON a.meta->>'scan_id' = s.scan_id  
LEFT JOIN findings_archive f ON f.artifact_id = a.id
GROUP BY s.scan_id, s.company_name, s.domain, s.status, s.progress, 
         s.total_modules, s.created_at, s.completed_at, s.tags,
         s.archived_at, s.archive_reason, s.original_table;

-- ========================================
-- USAGE EXAMPLES
-- ========================================

-- View all archived scans
-- SELECT * FROM archived_scans_summary ORDER BY created_at DESC;

-- Get archived findings for a specific scan
-- SELECT * FROM findings_archive WHERE scan_id = 'your_scan_id' ORDER BY severity DESC, created_at DESC;

-- Get archived artifacts for a specific scan  
-- SELECT * FROM artifacts_archive WHERE meta->>'scan_id' = 'your_scan_id' ORDER BY created_at DESC;

-- Check archive statistics
-- SELECT 
--   archive_reason,
--   COUNT(*) as scans_archived,
--   MIN(archived_at) as first_archived,
--   MAX(archived_at) as last_archived
-- FROM scan_status_archive 
-- GROUP BY archive_reason;