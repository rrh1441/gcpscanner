-- Investigate why recent scans like 5tv_b2N_vrf are missing from scan_status

-- 1. Check this specific scan
SELECT 
    '5tv_b2N_vrf scan in scan_status?' as check,
    EXISTS(SELECT 1 FROM scan_status WHERE scan_id = '5tv_b2N_vrf') as exists;

-- 2. Get all findings for this scan
SELECT 
    scan_id,
    COUNT(*) as finding_count,
    MIN(created_at) as first_finding,
    MAX(created_at) as last_finding,
    COUNT(DISTINCT finding_type) as unique_types,
    ARRAY_AGG(DISTINCT finding_type ORDER BY finding_type) as finding_types
FROM findings
WHERE scan_id = '5tv_b2N_vrf'
GROUP BY scan_id;

-- 3. Check artifacts for this scan  
SELECT 
    COUNT(*) as artifact_count,
    MIN(created_at) as first_artifact,
    MAX(created_at) as last_artifact
FROM artifacts
WHERE meta->>'scan_id' = '5tv_b2N_vrf';

-- 4. Create missing scan_status entries based on findings
-- First, see what we would create
WITH missing_scans AS (
    SELECT DISTINCT
        f.scan_id,
        -- Try to extract domain from findings or use a placeholder
        COALESCE(
            (SELECT meta->>'domain' FROM artifacts WHERE meta->>'scan_id' = f.scan_id LIMIT 1),
            'unknown-domain'
        ) as domain,
        MIN(f.created_at) as first_finding,
        MAX(f.created_at) as last_finding,
        COUNT(DISTINCT f.id) as finding_count
    FROM findings f
    LEFT JOIN scan_status s ON f.scan_id = s.scan_id
    WHERE f.scan_id IS NOT NULL
      AND s.scan_id IS NULL
    GROUP BY f.scan_id
)
SELECT * FROM missing_scans
ORDER BY last_finding DESC;

-- 5. INSERT missing scans into scan_status
-- UNCOMMENT TO RUN:
/*
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
SELECT DISTINCT
    f.scan_id,
    'Unknown Company' as company_name,  -- We'll need to update this
    COALESCE(
        (SELECT meta->>'domain' FROM artifacts WHERE meta->>'scan_id' = f.scan_id LIMIT 1),
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
ON CONFLICT (scan_id) DO NOTHING;
*/

-- 6. Check all scans from today that might be missing
SELECT 
    f.scan_id,
    COUNT(*) as finding_count,
    MIN(f.created_at) as first_finding,
    MAX(f.created_at) as last_finding,
    s.scan_id IS NOT NULL as in_scan_status
FROM findings f
LEFT JOIN scan_status s ON f.scan_id = s.scan_id
WHERE f.created_at > CURRENT_DATE  -- Today's findings
  AND f.scan_id IS NOT NULL
GROUP BY f.scan_id, s.scan_id
ORDER BY MAX(f.created_at) DESC;