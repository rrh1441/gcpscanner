-- Get all unique scan IDs from findings table with basic stats

SELECT 
    f.scan_id,
    COUNT(DISTINCT f.id) as finding_count,
    MIN(f.created_at) as first_finding_at,
    MAX(f.created_at) as last_finding_at
FROM findings f
WHERE f.scan_id IS NOT NULL
GROUP BY f.scan_id
ORDER BY f.scan_id;