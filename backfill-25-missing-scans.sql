-- Backfill the 25 specific missing scans identified

-- First, verify these are indeed missing
SELECT 
    f.scan_id,
    COUNT(DISTINCT f.id) as finding_count,
    MIN(f.created_at) as first_finding,
    MAX(f.created_at) as last_finding,
    CASE WHEN s.scan_id IS NULL THEN 'MISSING' ELSE 'EXISTS' END as status
FROM findings f
LEFT JOIN scan_status s ON f.scan_id = s.scan_id
WHERE f.scan_id IN (
    '_1U1SEs8d9d',
    '5tv_b2N_vrf',
    '7JODH7k79DA',
    '9ak-kfofCaT',
    '9HVFMT0ms-F',
    '_b7phcMzWqs',
    'b_DlLAcKtaH',
    'B-oqzPSkbiu',
    'd9y4Xhr746y',
    '_DoJFCs2x5O',
    'G6esKkGYn7s',
    'G--aniX1Gic',
    'I1dlEHOZeUO',
    '_iL_f8UF8ab',
    'jOH_tPjjkdI',
    '_LNL9BxK1mc',
    'MHkzJRmaKH5',
    'rpJ03Kyyspu',
    's-2ULpPqIJI',
    '_VCPDHDxR6L',
    'WfK6gEIat7L',
    '_Wi9pB6oxx5',
    '-WIM2uWCc7z',
    'WXrs8COlUPK',
    'Y_JYyek5sSb'
)
GROUP BY f.scan_id, s.scan_id
ORDER BY MAX(f.created_at) DESC;

-- Insert these missing scans into scan_status
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
        -- Try to parse domain from finding descriptions
        CASE 
            WHEN f.scan_id = '5tv_b2N_vrf' THEN 'vulnerable-test-site.vercel.app'
            ELSE 'unknown-domain'
        END
    ) as domain,
    'completed' as status,
    100 as progress,
    MIN(f.created_at) as started_at,
    MAX(f.created_at) as last_updated,
    MAX(f.created_at) as completed_at,
    COUNT(DISTINCT f.id) as total_findings_count
FROM findings f
WHERE f.scan_id IN (
    '_1U1SEs8d9d',
    '5tv_b2N_vrf',
    '7JODH7k79DA',
    '9ak-kfofCaT',
    '9HVFMT0ms-F',
    '_b7phcMzWqs',
    'b_DlLAcKtaH',
    'B-oqzPSkbiu',
    'd9y4Xhr746y',
    '_DoJFCs2x5O',
    'G6esKkGYn7s',
    'G--aniX1Gic',
    'I1dlEHOZeUO',
    '_iL_f8UF8ab',
    'jOH_tPjjkdI',
    '_LNL9BxK1mc',
    'MHkzJRmaKH5',
    'rpJ03Kyyspu',
    's-2ULpPqIJI',
    '_VCPDHDxR6L',
    'WfK6gEIat7L',
    '_Wi9pB6oxx5',
    '-WIM2uWCc7z',
    'WXrs8COlUPK',
    'Y_JYyek5sSb'
)
AND NOT EXISTS (
    SELECT 1 FROM scan_status s WHERE s.scan_id = f.scan_id
)
GROUP BY f.scan_id
RETURNING scan_id, domain, total_findings_count;

-- Verify all 25 scans are now present
SELECT 
    COUNT(*) as inserted_count,
    SUM(total_findings_count) as total_findings_added
FROM scan_status
WHERE scan_id IN (
    '_1U1SEs8d9d',
    '5tv_b2N_vrf',
    '7JODH7k79DA',
    '9ak-kfofCaT',
    '9HVFMT0ms-F',
    '_b7phcMzWqs',
    'b_DlLAcKtaH',
    'B-oqzPSkbiu',
    'd9y4Xhr746y',
    '_DoJFCs2x5O',
    'G6esKkGYn7s',
    'G--aniX1Gic',
    'I1dlEHOZeUO',
    '_iL_f8UF8ab',
    'jOH_tPjjkdI',
    '_LNL9BxK1mc',
    'MHkzJRmaKH5',
    'rpJ03Kyyspu',
    's-2ULpPqIJI',
    '_VCPDHDxR6L',
    'WfK6gEIat7L',
    '_Wi9pB6oxx5',
    '-WIM2uWCc7z',
    'WXrs8COlUPK',
    'Y_JYyek5sSb'
);