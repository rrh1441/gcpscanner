-- Find and backfill missing scans

-- 1. First, see how many scans are missing
SELECT 
    COUNT(DISTINCT f.scan_id) as total_scans_with_findings,
    COUNT(DISTINCT s.scan_id) as scans_in_scan_status,
    COUNT(DISTINCT f.scan_id) - COUNT(DISTINCT s.scan_id) as missing_scans
FROM findings f
LEFT JOIN scan_status s ON f.scan_id = s.scan_id
WHERE f.scan_id IS NOT NULL;

-- 2. List all missing scan IDs with their finding counts
SELECT 
    f.scan_id,
    COUNT(DISTINCT f.id) as finding_count,
    MIN(f.created_at) as first_finding,
    MAX(f.created_at) as last_finding
FROM findings f
LEFT JOIN scan_status s ON f.scan_id = s.scan_id
WHERE f.scan_id IS NOT NULL
  AND s.scan_id IS NULL
GROUP BY f.scan_id
ORDER BY MAX(f.created_at) DESC;

-- 3. Create scan_status entries for ALL missing scans
INSERT INTO scan_status (
    scan_id,
    company_name,
    domain,
    status,
    progress,
    started_at,
    last_updated,
    completed_at,
    total_findings_count
)
SELECT 
    f.scan_id,
    'Unknown Company' as company_name,
    COALESCE(
        -- Try to get domain from artifacts meta
        (SELECT meta->>'domain' 
         FROM artifacts 
         WHERE meta->>'scan_id' = f.scan_id 
         LIMIT 1),
        -- Try to get domain from artifact src_url
        (SELECT SUBSTRING(src_url FROM 'https?://([^/]+)')
         FROM artifacts 
         WHERE meta->>'scan_id' = f.scan_id 
           AND src_url IS NOT NULL
         LIMIT 1),
        'unknown-domain'
    ) as domain,
    'completed' as status,
    100 as progress,
    MIN(f.created_at) as started_at,
    MAX(f.created_at) as last_updated,
    MAX(f.created_at) as completed_at,
    COUNT(DISTINCT f.id) as total_findings_count
FROM findings f
LEFT JOIN scan_status s ON f.scan_id = s.scan_id
WHERE f.scan_id IS NOT NULL
  AND s.scan_id IS NULL
GROUP BY f.scan_id
ON CONFLICT (scan_id) DO UPDATE SET
    status = EXCLUDED.status,
    progress = EXCLUDED.progress,
    completed_at = EXCLUDED.completed_at,
    total_findings_count = EXCLUDED.total_findings_count,
    last_updated = NOW()
RETURNING scan_id, domain, total_findings_count;

-- 4. Verify all scans are now in scan_status
SELECT 
    'After backfill:' as status,
    COUNT(DISTINCT f.scan_id) as total_scans_with_findings,
    COUNT(DISTINCT s.scan_id) as scans_in_scan_status,
    COUNT(DISTINCT CASE WHEN s.scan_id IS NULL THEN f.scan_id END) as still_missing
FROM findings f
LEFT JOIN scan_status s ON f.scan_id = s.scan_id
WHERE f.scan_id IS NOT NULL;