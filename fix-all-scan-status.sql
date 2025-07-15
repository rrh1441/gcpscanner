-- Fix all scans that have findings but aren't marked as completed

-- First, let's see what we're about to update
SELECT 
    s.scan_id,
    s.company_name,
    s.domain,
    s.status as current_status,
    s.progress,
    s.last_updated,
    COUNT(DISTINCT f.id) as finding_count,
    MIN(f.created_at) as first_finding_at,
    MAX(f.created_at) as last_finding_at
FROM scan_status s
JOIN findings f ON s.scan_id = f.scan_id
WHERE s.status != 'completed'
GROUP BY s.scan_id, s.company_name, s.domain, s.status, s.progress, s.last_updated
ORDER BY s.last_updated DESC;

-- Update all scans with findings to completed status
UPDATE scan_status
SET 
    status = 'completed',
    completed_at = CASE 
        WHEN completed_at IS NULL THEN (
            SELECT MAX(f.created_at) 
            FROM findings f 
            WHERE f.scan_id = scan_status.scan_id
        )
        ELSE completed_at
    END,
    progress = 100,
    last_updated = NOW()
WHERE scan_id IN (
    SELECT DISTINCT f.scan_id 
    FROM findings f
    WHERE f.scan_id IS NOT NULL
)
AND status != 'completed'
RETURNING scan_id, company_name, status, completed_at;

-- Also update any scans that have artifacts but no findings (just to be thorough)
UPDATE scan_status
SET 
    status = 'completed',
    completed_at = CASE 
        WHEN completed_at IS NULL THEN (
            SELECT MAX(a.created_at) 
            FROM artifacts a 
            WHERE a.meta->>'scan_id' = scan_status.scan_id
        )
        ELSE completed_at
    END,
    progress = 100,
    last_updated = NOW()
WHERE scan_id IN (
    SELECT DISTINCT a.meta->>'scan_id' as scan_id
    FROM artifacts a
    WHERE a.meta->>'scan_id' IS NOT NULL
)
AND status != 'completed'
AND scan_id NOT IN (
    SELECT DISTINCT f.scan_id 
    FROM findings f
    WHERE f.scan_id IS NOT NULL
)
RETURNING scan_id, company_name, status, completed_at;

-- Verify the results
SELECT 
    status,
    COUNT(*) as count,
    MIN(last_updated) as oldest_update,
    MAX(last_updated) as newest_update
FROM scan_status
GROUP BY status
ORDER BY status;

-- Show recently completed scans
SELECT 
    s.scan_id,
    s.company_name,
    s.domain,
    s.status,
    s.completed_at,
    COUNT(DISTINCT f.id) as finding_count
FROM scan_status s
LEFT JOIN findings f ON s.scan_id = f.scan_id
WHERE s.status = 'completed'
AND s.last_updated > NOW() - INTERVAL '5 minutes'
GROUP BY s.scan_id, s.company_name, s.domain, s.status, s.completed_at
ORDER BY s.completed_at DESC
LIMIT 20;