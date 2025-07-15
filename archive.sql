-- Database Archival Script
-- Archives existing scan data and cleans production tables

BEGIN;

-- Check current data counts
SELECT 'CURRENT DATA COUNTS' as status;
SELECT 'artifacts' as table_name, COUNT(*) as record_count FROM artifacts
UNION ALL
SELECT 'findings' as table_name, COUNT(*) as record_count FROM findings  
UNION ALL
SELECT 'scans_master' as table_name, COUNT(*) as record_count FROM scans_master;

-- Create archive tables
CREATE TABLE IF NOT EXISTS artifacts_archive (
  LIKE artifacts INCLUDING ALL,
  archived_at TIMESTAMP DEFAULT NOW(),
  archive_reason VARCHAR(255) DEFAULT 'production_reset'
);

CREATE TABLE IF NOT EXISTS findings_archive (
  LIKE findings INCLUDING ALL,
  archived_at TIMESTAMP DEFAULT NOW(),
  archive_reason VARCHAR(255) DEFAULT 'production_reset'
);

CREATE TABLE IF NOT EXISTS scans_master_archive (
  LIKE scans_master INCLUDING ALL,
  archived_at TIMESTAMP DEFAULT NOW(),
  archive_reason VARCHAR(255) DEFAULT 'production_reset'
);

SELECT 'ARCHIVE TABLES CREATED' as status;

-- Copy data to archive tables
INSERT INTO artifacts_archive 
(id, type, val_text, severity, src_url, sha256, mime, meta, created_at)
SELECT id, type, val_text, severity, src_url, sha256, mime, meta, created_at 
FROM artifacts;

INSERT INTO findings_archive 
(id, artifact_id, finding_type, recommendation, description, created_at)
SELECT id, artifact_id, finding_type, recommendation, description, created_at 
FROM findings;

INSERT INTO scans_master_archive 
(scan_id, company_name, domain, status, progress, current_module, total_modules, 
 created_at, updated_at, completed_at, error_message, total_findings_count, 
 max_severity, total_artifacts_count)
SELECT scan_id, company_name, domain, status, progress, current_module, total_modules,
       created_at, updated_at, completed_at, error_message, total_findings_count,
       max_severity, total_artifacts_count
FROM scans_master;

SELECT 'DATA COPIED TO ARCHIVE' as status;

-- Verify archive counts
SELECT 'ARCHIVE VERIFICATION' as status;
SELECT 'artifacts_archive' as table_name, COUNT(*) as record_count FROM artifacts_archive
UNION ALL
SELECT 'findings_archive' as table_name, COUNT(*) as record_count FROM findings_archive  
UNION ALL
SELECT 'scans_master_archive' as table_name, COUNT(*) as record_count FROM scans_master_archive;

-- Clean production tables (in dependency order)
TRUNCATE findings CASCADE;
TRUNCATE artifacts CASCADE; 
TRUNCATE scans_master CASCADE;
DELETE FROM worker_instances;

-- Reset sequences
ALTER SEQUENCE IF EXISTS artifacts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS findings_id_seq RESTART WITH 1;

SELECT 'PRODUCTION TABLES CLEANED' as status;

-- Final verification
SELECT 'FINAL VERIFICATION' as status;
SELECT 'artifacts' as table_name, COUNT(*) as record_count FROM artifacts
UNION ALL
SELECT 'findings' as table_name, COUNT(*) as record_count FROM findings  
UNION ALL
SELECT 'scans_master' as table_name, COUNT(*) as record_count FROM scans_master;

-- Create archive summary view
CREATE OR REPLACE VIEW archived_scans AS 
SELECT 
  s.*,
  COUNT(DISTINCT a.id) as artifact_count,
  COUNT(DISTINCT f.id) as finding_count
FROM scans_master_archive s
LEFT JOIN artifacts_archive a ON a.meta->>'scan_id' = s.scan_id  
LEFT JOIN findings_archive f ON f.artifact_id = a.id
GROUP BY s.scan_id, s.company_name, s.domain, s.status, s.progress, 
         s.current_module, s.total_modules, s.created_at, s.updated_at,
         s.completed_at, s.error_message, s.total_findings_count,
         s.max_severity, s.total_artifacts_count, s.archived_at,
         s.archive_reason;

SELECT 'ARCHIVAL COMPLETE - DATABASE READY FOR FRESH SCANS' as status;

COMMIT;