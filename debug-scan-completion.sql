-- Run these queries to debug scan completion issues

-- 1. Check recent scans in Supabase scan_status table
SELECT 
    scan_id,
    company_name,
    domain,
    status,
    progress,
    started_at,
    last_updated,
    completed_at,
    total_findings_count
FROM scan_status
ORDER BY last_updated DESC
LIMIT 10;

-- 2. Check if there are any completed scans
SELECT 
    status,
    COUNT(*) as count
FROM scan_status
GROUP BY status
ORDER BY status;

-- 3. Check findings that might belong to non-completed scans
SELECT 
    f.scan_id,
    s.status as scan_status,
    s.progress,
    COUNT(f.id) as finding_count,
    MIN(f.created_at) as first_finding,
    MAX(f.created_at) as last_finding
FROM findings f
LEFT JOIN scan_status s ON f.scan_id = s.scan_id
WHERE f.created_at > NOW() - INTERVAL '24 hours'
GROUP BY f.scan_id, s.status, s.progress
ORDER BY last_finding DESC;

-- 4. Check for scans that have findings but aren't marked complete
SELECT 
    s.scan_id,
    s.status,
    s.progress,
    s.last_updated,
    COUNT(f.id) as finding_count
FROM scan_status s
JOIN findings f ON s.scan_id = f.scan_id
WHERE s.status != 'completed'
GROUP BY s.scan_id, s.status, s.progress, s.last_updated
ORDER BY s.last_updated DESC;

-- 5. Manual fix: Update scans with findings to completed status
-- UNCOMMENT AND RUN ONLY IF NEEDED
/*
UPDATE scan_status
SET 
    status = 'completed',
    completed_at = COALESCE(completed_at, NOW()),
    progress = 100
WHERE scan_id IN (
    SELECT DISTINCT f.scan_id 
    FROM findings f
    WHERE f.scan_id IS NOT NULL
)
AND status != 'completed';
*/