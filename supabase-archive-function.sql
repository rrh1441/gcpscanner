-- ========================================
-- SUPABASE DATABASE ARCHIVAL FUNCTION
-- Archives artifacts, findings, scan_status and reports data
-- Usage: SELECT archive_supabase_data();
-- ========================================

DROP FUNCTION IF EXISTS archive_supabase_data();

CREATE OR REPLACE FUNCTION archive_supabase_data()
RETURNS TABLE(
  step TEXT,
  status TEXT,
  details TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  artifacts_count INTEGER;
  findings_count INTEGER;
  scans_count INTEGER;
  reports_count INTEGER;
  archive_artifacts_count INTEGER;
  archive_findings_count INTEGER;
  archive_scans_count INTEGER;
  archive_reports_count INTEGER;
BEGIN
  -- Step 1: Create archive tables
  RETURN QUERY SELECT 'STEP 1'::TEXT, 'STARTING'::TEXT, 'Creating archive tables'::TEXT;
  
  -- Drop existing archive tables if they exist
  DROP TABLE IF EXISTS public.findings_archive CASCADE;
  DROP TABLE IF EXISTS public.artifacts_archive CASCADE;
  DROP TABLE IF EXISTS public.scan_status_archive CASCADE;
  DROP TABLE IF EXISTS public.reports_archive CASCADE;
  
  -- Create artifacts_archive table
  CREATE TABLE public.artifacts_archive (
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
  CREATE TABLE public.findings_archive (
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

  -- Create reports_archive table
  CREATE TABLE public.reports_archive (
    id TEXT NOT NULL,
    user_id TEXT,
    json_url TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_name TEXT,
    domain TEXT,
    scan_id TEXT,
    content TEXT,
    findings_count INTEGER,
    status TEXT,
    archived_at TIMESTAMP DEFAULT NOW(),
    archive_reason VARCHAR(255) DEFAULT 'production_reset',
    original_table VARCHAR(50) DEFAULT 'reports'
  );

  -- Create scan_status_archive table
  CREATE TABLE public.scan_status_archive (
    id UUID NOT NULL,
    scan_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    current_module TEXT,
    total_modules INTEGER DEFAULT 10,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_artifacts_count INTEGER DEFAULT 0,
    max_severity CHARACTER VARYING(20),
    total_findings_count INTEGER DEFAULT 0,
    archived_at TIMESTAMP DEFAULT NOW(),
    archive_reason VARCHAR(255) DEFAULT 'production_reset',
    original_table VARCHAR(50) DEFAULT 'scan_status'
  );

  RETURN QUERY SELECT 'STEP 1'::TEXT, 'COMPLETED'::TEXT, 'Archive tables created'::TEXT;

  -- Step 2: Get current counts
  RETURN QUERY SELECT 'STEP 2'::TEXT, 'STARTING'::TEXT, 'Counting current records'::TEXT;
  
  SELECT COUNT(*) INTO artifacts_count FROM public.artifacts;
  SELECT COUNT(*) INTO findings_count FROM public.findings;  
  SELECT COUNT(*) INTO scans_count FROM public.scan_status;
  SELECT COUNT(*) INTO reports_count FROM public.reports;

  RETURN QUERY SELECT 'STEP 2'::TEXT, 'COMPLETED'::TEXT, 
    FORMAT('Found %s artifacts, %s findings, %s scans, %s reports', artifacts_count, findings_count, scans_count, reports_count)::TEXT;

  -- Step 3: Archive existing data
  RETURN QUERY SELECT 'STEP 3'::TEXT, 'STARTING'::TEXT, 'Archiving data'::TEXT;

  -- Archive artifacts
  INSERT INTO public.artifacts_archive 
  (id, type, val_text, severity, src_url, sha256, mime, meta, created_at)
  SELECT a.id, a.type, a.val_text, a.severity, a.src_url, a.sha256, a.mime, a.meta, a.created_at 
  FROM public.artifacts a;

  -- Archive findings
  INSERT INTO public.findings_archive 
  (id, artifact_id, finding_type, recommendation, description, repro_command, remediation, 
   created_at, scan_id, type, severity, attack_type_code, state, eal_low, eal_ml, eal_high, eal_daily)
  SELECT f.id, f.artifact_id, f.finding_type, f.recommendation, f.description, f.repro_command, f.remediation,
         f.created_at, f.scan_id, f.type, f.severity, f.attack_type_code, f.state, f.eal_low, f.eal_ml, f.eal_high, f.eal_daily
  FROM public.findings f;

  -- Archive reports
  INSERT INTO public.reports_archive 
  (id, user_id, json_url, pdf_url, created_at, company_name, domain, scan_id, content, findings_count, status)
  SELECT r.id, r.user_id, r.json_url, r.pdf_url, r.created_at, r.company_name, r.domain, r.scan_id, r.content, r.findings_count, r.status
  FROM public.reports r;

  -- Archive scan_status
  INSERT INTO public.scan_status_archive 
  (id, scan_id, company_name, domain, status, progress, current_module, total_modules, 
   started_at, last_updated, completed_at, error_message, created_at, updated_at, 
   total_artifacts_count, max_severity, total_findings_count)
  SELECT s.id, s.scan_id, s.company_name, s.domain, s.status, s.progress, s.current_module, s.total_modules,
         s.started_at, s.last_updated, s.completed_at, s.error_message, s.created_at, s.updated_at,
         s.total_artifacts_count, s.max_severity, s.total_findings_count
  FROM public.scan_status s;

  RETURN QUERY SELECT 'STEP 3'::TEXT, 'COMPLETED'::TEXT, 'Data archived successfully'::TEXT;

  -- Step 4: Verify archive integrity
  RETURN QUERY SELECT 'STEP 4'::TEXT, 'STARTING'::TEXT, 'Verifying archive integrity'::TEXT;

  SELECT COUNT(*) INTO archive_artifacts_count FROM artifacts_archive;
  SELECT COUNT(*) INTO archive_findings_count FROM findings_archive;
  SELECT COUNT(*) INTO archive_scans_count FROM scan_status_archive;
  SELECT COUNT(*) INTO archive_reports_count FROM reports_archive;

  IF archive_artifacts_count >= artifacts_count AND 
     archive_findings_count >= findings_count AND 
     archive_scans_count >= scans_count AND
     archive_reports_count >= reports_count THEN
    RETURN QUERY SELECT 'STEP 4'::TEXT, 'COMPLETED'::TEXT, 
      FORMAT('Archive verified: %s/%s artifacts, %s/%s findings, %s/%s scans, %s/%s reports', 
        archive_artifacts_count, artifacts_count, 
        archive_findings_count, findings_count,
        archive_scans_count, scans_count,
        archive_reports_count, reports_count)::TEXT;
  ELSE
    RETURN QUERY SELECT 'STEP 4'::TEXT, 'ERROR'::TEXT, 
      FORMAT('Archive mismatch: %s/%s artifacts, %s/%s findings, %s/%s scans, %s/%s reports', 
        archive_artifacts_count, artifacts_count, 
        archive_findings_count, findings_count,
        archive_scans_count, scans_count,
        archive_reports_count, reports_count)::TEXT;
    RETURN; -- Stop here if verification fails
  END IF;

  -- Step 5: Clean production tables
  RETURN QUERY SELECT 'STEP 5'::TEXT, 'STARTING'::TEXT, 'Cleaning production tables'::TEXT;

  -- Delete in dependency order (child tables first)
  DELETE FROM public.findings;
  DELETE FROM public.artifacts;
  DELETE FROM public.reports;  -- Delete reports before scan_status due to FK constraint
  DELETE FROM public.scan_status;

  -- Reset sequences
  PERFORM setval('artifacts_id_seq', 1, false);
  PERFORM setval('findings_id_seq', 1, false);

  RETURN QUERY SELECT 'STEP 5'::TEXT, 'COMPLETED'::TEXT, 'Production tables cleaned and sequences reset'::TEXT;

  -- Step 6: Create archive access view
  RETURN QUERY SELECT 'STEP 6'::TEXT, 'STARTING'::TEXT, 'Creating archive access view'::TEXT;

  -- View for archived scans with summary stats
  CREATE OR REPLACE VIEW archived_scans_summary AS 
  SELECT 
    s.scan_id,
    s.company_name,
    s.domain,
    s.status,
    s.progress,
    s.total_modules,
    s.started_at,
    s.completed_at,
    s.archived_at,
    s.archive_reason,
    s.original_table,
    COUNT(DISTINCT a.id) as artifact_count,
    COUNT(DISTINCT f.id) as finding_count,
    COUNT(DISTINCT r.id) as report_count,
    COUNT(DISTINCT f.id) FILTER (WHERE f.severity = 'CRITICAL') as critical_findings,
    COUNT(DISTINCT f.id) FILTER (WHERE f.severity = 'HIGH') as high_findings,
    COUNT(DISTINCT f.id) FILTER (WHERE f.severity = 'MEDIUM') as medium_findings,
    COUNT(DISTINCT f.id) FILTER (WHERE f.severity = 'LOW') as low_findings
  FROM scan_status_archive s
  LEFT JOIN artifacts_archive a ON a.meta->>'scan_id' = s.scan_id  
  LEFT JOIN findings_archive f ON f.scan_id = s.scan_id
  LEFT JOIN reports_archive r ON r.scan_id = s.scan_id
  GROUP BY s.scan_id, s.company_name, s.domain, s.status, s.progress, 
           s.total_modules, s.started_at, s.completed_at,
           s.archived_at, s.archive_reason, s.original_table;

  RETURN QUERY SELECT 'STEP 6'::TEXT, 'COMPLETED'::TEXT, 'Archive view created'::TEXT;

  -- Final summary
  RETURN QUERY SELECT 'SUMMARY'::TEXT, 'SUCCESS'::TEXT, 
    FORMAT('Archive complete! %s artifacts, %s findings, %s scans, %s reports archived and production tables cleaned', 
      artifacts_count, findings_count, scans_count, reports_count)::TEXT;

END;
$$;

-- ========================================
-- USAGE
-- ========================================

-- To run the archival process:
-- SELECT * FROM archive_supabase_data();

-- To view archived scans after archival:
-- SELECT * FROM archived_scans_summary ORDER BY started_at DESC;

-- To get archived findings for a specific scan:
-- SELECT * FROM findings_archive WHERE scan_id = 'your_scan_id' ORDER BY severity DESC;

-- To get archived reports for a specific scan:
-- SELECT * FROM reports_archive WHERE scan_id = 'your_scan_id';