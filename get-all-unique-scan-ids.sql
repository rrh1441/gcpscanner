-- Get ALL unique scan IDs from findings table
-- Remove the default 100 row limit

SELECT 
    f.scan_id,
    COUNT(DISTINCT f.id) as finding_count,
    MIN(f.created_at)::date as first_finding_date,
    MAX(f.created_at)::date as last_finding_date
FROM findings f
WHERE f.scan_id IS NOT NULL
GROUP BY f.scan_id
ORDER BY f.scan_id
LIMIT 10000;  -- Set a high limit to get all rows

-- Alternative: Get just the scan IDs as a simple list for easy comparison
SELECT DISTINCT scan_id
FROM findings
WHERE scan_id IS NOT NULL
ORDER BY scan_id;