-- Get all unique scans from the findings table and compare with scan_status

-- 1. Get all unique scan_ids from findings table with counts and dates
SELECT 
    f.scan_id,
    COUNT(DISTINCT f.id) as finding_count,
    COUNT(DISTINCT f.finding_type) as unique_finding_types,
    MIN(f.created_at) as first_finding_at,
    MAX(f.created_at) as last_finding_at,
    -- Check if this scan exists in scan_status
    CASE 
        WHEN s.scan_id IS NULL THEN '❌ MISSING FROM SCAN_STATUS'
        ELSE '✅ Exists in scan_status'
    END as status_check,
    s.status as scan_status,
    s.company_name,
    s.domain
FROM findings f
LEFT JOIN scan_status s ON f.scan_id = s.scan_id
WHERE f.scan_id IS NOT NULL
GROUP BY f.scan_id, s.scan_id, s.status, s.company_name, s.domain
ORDER BY MAX(f.created_at) DESC;

-- 2. Show only scans that are MISSING from scan_status but have findings
SELECT 
    f.scan_id,
    COUNT(DISTINCT f.id) as finding_count,
    MIN(f.created_at) as first_finding_at,
    MAX(f.created_at) as last_finding_at,
    ARRAY_AGG(DISTINCT f.finding_type) as finding_types
FROM findings f
LEFT JOIN scan_status s ON f.scan_id = s.scan_id
WHERE f.scan_id IS NOT NULL
  AND s.scan_id IS NULL  -- Only scans missing from scan_status
GROUP BY f.scan_id
ORDER BY MAX(f.created_at) DESC;

-- 3. Get a summary of the situation
SELECT 
    'Total unique scans in findings' as metric,
    COUNT(DISTINCT scan_id) as count
FROM findings
WHERE scan_id IS NOT NULL
UNION ALL
SELECT 
    'Total scans in scan_status' as metric,
    COUNT(*) as count
FROM scan_status
UNION ALL
SELECT 
    'Scans with findings but MISSING from scan_status' as metric,
    COUNT(DISTINCT f.scan_id) as count
FROM findings f
LEFT JOIN scan_status s ON f.scan_id = s.scan_id
WHERE f.scan_id IS NOT NULL AND s.scan_id IS NULL;

-- 4. Show recent findings that might be from missing scans
SELECT 
    f.scan_id,
    f.finding_type,
    f.severity,
    f.created_at,
    LEFT(f.description, 100) as description_preview
FROM findings f
LEFT JOIN scan_status s ON f.scan_id = s.scan_id
WHERE f.scan_id IS NOT NULL
  AND s.scan_id IS NULL
  AND f.created_at > NOW() - INTERVAL '7 days'
ORDER BY f.created_at DESC
LIMIT 20;