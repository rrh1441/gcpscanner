

2025-07-14 13:38:08.911	
at async Timeout._onTimeout (file:///app/apps/sync-worker/dist/sync.js:503:13)
2025-07-14 13:38:08.911	
at async runSyncCycle (file:///app/apps/sync-worker/dist/sync.js:480:5)
2025-07-14 13:38:08.911	
at async syncScanTotalsAutomated (file:///app/apps/sync-worker/dist/sync.js:365:49)
2025-07-14 13:38:08.911	
at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
2025-07-14 13:38:08.911	
at /app/node_modules/.pnpm/pg-pool@3.10.0_pg@8.16.0/node_modules/pg-pool/index.js:45:11
2025-07-14 13:38:08.911	
error: column "attack_type_code" does not exist
2025-07-14 13:38:08.911	
[2025-07-14T20:38:08.911Z] [SyncWorker] ERROR: Error in syncScanTotalsAutomated column "attack_type_code" does not exist
2025-07-14 13:38:08.756	
[2025-07-14T20:38:08.756Z] [SyncWorker] ERROR: Error upserting findings to Supabase cannot insert a non-DEFAULT value into column "type"
2025-07-14 13:37:57.030	
at async Timeout._onTimeout (file:///app/apps/sync-worker/dist/sync.js:503:13)
2025-07-14 13:37:57.030	
at async runSyncCycle (file:///app/apps/sync-worker/dist/sync.js:480:5)
2025-07-14 13:37:57.030	
at async syncScanTotalsAutomated (file:///app/apps/sync-worker/dist/sync.js:365:49)
2025-07-14 13:37:57.030	
at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
2025-07-14 13:37:57.030	
at /app/node_modules/.pnpm/pg-pool@3.10.0_pg@8.16.0/node_modules/pg-pool/index.js:45:11
2025-07-14 13:37:57.030	
error: column "attack_type_code" does not exist
2025-07-14 13:37:57.030	
[2025-07-14T20:37:57.029Z] [SyncWorker] ERROR: Error in syncScanTotalsAutomated column "attack_type_code" does not exist
2025-07-14 13:37:56.928	
}
2025-07-14 13:37:56.928	
"CRITICAL_INFOSTEALER": 9
2025-07-14 13:37:56.928	
"MEDIUM_EMAIL_EXPOSED": 504,
2025-07-14 13:37:56.928	
"HIGH_PASSWORD_EXPOSED": 54,
2025-07-14 13:37:56.928	
[2025-07-14T20:37:56.927Z] [SyncWorker] ✅ New compromised credentials synced: 567 {
2025-07-14 13:37:56.676	
[2025-07-14T20:37:56.675Z] [SyncWorker] ERROR: Error upserting findings to Supabase cannot insert a non-DEFAULT value into column "type"
2025-07-14 13:37:55.717	
[2025-07-14T20:37:55.716Z] [queue-monitor] Queue: 0 jobs, Workers: 0 running, 0 needed
2025-07-14 13:37:55.717	
[2025-07-14T20:37:55.716Z] [queue-monitor] Found 0 running workers
2025-07-14 13:37:47.114	
[2025-07-14T20:37:47.113Z] [accessibilityScan] Accessibility scan completed: 1 findings from 2/15 pages in 60751ms
2025-07-14 13:37:46.901	
[2025-07-14T20:37:46.900Z] [accessibilityScan] Accessibility analysis complete: 2 violations (0 critical, 0 serious)
2025-07-14 13:37:45.891	
[2025-07-14T20:37:45.891Z] [dynamicBrowser] Page operation completed in 2057ms
2025-07-14 13:37:43.835	
[2025-07-14T20:37:43.834Z] [accessibilityScan] Testing accessibility for: https://vulnerable-test-site.vercel.app/help
2025-07-14 13:37:42.747	
[2025-07-14T20:37:42.747Z] [dynamicBrowser] Page operation completed in 2047ms
2025-07-14 13:37:40.701	
[2025-07-14T20:37:40.700Z] [accessibilityScan] Testing accessibility for: https://vulnerable-test-site.vercel.app/search
2025-07-14 13:37:39.628	
[2025-07-14T20:37:39.628Z] [dynamicBrowser] Page operation completed in 2036ms
2025-07-14 13:37:37.592	
[2025-07-14T20:37:37.592Z] [accessibilityScan] Testing accessibility for: https://vulnerable-test-site.vercel.app/join
2025-07-14 13:37:36.514	
[2025-07-14T20:37:36.513Z] [dynamicBrowser] Page operation completed in 2049ms
2025-07-14 13:37:34.465	
[2025-07-14T20:37:34.464Z] [accessibilityScan] Testing accessibility for: https://vulnerable-test-site.vercel.app/register
2025-07-14 13:37:33.386	
[2025-07-14T20:37:33.386Z] [dynamicBrowser] Page operation completed in 2048ms
2025-07-14 13:37:31.339	
[2025-07-14T20:37:31.338Z] [accessibilityScan] Testing accessibility for: https://vulnerable-test-site.vercel.app/login
2025-07-14 13:37:30.541	
[2025-07-14T20:37:30.540Z] [nucleiWrapper] Using headless timeout: 90000ms
2025-07-14 13:37:30.541	
[2025-07-14T20:37:30.540Z] [nucleiWrapper] Using headless timeout: 90000ms
2025-07-14 13:37:30.536	
[2025-07-14T20:37:30.535Z] [nucleiWrapper] Executing nuclei: /usr/local/bin/nuclei -silent -jsonl -u https://vulnerable-test-site.vercel.app -tags cve,panel,xss,wp-plugin,osint,lfi,rce -c 48 -retries 2 -headless -system-chrome
2025-07-14 13:37:30.536	
[2025-07-14T20:37:30.535Z] [nucleiWrapper] Executing nuclei: /usr/local/bin/nuclei -silent -jsonl -u https://vulnerable-test-site.vercel.app -tags cve,panel,xss,wp-plugin,osint,lfi,rce -c 48 -retries 2 -headless -system-chrome
2025-07-14 13:37:30.535	
[2025-07-14T20:37:30.535Z] [nucleiWrapper] Pass 2: Running common vulnerability + tech-specific scan with gated tags: cve,panel,xss,wp-plugin,osint,lfi,rce
2025-07-14 13:37:30.535	
[2025-07-14T20:37:30.535Z] [nucleiWrapper] Pass 2: Running common vulnerability + tech-specific scan with gated tags: cve,panel,xss,wp-plugin,osint,lfi,rce
2025-07-14 13:37:30.535	
[2025-07-14T20:37:30.535Z] [nucleiWrapper] Detected technologies: none
2025-07-14 13:37:30.535	
[2025-07-14T20:37:30.535Z] [nucleiWrapper] Detected technologies: none
2025-07-14 13:37:30.535	
[2025-07-14T20:37:30.535Z] [nucleiWrapper] Nuclei execution completed: 0 results, exit code 0
2025-07-14 13:37:30.535	
[2025-07-14T20:37:30.535Z] [nucleiWrapper] Nuclei execution completed: 0 results, exit code 0
2025-07-14 13:37:30.527	
[2025-07-14T20:37:30.527Z] [nucleiWrapper] Nuclei execution timed out after 8000ms, sending SIGTERM
2025-07-14 13:37:30.527	
[2025-07-14T20:37:30.527Z] [nucleiWrapper] Nuclei execution timed out after 8000ms, sending SIGTERM
2025-07-14 13:37:30.163	
[2025-07-14T20:37:30.162Z] [dynamicBrowser] Page operation completed in 2046ms
2025-07-14 13:37:30.163	
[2025-07-14T20:37:30.162Z] [dynamicBrowser] Page operation completed in 2046ms
2025-07-14 13:37:28.117	
[2025-07-14T20:37:28.116Z] [accessibilityScan] Testing accessibility for: https://vulnerable-test-site.vercel.app/signup
2025-07-14 13:37:28.117	
[2025-07-14T20:37:28.116Z] [accessibilityScan] Testing accessibility for: https://vulnerable-test-site.vercel.app/signup
2025-07-14 13:37:27.865	
[2025-07-14T20:37:27.865Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:27.865	
[2025-07-14T20:37:27.865Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:27.027	
[2025-07-14T20:37:27.027Z] [dynamicBrowser] Page operation completed in 2057ms
2025-07-14 13:37:27.027	
[2025-07-14T20:37:27.027Z] [dynamicBrowser] Page operation completed in 2057ms
2025-07-14 13:37:26.840	
[2025-07-14T20:37:26.840Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:26.840	
[2025-07-14T20:37:26.840Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:26.597	
[2025-07-14T20:37:26.597Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:26.597	
[2025-07-14T20:37:26.597Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:26.266	
[2025-07-14T20:37:26.266Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:26.266	
[2025-07-14T20:37:26.266Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:26.241	
[2025-07-14T20:37:26.240Z] [nvdMirror] NVD sync completed: 0 CVEs synced in 356ms
2025-07-14 13:37:26.241	
[2025-07-14T20:37:26.240Z] [nvdMirror] NVD sync completed: 0 CVEs synced in 356ms
2025-07-14 13:37:26.232	
[2025-07-14T20:37:26.232Z] [nvdMirror] NVD API request failed: Request failed with status code 404
2025-07-14 13:37:26.232	
[2025-07-14T20:37:26.232Z] [nvdMirror] NVD API request failed: Request failed with status code 404
2025-07-14 13:37:26.131	
[2025-07-14T20:37:26.131Z] [techStackScan] techstack=complete domain=vulnerable-test-site.vercel.app artifacts=2 techs=2 vulns=0 supply_risks=0 runtime=4005ms active_testing=false
2025-07-14 13:37:26.131	
[2025-07-14T20:37:26.131Z] [techStackScan] techstack=complete domain=vulnerable-test-site.vercel.app artifacts=2 techs=2 vulns=0 supply_risks=0 runtime=4005ms active_testing=false
2025-07-14 13:37:26.131	
[artifactStore] Inserted scan_summary artifact: Technology scan completed: 2 technologies, 0 vulnerabilities...
2025-07-14 13:37:26.131	
[artifactStore] Inserted scan_summary artifact: Technology scan completed: 2 technologies, 0 vulnerabilities...
2025-07-14 13:37:26.012	
[2025-07-14T20:37:26.012Z] [worker] [tSXlMR9RZAO] WAITING for document_exposure scan to complete...
2025-07-14 13:37:26.012	
[2025-07-14T20:37:26.012Z] [worker] [tSXlMR9RZAO] WAITING for document_exposure scan to complete...
2025-07-14 13:37:26.012	
[2025-07-14T20:37:26.012Z] [worker] [tSXlMR9RZAO] COMPLETED dns_twist scan: 17 findings found
2025-07-14 13:37:26.012	
[2025-07-14T20:37:26.012Z] [worker] [tSXlMR9RZAO] COMPLETED dns_twist scan: 17 findings found
2025-07-14 13:37:26.012	
[2025-07-14T20:37:26.011Z] [dnstwist] Scan completed – 17 domains analysed
2025-07-14 13:37:26.012	
[2025-07-14T20:37:26.011Z] [dnstwist] Scan completed – 17 domains analysed
2025-07-14 13:37:25.955	
[artifactStore] Inserted finding MALICIOUS_TYPOSQUAT_GROUP for artifact 258
2025-07-14 13:37:25.955	
[artifactStore] Inserted finding MALICIOUS_TYPOSQUAT_GROUP for artifact 258
2025-07-14 13:37:25.901	
[2025-07-14T20:37:25.900Z] [techStackScan] techstack=sbom_generated components=2 vulnerabilities=0 critical=0
2025-07-14 13:37:25.901	
[2025-07-14T20:37:25.900Z] [techStackScan] techstack=sbom_generated components=2 vulnerabilities=0 critical=0
2025-07-14 13:37:25.900	
[2025-07-14T20:37:25.900Z] [sbomGenerator] SBOM generated: 2 components, 0 vulnerabilities
2025-07-14 13:37:25.900	
[2025-07-14T20:37:25.900Z] [sbomGenerator] SBOM generated: 2 components, 0 vulnerabilities
2025-07-14 13:37:25.900	
[2025-07-14T20:37:25.899Z] [sbomGenerator] Generating SBOM for vulnerable-test-site.vercel.app with 2 components
2025-07-14 13:37:25.900	
[2025-07-14T20:37:25.899Z] [sbomGenerator] Generating SBOM for vulnerable-test-site.vercel.app with 2 components
2025-07-14 13:37:25.898	
[2025-07-14T20:37:25.898Z] [osvIntegration] No components suitable for OSV.dev queries
2025-07-14 13:37:25.898	
[2025-07-14T20:37:25.898Z] [osvIntegration] No components suitable for OSV.dev queries
2025-07-14 13:37:25.898	
[2025-07-14T20:37:25.898Z] [techStackScan] techstack=osv_enhancement starting OSV.dev integration for 2 components
2025-07-14 13:37:25.898	
[2025-07-14T20:37:25.898Z] [techStackScan] techstack=osv_enhancement starting OSV.dev integration for 2 components
2025-07-14 13:37:25.898	
[2025-07-14T20:37:25.898Z] [versionMatcher] Batch vulnerability analysis completed: 0 vulnerabilities across 2 components in 50ms
2025-07-14 13:37:25.898	
[2025-07-14T20:37:25.898Z] [versionMatcher] Batch vulnerability analysis completed: 0 vulnerabilities across 2 components in 50ms
2025-07-14 13:37:25.898	
[2025-07-14T20:37:25.897Z] [versionMatcher] Vulnerability matching completed for HSTS: 0 matches in 41ms
2025-07-14 13:37:25.898	
[2025-07-14T20:37:25.897Z] [versionMatcher] Vulnerability matching completed for HSTS: 0 matches in 41ms
2025-07-14 13:37:25.897	
[2025-07-14T20:37:25.897Z] [nvdMirror] Local CVE query completed: 0 results in 41ms
2025-07-14 13:37:25.897	
[2025-07-14T20:37:25.897Z] [nvdMirror] Local CVE query completed: 0 results in 41ms
2025-07-14 13:37:25.897	
extra argument: "DISTINCT"
2025-07-14 13:37:25.897	
extra argument: "DISTINCT"
2025-07-14 13:37:25.897	
JOIN cpe_matches cm ON v.cve_id = cm.cve_id WHERE cm.cpe_uri LIKE '%:hsts:HSTS:%' AND cm.vulnerable = 1 ORDER BY v.cvss_v3_score DESC, v.published_date DESC LIMIT 100
2025-07-14 13:37:25.897	
JOIN cpe_matches cm ON v.cve_id = cm.cve_id WHERE cm.cpe_uri LIKE '%:hsts:HSTS:%' AND cm.vulnerable = 1 ORDER BY v.cvss_v3_score DESC, v.published_date DESC LIMIT 100
2025-07-14 13:37:25.897	
FROM vulnerabilities v
2025-07-14 13:37:25.897	
FROM vulnerabilities v
2025-07-14 13:37:25.897	
v.severity, v.cisa_kev, v.epss_score, v.references_json
2025-07-14 13:37:25.897	
v.severity, v.cisa_kev, v.epss_score, v.references_json
2025-07-14 13:37:25.897	
v.cvss_v3_score, v.cvss_v3_vector, v.cvss_v2_score, v.cvss_v2_vector,
2025-07-14 13:37:25.897	
v.cvss_v3_score, v.cvss_v3_vector, v.cvss_v2_score, v.cvss_v2_vector,
2025-07-14 13:37:25.897	
SELECT DISTINCT v.cve_id, v.description, v.published_date, v.last_modified_date,
2025-07-14 13:37:25.897	
SELECT DISTINCT v.cve_id, v.description, v.published_date, v.last_modified_date,
2025-07-14 13:37:25.897	
[2025-07-14T20:37:25.897Z] [nvdMirror] SQL query failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite .mode json
2025-07-14 13:37:25.897	
[2025-07-14T20:37:25.897Z] [nvdMirror] SQL query failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite .mode json
2025-07-14 13:37:25.897	
extra argument: "DISTINCT"
2025-07-14 13:37:25.897	
extra argument: "DISTINCT"
2025-07-14 13:37:25.897	
JOIN cpe_matches cm ON v.cve_id = cm.cve_id WHERE cm.cpe_uri LIKE '%:hsts:HSTS:%' AND cm.vulnerable = 1 ORDER BY v.cvss_v3_score DESC, v.published_date DESC LIMIT 100
2025-07-14 13:37:25.897	
JOIN cpe_matches cm ON v.cve_id = cm.cve_id WHERE cm.cpe_uri LIKE '%:hsts:HSTS:%' AND cm.vulnerable = 1 ORDER BY v.cvss_v3_score DESC, v.published_date DESC LIMIT 100
2025-07-14 13:37:25.897	
FROM vulnerabilities v
2025-07-14 13:37:25.897	
FROM vulnerabilities v
2025-07-14 13:37:25.897	
v.severity, v.cisa_kev, v.epss_score, v.references_json
2025-07-14 13:37:25.897	
v.severity, v.cisa_kev, v.epss_score, v.references_json
2025-07-14 13:37:25.897	
v.cvss_v3_score, v.cvss_v3_vector, v.cvss_v2_score, v.cvss_v2_vector,
2025-07-14 13:37:25.897	
v.cvss_v3_score, v.cvss_v3_vector, v.cvss_v2_score, v.cvss_v2_vector,
2025-07-14 13:37:25.897	
SELECT DISTINCT v.cve_id, v.description, v.published_date, v.last_modified_date,
2025-07-14 13:37:25.897	
SELECT DISTINCT v.cve_id, v.description, v.published_date, v.last_modified_date,
2025-07-14 13:37:25.897	
[2025-07-14T20:37:25.897Z] [nvdMirror] SQL execution failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite .mode json
2025-07-14 13:37:25.897	
[2025-07-14T20:37:25.897Z] [nvdMirror] SQL execution failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite .mode json
2025-07-14 13:37:25.894	
[2025-07-14T20:37:25.894Z] [nvdMirror] Syncing CVEs modified since 2025-06-14T20:37:25.894Z...
2025-07-14 13:37:25.894	
[2025-07-14T20:37:25.894Z] [nvdMirror] Syncing CVEs modified since 2025-06-14T20:37:25.894Z...
2025-07-14 13:37:25.894	
extra argument: "value"
2025-07-14 13:37:25.894	
extra argument: "value"
2025-07-14 13:37:25.894	
SELECT value FROM sync_metadata WHERE key = 'last_sync'
2025-07-14 13:37:25.894	
SELECT value FROM sync_metadata WHERE key = 'last_sync'
2025-07-14 13:37:25.894	
[2025-07-14T20:37:25.894Z] [nvdMirror] SQL query failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite .mode json
2025-07-14 13:37:25.894	
[2025-07-14T20:37:25.894Z] [nvdMirror] SQL query failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite .mode json
2025-07-14 13:37:25.894	
extra argument: "value"
2025-07-14 13:37:25.894	
extra argument: "value"
2025-07-14 13:37:25.894	
SELECT value FROM sync_metadata WHERE key = 'last_sync'
2025-07-14 13:37:25.894	
SELECT value FROM sync_metadata WHERE key = 'last_sync'
2025-07-14 13:37:25.894	
[2025-07-14T20:37:25.893Z] [nvdMirror] SQL execution failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite .mode json
2025-07-14 13:37:25.894	
[2025-07-14T20:37:25.893Z] [nvdMirror] SQL execution failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite .mode json
2025-07-14 13:37:25.890	
[2025-07-14T20:37:25.888Z] [nvdMirror] Update already in progress, skipping...
2025-07-14 13:37:25.890	
[2025-07-14T20:37:25.888Z] [nvdMirror] Update already in progress, skipping...
2025-07-14 13:37:25.885	
[2025-07-14T20:37:25.884Z] [nvdMirror] Starting NVD data sync...
2025-07-14 13:37:25.885	
[2025-07-14T20:37:25.884Z] [nvdMirror] Starting NVD data sync...
2025-07-14 13:37:25.884	
[2025-07-14T20:37:25.884Z] [nvdMirror] NVD mirror is stale, initiating background sync...
2025-07-14 13:37:25.884	
[2025-07-14T20:37:25.884Z] [nvdMirror] NVD mirror is stale, initiating background sync...
2025-07-14 13:37:25.884	
extra argument: "*"
2025-07-14 13:37:25.884	
extra argument: "*"
2025-07-14 13:37:25.884	
SELECT * FROM sync_metadata WHERE key = 'last_sync'
2025-07-14 13:37:25.884	
SELECT * FROM sync_metadata WHERE key = 'last_sync'
2025-07-14 13:37:25.884	
[2025-07-14T20:37:25.884Z] [nvdMirror] SQL query failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite .mode json
2025-07-14 13:37:25.884	
[2025-07-14T20:37:25.884Z] [nvdMirror] SQL query failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite .mode json
2025-07-14 13:37:25.884	
extra argument: "*"
2025-07-14 13:37:25.884	
extra argument: "*"
2025-07-14 13:37:25.884	
SELECT * FROM sync_metadata WHERE key = 'last_sync'
2025-07-14 13:37:25.884	
SELECT * FROM sync_metadata WHERE key = 'last_sync'
2025-07-14 13:37:25.884	
[2025-07-14T20:37:25.884Z] [nvdMirror] SQL execution failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite .mode json
2025-07-14 13:37:25.884	
[2025-07-14T20:37:25.884Z] [nvdMirror] SQL execution failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite .mode json
2025-07-14 13:37:25.879	
[2025-07-14T20:37:25.879Z] [nvdMirror] NVD mirror database initialized successfully
2025-07-14 13:37:25.879	
[2025-07-14T20:37:25.879Z] [nvdMirror] NVD mirror database initialized successfully
2025-07-14 13:37:25.869	
[2025-07-14T20:37:25.869Z] [versionMatcher] Vulnerability matching completed for Vercel: 0 matches in 21ms
2025-07-14 13:37:25.869	
[2025-07-14T20:37:25.869Z] [versionMatcher] Vulnerability matching completed for Vercel: 0 matches in 21ms
2025-07-14 13:37:25.868	
Error: stepping, database is locked (5)
2025-07-14 13:37:25.868	
Error: stepping, database is locked (5)
2025-07-14 13:37:25.868	
('total_cves', '0');
2025-07-14 13:37:25.868	
('total_cves', '0');
2025-07-14 13:37:25.868	
('version', '1.0'),
2025-07-14 13:37:25.868	
('version', '1.0'),
2025-07-14 13:37:25.868	
('last_sync', '1970-01-01T00:00:00Z'),
2025-07-14 13:37:25.868	
('last_sync', '1970-01-01T00:00:00Z'),
2025-07-14 13:37:25.868	
INSERT OR REPLACE INTO sync_metadata (key, value) VALUES
2025-07-14 13:37:25.868	
INSERT OR REPLACE INTO sync_metadata (key, value) VALUES
2025-07-14 13:37:25.868	
-- Insert initial metadata
2025-07-14 13:37:25.868	
-- Insert initial metadata
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_lookup ON cpe_matches(cpe_uri, vulnerable);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_lookup ON cpe_matches(cpe_uri, vulnerable);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cpe_uri ON cpe_matches(cpe_uri);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cpe_uri ON cpe_matches(cpe_uri);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cve_id ON cpe_matches(cve_id);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cve_id ON cpe_matches(cve_id);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cisa_kev ON vulnerabilities(cisa_kev);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cisa_kev ON vulnerabilities(cisa_kev);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cvss_v3 ON vulnerabilities(cvss_v3_score);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cvss_v3 ON vulnerabilities(cvss_v3_score);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_published ON vulnerabilities(published_date);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_published ON vulnerabilities(published_date);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
2025-07-14 13:37:25.868	
-- Performance indexes
2025-07-14 13:37:25.868	
-- Performance indexes
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
value TEXT NOT NULL,
2025-07-14 13:37:25.868	
value TEXT NOT NULL,
2025-07-14 13:37:25.868	
key TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
key TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS sync_metadata (
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS sync_metadata (
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
UNIQUE(cve_id, cpe_uri, version_start_including, version_start_excluding, version_end_including, version_end_excluding)
2025-07-14 13:37:25.868	
UNIQUE(cve_id, cpe_uri, version_start_including, version_start_excluding, version_end_including, version_end_excluding)
2025-07-14 13:37:25.868	
FOREIGN KEY (cve_id) REFERENCES vulnerabilities(cve_id),
2025-07-14 13:37:25.868	
FOREIGN KEY (cve_id) REFERENCES vulnerabilities(cve_id),
2025-07-14 13:37:25.868	
vulnerable INTEGER DEFAULT 1,
2025-07-14 13:37:25.868	
vulnerable INTEGER DEFAULT 1,
2025-07-14 13:37:25.868	
version_end_excluding TEXT,
2025-07-14 13:37:25.868	
version_end_excluding TEXT,
2025-07-14 13:37:25.868	
version_end_including TEXT,
2025-07-14 13:37:25.868	
version_end_including TEXT,
2025-07-14 13:37:25.868	
version_start_excluding TEXT,
2025-07-14 13:37:25.868	
version_start_excluding TEXT,
2025-07-14 13:37:25.868	
version_start_including TEXT,
2025-07-14 13:37:25.868	
version_start_including TEXT,
2025-07-14 13:37:25.868	
cpe_uri TEXT NOT NULL,
2025-07-14 13:37:25.868	
cve_id TEXT NOT NULL,
2025-07-14 13:37:25.868	
cpe_uri TEXT NOT NULL,
2025-07-14 13:37:25.868	
cve_id TEXT NOT NULL,
2025-07-14 13:37:25.868	
id INTEGER PRIMARY KEY AUTOINCREMENT,
2025-07-14 13:37:25.868	
id INTEGER PRIMARY KEY AUTOINCREMENT,
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS cpe_matches (
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS cpe_matches (
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
references_json TEXT,
2025-07-14 13:37:25.868	
references_json TEXT,
2025-07-14 13:37:25.868	
epss_score REAL,
2025-07-14 13:37:25.868	
epss_score REAL,
2025-07-14 13:37:25.868	
cisa_kev INTEGER DEFAULT 0,
2025-07-14 13:37:25.868	
severity TEXT NOT NULL,
2025-07-14 13:37:25.868	
cisa_kev INTEGER DEFAULT 0,
2025-07-14 13:37:25.868	
severity TEXT NOT NULL,
2025-07-14 13:37:25.868	
cvss_v2_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v2_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v2_score REAL,
2025-07-14 13:37:25.868	
cvss_v2_score REAL,
2025-07-14 13:37:25.868	
cvss_v3_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v3_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v3_score REAL,
2025-07-14 13:37:25.868	
cvss_v3_score REAL,
2025-07-14 13:37:25.868	
last_modified_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
last_modified_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
published_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
published_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
description TEXT NOT NULL,
2025-07-14 13:37:25.868	
description TEXT NOT NULL,
2025-07-14 13:37:25.868	
cve_id TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
cve_id TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS vulnerabilities (
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS vulnerabilities (
2025-07-14 13:37:25.868	
[2025-07-14T20:37:25.868Z] [nvdMirror] NVD mirror initialization failed, using fallback: Command failed: sqlite3 /tmp/nvd_mirror.sqlite
2025-07-14 13:37:25.868	
[2025-07-14T20:37:25.868Z] [nvdMirror] NVD mirror initialization failed, using fallback: Command failed: sqlite3 /tmp/nvd_mirror.sqlite
2025-07-14 13:37:25.868	
Error: stepping, database is locked (5)
2025-07-14 13:37:25.868	
Error: stepping, database is locked (5)
2025-07-14 13:37:25.868	
('total_cves', '0');
2025-07-14 13:37:25.868	
('version', '1.0'),
2025-07-14 13:37:25.868	
('total_cves', '0');
2025-07-14 13:37:25.868	
('version', '1.0'),
2025-07-14 13:37:25.868	
('last_sync', '1970-01-01T00:00:00Z'),
2025-07-14 13:37:25.868	
('last_sync', '1970-01-01T00:00:00Z'),
2025-07-14 13:37:25.868	
INSERT OR REPLACE INTO sync_metadata (key, value) VALUES
2025-07-14 13:37:25.868	
INSERT OR REPLACE INTO sync_metadata (key, value) VALUES
2025-07-14 13:37:25.868	
-- Insert initial metadata
2025-07-14 13:37:25.868	
-- Insert initial metadata
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_lookup ON cpe_matches(cpe_uri, vulnerable);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_lookup ON cpe_matches(cpe_uri, vulnerable);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cpe_uri ON cpe_matches(cpe_uri);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cpe_uri ON cpe_matches(cpe_uri);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cve_id ON cpe_matches(cve_id);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cve_id ON cpe_matches(cve_id);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cisa_kev ON vulnerabilities(cisa_kev);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cisa_kev ON vulnerabilities(cisa_kev);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cvss_v3 ON vulnerabilities(cvss_v3_score);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cvss_v3 ON vulnerabilities(cvss_v3_score);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_published ON vulnerabilities(published_date);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_published ON vulnerabilities(published_date);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
2025-07-14 13:37:25.868	
-- Performance indexes
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
2025-07-14 13:37:25.868	
-- Performance indexes
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
value TEXT NOT NULL,
2025-07-14 13:37:25.868	
value TEXT NOT NULL,
2025-07-14 13:37:25.868	
key TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS sync_metadata (
2025-07-14 13:37:25.868	
key TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS sync_metadata (
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
UNIQUE(cve_id, cpe_uri, version_start_including, version_start_excluding, version_end_including, version_end_excluding)
2025-07-14 13:37:25.868	
UNIQUE(cve_id, cpe_uri, version_start_including, version_start_excluding, version_end_including, version_end_excluding)
2025-07-14 13:37:25.868	
FOREIGN KEY (cve_id) REFERENCES vulnerabilities(cve_id),
2025-07-14 13:37:25.868	
FOREIGN KEY (cve_id) REFERENCES vulnerabilities(cve_id),
2025-07-14 13:37:25.868	
vulnerable INTEGER DEFAULT 1,
2025-07-14 13:37:25.868	
vulnerable INTEGER DEFAULT 1,
2025-07-14 13:37:25.868	
version_end_excluding TEXT,
2025-07-14 13:37:25.868	
version_end_excluding TEXT,
2025-07-14 13:37:25.868	
version_end_including TEXT,
2025-07-14 13:37:25.868	
version_start_excluding TEXT,
2025-07-14 13:37:25.868	
version_end_including TEXT,
2025-07-14 13:37:25.868	
version_start_excluding TEXT,
2025-07-14 13:37:25.868	
version_start_including TEXT,
2025-07-14 13:37:25.868	
version_start_including TEXT,
2025-07-14 13:37:25.868	
cpe_uri TEXT NOT NULL,
2025-07-14 13:37:25.868	
cpe_uri TEXT NOT NULL,
2025-07-14 13:37:25.868	
cve_id TEXT NOT NULL,
2025-07-14 13:37:25.868	
cve_id TEXT NOT NULL,
2025-07-14 13:37:25.868	
id INTEGER PRIMARY KEY AUTOINCREMENT,
2025-07-14 13:37:25.868	
id INTEGER PRIMARY KEY AUTOINCREMENT,
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS cpe_matches (
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS cpe_matches (
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
references_json TEXT,
2025-07-14 13:37:25.868	
references_json TEXT,
2025-07-14 13:37:25.868	
epss_score REAL,
2025-07-14 13:37:25.868	
epss_score REAL,
2025-07-14 13:37:25.868	
cisa_kev INTEGER DEFAULT 0,
2025-07-14 13:37:25.868	
cisa_kev INTEGER DEFAULT 0,
2025-07-14 13:37:25.868	
severity TEXT NOT NULL,
2025-07-14 13:37:25.868	
severity TEXT NOT NULL,
2025-07-14 13:37:25.868	
cvss_v2_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v2_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v2_score REAL,
2025-07-14 13:37:25.868	
cvss_v2_score REAL,
2025-07-14 13:37:25.868	
cvss_v3_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v3_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v3_score REAL,
2025-07-14 13:37:25.868	
cvss_v3_score REAL,
2025-07-14 13:37:25.868	
last_modified_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
last_modified_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
published_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
published_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
description TEXT NOT NULL,
2025-07-14 13:37:25.868	
description TEXT NOT NULL,
2025-07-14 13:37:25.868	
cve_id TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
cve_id TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS vulnerabilities (
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS vulnerabilities (
2025-07-14 13:37:25.868	
[2025-07-14T20:37:25.868Z] [nvdMirror] Failed to initialize NVD mirror: Command failed: sqlite3 /tmp/nvd_mirror.sqlite
2025-07-14 13:37:25.868	
[2025-07-14T20:37:25.868Z] [nvdMirror] Failed to initialize NVD mirror: Command failed: sqlite3 /tmp/nvd_mirror.sqlite
2025-07-14 13:37:25.868	
Error: stepping, database is locked (5)
2025-07-14 13:37:25.868	
Error: stepping, database is locked (5)
2025-07-14 13:37:25.868	
('total_cves', '0');
2025-07-14 13:37:25.868	
('total_cves', '0');
2025-07-14 13:37:25.868	
('version', '1.0'),
2025-07-14 13:37:25.868	
('version', '1.0'),
2025-07-14 13:37:25.868	
('last_sync', '1970-01-01T00:00:00Z'),
2025-07-14 13:37:25.868	
('last_sync', '1970-01-01T00:00:00Z'),
2025-07-14 13:37:25.868	
INSERT OR REPLACE INTO sync_metadata (key, value) VALUES
2025-07-14 13:37:25.868	
INSERT OR REPLACE INTO sync_metadata (key, value) VALUES
2025-07-14 13:37:25.868	
INSERT OR REPLACE INTO sync_metadata (key, value) VALUES
2025-07-14 13:37:25.868	
-- Insert initial metadata
2025-07-14 13:37:25.868	
-- Insert initial metadata
2025-07-14 13:37:25.868	
-- Insert initial metadata
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_lookup ON cpe_matches(cpe_uri, vulnerable);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_lookup ON cpe_matches(cpe_uri, vulnerable);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_lookup ON cpe_matches(cpe_uri, vulnerable);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cpe_uri ON cpe_matches(cpe_uri);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cve_id ON cpe_matches(cve_id);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cpe_uri ON cpe_matches(cpe_uri);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cve_id ON cpe_matches(cve_id);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cpe_uri ON cpe_matches(cpe_uri);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_cpe_matches_cve_id ON cpe_matches(cve_id);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cisa_kev ON vulnerabilities(cisa_kev);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cisa_kev ON vulnerabilities(cisa_kev);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cisa_kev ON vulnerabilities(cisa_kev);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cvss_v3 ON vulnerabilities(cvss_v3_score);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cvss_v3 ON vulnerabilities(cvss_v3_score);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cvss_v3 ON vulnerabilities(cvss_v3_score);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_published ON vulnerabilities(published_date);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_published ON vulnerabilities(published_date);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_published ON vulnerabilities(published_date);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
2025-07-14 13:37:25.868	
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
2025-07-14 13:37:25.868	
-- Performance indexes
2025-07-14 13:37:25.868	
-- Performance indexes
2025-07-14 13:37:25.868	
-- Performance indexes
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
value TEXT NOT NULL,
2025-07-14 13:37:25.868	
value TEXT NOT NULL,
2025-07-14 13:37:25.868	
value TEXT NOT NULL,
2025-07-14 13:37:25.868	
key TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
key TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
key TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS sync_metadata (
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS sync_metadata (
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS sync_metadata (
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
UNIQUE(cve_id, cpe_uri, version_start_including, version_start_excluding, version_end_including, version_end_excluding)
2025-07-14 13:37:25.868	
UNIQUE(cve_id, cpe_uri, version_start_including, version_start_excluding, version_end_including, version_end_excluding)
2025-07-14 13:37:25.868	
UNIQUE(cve_id, cpe_uri, version_start_including, version_start_excluding, version_end_including, version_end_excluding)
2025-07-14 13:37:25.868	
FOREIGN KEY (cve_id) REFERENCES vulnerabilities(cve_id),
2025-07-14 13:37:25.868	
FOREIGN KEY (cve_id) REFERENCES vulnerabilities(cve_id),
2025-07-14 13:37:25.868	
FOREIGN KEY (cve_id) REFERENCES vulnerabilities(cve_id),
2025-07-14 13:37:25.868	
vulnerable INTEGER DEFAULT 1,
2025-07-14 13:37:25.868	
vulnerable INTEGER DEFAULT 1,
2025-07-14 13:37:25.868	
vulnerable INTEGER DEFAULT 1,
2025-07-14 13:37:25.868	
version_end_excluding TEXT,
2025-07-14 13:37:25.868	
version_end_excluding TEXT,
2025-07-14 13:37:25.868	
version_end_excluding TEXT,
2025-07-14 13:37:25.868	
version_end_including TEXT,
2025-07-14 13:37:25.868	
version_end_including TEXT,
2025-07-14 13:37:25.868	
version_end_including TEXT,
2025-07-14 13:37:25.868	
version_start_excluding TEXT,
2025-07-14 13:37:25.868	
version_start_excluding TEXT,
2025-07-14 13:37:25.868	
version_start_excluding TEXT,
2025-07-14 13:37:25.868	
version_start_including TEXT,
2025-07-14 13:37:25.868	
version_start_including TEXT,
2025-07-14 13:37:25.868	
version_start_including TEXT,
2025-07-14 13:37:25.868	
cpe_uri TEXT NOT NULL,
2025-07-14 13:37:25.868	
cpe_uri TEXT NOT NULL,
2025-07-14 13:37:25.868	
cpe_uri TEXT NOT NULL,
2025-07-14 13:37:25.868	
cve_id TEXT NOT NULL,
2025-07-14 13:37:25.868	
cve_id TEXT NOT NULL,
2025-07-14 13:37:25.868	
cve_id TEXT NOT NULL,
2025-07-14 13:37:25.868	
id INTEGER PRIMARY KEY AUTOINCREMENT,
2025-07-14 13:37:25.868	
id INTEGER PRIMARY KEY AUTOINCREMENT,
2025-07-14 13:37:25.868	
id INTEGER PRIMARY KEY AUTOINCREMENT,
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS cpe_matches (
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS cpe_matches (
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS cpe_matches (
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
);
2025-07-14 13:37:25.868	
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
2025-07-14 13:37:25.868	
references_json TEXT,
2025-07-14 13:37:25.868	
references_json TEXT,
2025-07-14 13:37:25.868	
references_json TEXT,
2025-07-14 13:37:25.868	
epss_score REAL,
2025-07-14 13:37:25.868	
epss_score REAL,
2025-07-14 13:37:25.868	
epss_score REAL,
2025-07-14 13:37:25.868	
cisa_kev INTEGER DEFAULT 0,
2025-07-14 13:37:25.868	
cisa_kev INTEGER DEFAULT 0,
2025-07-14 13:37:25.868	
cisa_kev INTEGER DEFAULT 0,
2025-07-14 13:37:25.868	
severity TEXT NOT NULL,
2025-07-14 13:37:25.868	
severity TEXT NOT NULL,
2025-07-14 13:37:25.868	
severity TEXT NOT NULL,
2025-07-14 13:37:25.868	
cvss_v2_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v2_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v2_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v2_score REAL,
2025-07-14 13:37:25.868	
cvss_v2_score REAL,
2025-07-14 13:37:25.868	
cvss_v2_score REAL,
2025-07-14 13:37:25.868	
cvss_v3_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v3_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v3_vector TEXT,
2025-07-14 13:37:25.868	
cvss_v3_score REAL,
2025-07-14 13:37:25.868	
cvss_v3_score REAL,
2025-07-14 13:37:25.868	
cvss_v3_score REAL,
2025-07-14 13:37:25.868	
last_modified_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
last_modified_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
last_modified_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
published_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
published_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
published_date TEXT NOT NULL,
2025-07-14 13:37:25.868	
description TEXT NOT NULL,
2025-07-14 13:37:25.868	
description TEXT NOT NULL,
2025-07-14 13:37:25.868	
description TEXT NOT NULL,
2025-07-14 13:37:25.868	
cve_id TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
cve_id TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
cve_id TEXT PRIMARY KEY,
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS vulnerabilities (
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS vulnerabilities (
2025-07-14 13:37:25.868	
CREATE TABLE IF NOT EXISTS vulnerabilities (
2025-07-14 13:37:25.868	
[2025-07-14T20:37:25.868Z] [nvdMirror] SQL execution failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite
2025-07-14 13:37:25.868	
[2025-07-14T20:37:25.868Z] [nvdMirror] SQL execution failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite
2025-07-14 13:37:25.868	
[2025-07-14T20:37:25.868Z] [nvdMirror] SQL execution failed: Command failed: sqlite3 /tmp/nvd_mirror.sqlite
2025-07-14 13:37:25.857	
[2025-07-14T20:37:25.856Z] [nvdMirror] Initializing NVD mirror database...
2025-07-14 13:37:25.857	
[2025-07-14T20:37:25.856Z] [nvdMirror] Initializing NVD mirror database...
2025-07-14 13:37:25.857	
[2025-07-14T20:37:25.856Z] [nvdMirror] Initializing NVD mirror database...
2025-07-14 13:37:25.857	
[2025-07-14T20:37:25.856Z] [versionMatcher] Finding vulnerabilities for HSTS@unknown
2025-07-14 13:37:25.857	
[2025-07-14T20:37:25.856Z] [versionMatcher] Finding vulnerabilities for HSTS@unknown
2025-07-14 13:37:25.857	
[2025-07-14T20:37:25.856Z] [versionMatcher] Finding vulnerabilities for HSTS@unknown
2025-07-14 13:37:25.848	
[2025-07-14T20:37:25.848Z] [nvdMirror] Initializing NVD mirror database...
2025-07-14 13:37:25.848	
[2025-07-14T20:37:25.848Z] [nvdMirror] Initializing NVD mirror database...
2025-07-14 13:37:25.848	
[2025-07-14T20:37:25.848Z] [nvdMirror] Initializing NVD mirror database...
2025-07-14 13:37:25.848	
[2025-07-14T20:37:25.848Z] [versionMatcher] Finding vulnerabilities for Vercel@unknown
2025-07-14 13:37:25.848	
[2025-07-14T20:37:25.848Z] [versionMatcher] Finding vulnerabilities for Vercel@unknown
2025-07-14 13:37:25.848	
[2025-07-14T20:37:25.848Z] [versionMatcher] Finding vulnerabilities for Vercel@unknown
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.847Z] [versionMatcher] Starting batch vulnerability analysis for 2 components
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.847Z] [versionMatcher] Starting batch vulnerability analysis for 2 components
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.847Z] [versionMatcher] Starting batch vulnerability analysis for 2 components
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.847Z] [cpeNormalization] normalized tech="HSTS" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.847Z] [cpeNormalization] normalized tech="HSTS" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.847Z] [cpeNormalization] normalized tech="HSTS" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.847Z] [cpeNormalization] normalized tech="Vercel" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.847Z] [cpeNormalization] normalized tech="Vercel" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.847Z] [cpeNormalization] normalized tech="Vercel" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.847Z] [techStackScan] techstack=vuln_analysis starting enhanced vulnerability analysis
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.847Z] [techStackScan] techstack=vuln_analysis starting enhanced vulnerability analysis
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.847Z] [techStackScan] techstack=vuln_analysis starting enhanced vulnerability analysis
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.846Z] [securityAnalysis] analysis=stats tech="Vercel" version="undefined" raw=0 enriched=0 merged=0 filtered=0
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.846Z] [securityAnalysis] analysis=stats tech="Vercel" version="undefined" raw=0 enriched=0 merged=0 filtered=0
2025-07-14 13:37:25.847	
[2025-07-14T20:37:25.846Z] [securityAnalysis] analysis=stats tech="Vercel" version="undefined" raw=0 enriched=0 merged=0 filtered=0
2025-07-14 13:37:25.730	
[2025-07-14T20:37:25.730Z] [securityAnalysis] analysis=stats tech="HSTS" version="undefined" raw=0 enriched=0 merged=0 filtered=0
2025-07-14 13:37:25.730	
[2025-07-14T20:37:25.730Z] [securityAnalysis] analysis=stats tech="HSTS" version="undefined" raw=0 enriched=0 merged=0 filtered=0
2025-07-14 13:37:25.730	
[2025-07-14T20:37:25.730Z] [securityAnalysis] analysis=stats tech="HSTS" version="undefined" raw=0 enriched=0 merged=0 filtered=0
2025-07-14 13:37:25.704	
[2025-07-14T20:37:25.704Z] [dnstwist] ↪️ LEGITIMATE REDIRECT: vulnerable-test-site.vercel-app.com marked as INFO severity - redirects to original
2025-07-14 13:37:25.704	
[2025-07-14T20:37:25.704Z] [dnstwist] ↪️ LEGITIMATE REDIRECT: vulnerable-test-site.vercel-app.com marked as INFO severity - redirects to original
2025-07-14 13:37:25.704	
[2025-07-14T20:37:25.704Z] [dnstwist] ↪️ LEGITIMATE REDIRECT: vulnerable-test-site.vercel-app.com marked as INFO severity - redirects to original
2025-07-14 13:37:25.544	
[2025-07-14T20:37:25.543Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.vercel-app.com
2025-07-14 13:37:25.544	
[2025-07-14T20:37:25.543Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.vercel-app.com
2025-07-14 13:37:25.544	
[2025-07-14T20:37:25.543Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.vercel-app.com
2025-07-14 13:37:25.252	
[2025-07-14T20:37:25.252Z] [techStackScan] techstack=security_analysis starting for 2 technologies
2025-07-14 13:37:25.252	
[2025-07-14T20:37:25.252Z] [techStackScan] techstack=security_analysis starting for 2 technologies
2025-07-14 13:37:25.252	
[2025-07-14T20:37:25.252Z] [techStackScan] techstack=security_analysis starting for 2 technologies
2025-07-14 13:37:25.252	
[2025-07-14T20:37:25.252Z] [techStackScan] techstack=tech_detection_complete techs=2 duration=389ms methods=[FastTech] circuit_breaker=false
2025-07-14 13:37:25.252	
[2025-07-14T20:37:25.252Z] [techStackScan] techstack=tech_detection_complete techs=2 duration=389ms methods=[FastTech] circuit_breaker=false
2025-07-14 13:37:25.252	
[2025-07-14T20:37:25.252Z] [techStackScan] techstack=tech_detection_complete techs=2 duration=389ms methods=[FastTech] circuit_breaker=false
2025-07-14 13:37:25.252	
[2025-07-14T20:37:25.252Z] [techDetection] detection=complete techs=2 duration=389ms methods=[FastTech]
2025-07-14 13:37:25.252	
[2025-07-14T20:37:25.252Z] [techDetection] detection=complete techs=2 duration=389ms methods=[FastTech]
2025-07-14 13:37:25.252	
[2025-07-14T20:37:25.252Z] [techDetection] detection=complete techs=2 duration=389ms methods=[FastTech]
2025-07-14 13:37:25.252	
[2025-07-14T20:37:25.252Z] [techDetection] detection=fast_tech_complete techs=2
2025-07-14 13:37:25.252	
[2025-07-14T20:37:25.252Z] [techDetection] detection=fast_tech_complete techs=2
2025-07-14 13:37:25.252	
[2025-07-14T20:37:25.252Z] [techDetection] detection=fast_tech_complete techs=2
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.251Z] [fastDetection] fastDetection=batch_complete urls=2 success=2 total_techs=4 duration=386ms
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.251Z] [fastDetection] fastDetection=batch_complete urls=2 success=2 total_techs=4 duration=386ms
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.251Z] [fastDetection] fastDetection=batch_complete urls=2 success=2 total_techs=4 duration=386ms
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.251Z] [cpeNormalization] normalized tech="HSTS" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.251Z] [cpeNormalization] normalized tech="HSTS" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.251Z] [cpeNormalization] normalized tech="HSTS" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.251Z] [cpeNormalization] normalized tech="Vercel" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.251Z] [cpeNormalization] normalized tech="Vercel" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.251Z] [cpeNormalization] normalized tech="Vercel" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.251Z] [cpeNormalization] normalized tech="HSTS" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.251Z] [cpeNormalization] normalized tech="HSTS" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.251Z] [cpeNormalization] normalized tech="HSTS" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.250Z] [cpeNormalization] normalized tech="Vercel" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.250Z] [cpeNormalization] normalized tech="Vercel" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.251	
[2025-07-14T20:37:25.250Z] [cpeNormalization] normalized tech="Vercel" version="undefined" cpe="undefined" purl="undefined" confidence=100
2025-07-14 13:37:25.250	
[2025-07-14T20:37:25.250Z] [fastTechDetection] Batch fast tech detection completed: 4 techs across 2 URLs in 384ms
2025-07-14 13:37:25.250	
[2025-07-14T20:37:25.250Z] [fastTechDetection] Batch fast tech detection completed: 4 techs across 2 URLs in 384ms
2025-07-14 13:37:25.250	
[2025-07-14T20:37:25.250Z] [fastTechDetection] Batch fast tech detection completed: 4 techs across 2 URLs in 384ms
2025-07-14 13:37:25.250	
[2025-07-14T20:37:25.249Z] [fastTechDetection] Header detection found 2 techs, skipping WebTech for https://www.vulnerable-test-site.vercel.app
2025-07-14 13:37:25.250	
[2025-07-14T20:37:25.249Z] [fastTechDetection] Header detection found 2 techs, skipping WebTech for https://www.vulnerable-test-site.vercel.app
2025-07-14 13:37:25.250	
[2025-07-14T20:37:25.249Z] [fastTechDetection] Header detection found 2 techs, skipping WebTech for https://www.vulnerable-test-site.vercel.app
2025-07-14 13:37:25.250	
[2025-07-14T20:37:25.249Z] [fastTechDetection] Header detection found 2 technologies for https://www.vulnerable-test-site.vercel.app
2025-07-14 13:37:25.250	
[2025-07-14T20:37:25.249Z] [fastTechDetection] Header detection found 2 technologies for https://www.vulnerable-test-site.vercel.app
2025-07-14 13:37:25.250	
[2025-07-14T20:37:25.249Z] [fastTechDetection] Header detection found 2 technologies for https://www.vulnerable-test-site.vercel.app
2025-07-14 13:37:24.971	
[2025-07-14T20:37:24.970Z] [accessibilityScan] Testing accessibility for: https://vulnerable-test-site.vercel.app/pricing
2025-07-14 13:37:24.971	
[2025-07-14T20:37:24.970Z] [accessibilityScan] Testing accessibility for: https://vulnerable-test-site.vercel.app/pricing
2025-07-14 13:37:24.971	
[2025-07-14T20:37:24.970Z] [accessibilityScan] Testing accessibility for: https://vulnerable-test-site.vercel.app/pricing
2025-07-14 13:37:24.963	
[2025-07-14T20:37:24.963Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.vercel-app.com
2025-07-14 13:37:24.963	
[2025-07-14T20:37:24.963Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.vercel-app.com
2025-07-14 13:37:24.963	
[2025-07-14T20:37:24.963Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.vercel-app.com
2025-07-14 13:37:24.963	
[2025-07-14T20:37:24.963Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:24.963	
[2025-07-14T20:37:24.963Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:24.963	
[2025-07-14T20:37:24.963Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:24.963	
[2025-07-14T20:37:24.963Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:24.963	
[2025-07-14T20:37:24.963Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:24.963	
[2025-07-14T20:37:24.963Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:24.963	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:24.963	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:24.963	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:24.963	
[2025-07-14T20:37:24.962Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:24.963	
[2025-07-14T20:37:24.962Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:24.963	
[2025-07-14T20:37:24.962Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:24.885	
[2025-07-14T20:37:24.885Z] [fastTechDetection] Header detection found 2 techs, skipping WebTech for https://vulnerable-test-site.vercel.app
2025-07-14 13:37:24.885	
[2025-07-14T20:37:24.885Z] [fastTechDetection] Header detection found 2 techs, skipping WebTech for https://vulnerable-test-site.vercel.app
2025-07-14 13:37:24.885	
[2025-07-14T20:37:24.885Z] [fastTechDetection] Header detection found 2 techs, skipping WebTech for https://vulnerable-test-site.vercel.app
2025-07-14 13:37:24.885	
[2025-07-14T20:37:24.884Z] [fastTechDetection] Header detection found 2 technologies for https://vulnerable-test-site.vercel.app
2025-07-14 13:37:24.885	
[2025-07-14T20:37:24.884Z] [fastTechDetection] Header detection found 2 technologies for https://vulnerable-test-site.vercel.app
2025-07-14 13:37:24.885	
[2025-07-14T20:37:24.884Z] [fastTechDetection] Header detection found 2 technologies for https://vulnerable-test-site.vercel.app
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.867Z] [fastTechDetection] Checking headers for quick tech detection: https://www.vulnerable-test-site.vercel.app
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.867Z] [fastTechDetection] Checking headers for quick tech detection: https://www.vulnerable-test-site.vercel.app
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.867Z] [fastTechDetection] Checking headers for quick tech detection: https://www.vulnerable-test-site.vercel.app
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.866Z] [fastTechDetection] Checking headers for quick tech detection: https://vulnerable-test-site.vercel.app
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.866Z] [fastTechDetection] Checking headers for quick tech detection: https://vulnerable-test-site.vercel.app
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.866Z] [fastTechDetection] Checking headers for quick tech detection: https://vulnerable-test-site.vercel.app
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.866Z] [fastTechDetection] Starting batch fast tech detection for 2 URLs
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.866Z] [fastTechDetection] Starting batch fast tech detection for 2 URLs
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.866Z] [fastTechDetection] Starting batch fast tech detection for 2 URLs
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.865Z] [fastDetection] fastDetection=batch starting urls=2 concurrency=6
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.865Z] [fastDetection] fastDetection=batch starting urls=2 concurrency=6
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.865Z] [fastDetection] fastDetection=batch starting urls=2 concurrency=6
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.865Z] [techDetection] detection=fast_tech starting for 2 targets
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.865Z] [techDetection] detection=fast_tech starting for 2 targets
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.865Z] [techDetection] detection=fast_tech starting for 2 targets
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.865Z] [techDetection] detection=start targets=2 html=2 limited=2
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.865Z] [techDetection] detection=start targets=2 html=2 limited=2
2025-07-14 13:37:24.867	
[2025-07-14T20:37:24.865Z] [techDetection] detection=start targets=2 html=2 limited=2
2025-07-14 13:37:24.862	
[2025-07-14T20:37:24.862Z] [techStackScan] techstack=tech_detection starting unified detection for 2 targets
2025-07-14 13:37:24.862	
[2025-07-14T20:37:24.862Z] [techStackScan] techstack=tech_detection starting unified detection for 2 targets
2025-07-14 13:37:24.862	
[2025-07-14T20:37:24.862Z] [techStackScan] techstack=tech_detection starting unified detection for 2 targets
2025-07-14 13:37:24.862	
[2025-07-14T20:37:24.862Z] [techStackScan] techstack=targets primary=2 thirdParty=0 total=2 html=2 finalHtml=2 nonHtml=0 skipped=0
2025-07-14 13:37:24.862	
[2025-07-14T20:37:24.862Z] [techStackScan] techstack=targets primary=2 thirdParty=0 total=2 html=2 finalHtml=2 nonHtml=0 skipped=0
2025-07-14 13:37:24.862	
[2025-07-14T20:37:24.862Z] [techStackScan] techstack=targets primary=2 thirdParty=0 total=2 html=2 finalHtml=2 nonHtml=0 skipped=0
2025-07-14 13:37:24.850	
[2025-07-14T20:37:24.849Z] [dynamicBrowser] Page operation completed in 2111ms
2025-07-14 13:37:24.850	
[2025-07-14T20:37:24.849Z] [dynamicBrowser] Page operation completed in 2111ms
2025-07-14 13:37:24.850	
[2025-07-14T20:37:24.849Z] [dynamicBrowser] Page operation completed in 2111ms
2025-07-14 13:37:24.850	
[2025-07-14T20:37:24.849Z] [targetDiscovery] thirdParty=discovered domain=vulnerable-test-site.vercel.app total=0 (html=0, nonHtml=0)
2025-07-14 13:37:24.850	
[2025-07-14T20:37:24.849Z] [targetDiscovery] thirdParty=discovered domain=vulnerable-test-site.vercel.app total=0 (html=0, nonHtml=0)
2025-07-14 13:37:24.850	
[2025-07-14T20:37:24.849Z] [targetDiscovery] thirdParty=discovered domain=vulnerable-test-site.vercel.app total=0 (html=0, nonHtml=0)
2025-07-14 13:37:24.284	
[artifactStore] Inserted finding MALICIOUS_TYPOSQUAT for artifact 256
2025-07-14 13:37:24.284	
[artifactStore] Inserted finding MALICIOUS_TYPOSQUAT for artifact 256
2025-07-14 13:37:24.284	
[artifactStore] Inserted finding MALICIOUS_TYPOSQUAT for artifact 256
2025-07-14 13:37:24.207	
[artifactStore] Inserted typo_domain artifact: Active typosquat threat detected: vulnerable-test-site.gerce...
2025-07-14 13:37:24.207	
[artifactStore] Inserted typo_domain artifact: Active typosquat threat detected: vulnerable-test-site.gerce...
2025-07-14 13:37:24.207	
[artifactStore] Inserted typo_domain artifact: Active typosquat threat detected: vulnerable-test-site.gerce...
2025-07-14 13:37:23.920	
[2025-07-14T20:37:23.920Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.gercel.app
2025-07-14 13:37:23.920	
[2025-07-14T20:37:23.920Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.gercel.app
2025-07-14 13:37:23.920	
[2025-07-14T20:37:23.920Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.gercel.app
2025-07-14 13:37:23.420	
[2025-07-14T20:37:23.420Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.gercel.app
2025-07-14 13:37:23.420	
[2025-07-14T20:37:23.420Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.gercel.app
2025-07-14 13:37:23.420	
[2025-07-14T20:37:23.420Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.gercel.app
2025-07-14 13:37:23.420	
[2025-07-14T20:37:23.420Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:23.420	
[2025-07-14T20:37:23.420Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:23.420	
[2025-07-14T20:37:23.420Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:23.420	
[2025-07-14T20:37:23.420Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:23.420	
[2025-07-14T20:37:23.420Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:23.420	
[2025-07-14T20:37:23.420Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:23.420	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:23.420	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:23.420	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:23.420	
[2025-07-14T20:37:23.420Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:23.420	
[2025-07-14T20:37:23.420Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:23.420	
[2025-07-14T20:37:23.420Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:22.949	
[2025-07-14T20:37:22.949Z] [dnstwist] ↪️ LEGITIMATE REDIRECT: vulnerable-test-site.vercelapp.com marked as INFO severity - redirects to original
2025-07-14 13:37:22.949	
[2025-07-14T20:37:22.949Z] [dnstwist] ↪️ LEGITIMATE REDIRECT: vulnerable-test-site.vercelapp.com marked as INFO severity - redirects to original
2025-07-14 13:37:22.949	
[2025-07-14T20:37:22.949Z] [dnstwist] ↪️ LEGITIMATE REDIRECT: vulnerable-test-site.vercelapp.com marked as INFO severity - redirects to original
2025-07-14 13:37:22.851	
[2025-07-14T20:37:22.851Z] [dnstwist] ↪️ LEGITIMATE REDIRECT: vulnerable-test-site.vercle.app marked as INFO severity - redirects to original
2025-07-14 13:37:22.851	
[2025-07-14T20:37:22.851Z] [dnstwist] ↪️ LEGITIMATE REDIRECT: vulnerable-test-site.vercle.app marked as INFO severity - redirects to original
2025-07-14 13:37:22.851	
[2025-07-14T20:37:22.851Z] [dnstwist] ↪️ LEGITIMATE REDIRECT: vulnerable-test-site.vercle.app marked as INFO severity - redirects to original
2025-07-14 13:37:22.674	
[2025-07-14T20:37:22.674Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.vercelapp.com
2025-07-14 13:37:22.674	
[2025-07-14T20:37:22.674Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.vercelapp.com
2025-07-14 13:37:22.674	
[2025-07-14T20:37:22.674Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.vercelapp.com
2025-07-14 13:37:22.573	
[2025-07-14T20:37:22.573Z] [targetDiscovery] buildTargets discovered=0 total=2 (html=2, nonHtml=0)
2025-07-14 13:37:22.573	
[2025-07-14T20:37:22.573Z] [targetDiscovery] buildTargets discovered=0 total=2 (html=2, nonHtml=0)
2025-07-14 13:37:22.573	
[2025-07-14T20:37:22.573Z] [targetDiscovery] buildTargets discovered=0 total=2 (html=2, nonHtml=0)
2025-07-14 13:37:22.573	
[artifactStore] Query returned 0 rows
2025-07-14 13:37:22.573	
[artifactStore] Query returned 0 rows
2025-07-14 13:37:22.573	
[artifactStore] Query returned 0 rows
2025-07-14 13:37:22.526	
[2025-07-14T20:37:22.526Z] [nucleiWrapper] Using baseline timeout: 8000ms
2025-07-14 13:37:22.526	
[2025-07-14T20:37:22.526Z] [nucleiWrapper] Using baseline timeout: 8000ms
2025-07-14 13:37:22.526	
[2025-07-14T20:37:22.526Z] [nucleiWrapper] Using baseline timeout: 8000ms
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.516Z] [nucleiWrapper] Executing nuclei: /usr/local/bin/nuclei -silent -jsonl -u https://vulnerable-test-site.vercel.app -tags misconfiguration,default-logins,exposed-panels,exposure,tech -c 48 -retries 2
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.516Z] [nucleiWrapper] Executing nuclei: /usr/local/bin/nuclei -silent -jsonl -u https://vulnerable-test-site.vercel.app -tags misconfiguration,default-logins,exposed-panels,exposure,tech -c 48 -retries 2
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.516Z] [nucleiWrapper] Executing nuclei: /usr/local/bin/nuclei -silent -jsonl -u https://vulnerable-test-site.vercel.app -tags misconfiguration,default-logins,exposed-panels,exposure,tech -c 48 -retries 2
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.516Z] [nucleiWrapper] Pass 1: Running baseline scan with tags: misconfiguration,default-logins,exposed-panels,exposure,tech
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.516Z] [nucleiWrapper] Pass 1: Running baseline scan with tags: misconfiguration,default-logins,exposed-panels,exposure,tech
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.516Z] [nucleiWrapper] Pass 1: Running baseline scan with tags: misconfiguration,default-logins,exposed-panels,exposure,tech
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.516Z] [nucleiWrapper] Starting two-pass scan for https://vulnerable-test-site.vercel.app
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.516Z] [nucleiWrapper] Starting two-pass scan for https://vulnerable-test-site.vercel.app
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.516Z] [nucleiWrapper] Starting two-pass scan for https://vulnerable-test-site.vercel.app
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.516Z] [nuclei] [Tag Scan] Running enhanced two-pass scan on https://vulnerable-test-site.vercel.app
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.516Z] [nuclei] [Tag Scan] Running enhanced two-pass scan on https://vulnerable-test-site.vercel.app
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.516Z] [nuclei] [Tag Scan] Running enhanced two-pass scan on https://vulnerable-test-site.vercel.app
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.515Z] [nuclei] --- Phase 1: General Vulnerability Scanning ---
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.515Z] [nuclei] --- Phase 1: General Vulnerability Scanning ---
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.515Z] [nuclei] --- Phase 1: General Vulnerability Scanning ---
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.515Z] [nucleiWrapper] Nuclei execution completed: 0 results, exit code 0
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.515Z] [nucleiWrapper] Nuclei execution completed: 0 results, exit code 0
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.515Z] [nucleiWrapper] Nuclei execution completed: 0 results, exit code 0
2025-07-14 13:37:22.522	
[INF] PDCP Directory: /root/.pdcp
2025-07-14 13:37:22.522	
[INF] PDCP Directory: /root/.pdcp
2025-07-14 13:37:22.522	
[INF] PDCP Directory: /root/.pdcp
2025-07-14 13:37:22.522	
[INF] Nuclei Cache Directory: /root/.cache/nuclei
2025-07-14 13:37:22.522	
[INF] Nuclei Cache Directory: /root/.cache/nuclei
2025-07-14 13:37:22.522	
[INF] Nuclei Cache Directory: /root/.cache/nuclei
2025-07-14 13:37:22.522	
[INF] Nuclei Config Directory: /root/.config/nuclei
2025-07-14 13:37:22.522	
[INF] Nuclei Config Directory: /root/.config/nuclei
2025-07-14 13:37:22.522	
[INF] Nuclei Config Directory: /root/.config/nuclei
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.515Z] [nucleiWrapper] Nuclei stderr: [INF] Nuclei Engine Version: v3.4.5
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.515Z] [nucleiWrapper] Nuclei stderr: [INF] Nuclei Engine Version: v3.4.5
2025-07-14 13:37:22.522	
[2025-07-14T20:37:22.515Z] [nucleiWrapper] Nuclei stderr: [INF] Nuclei Engine Version: v3.4.5
2025-07-14 13:37:22.507	
}
2025-07-14 13:37:22.507	
}
2025-07-14 13:37:22.507	
}
2025-07-14 13:37:22.507	
'         W'
2025-07-14 13:37:22.507	
'         W'
2025-07-14 13:37:22.507	
'         W'
2025-07-14 13:37:22.507	
'         FROM artifacts\n' +
2025-07-14 13:37:22.507	
'         FROM artifacts\n' +
2025-07-14 13:37:22.507	
'         FROM artifacts\n' +
2025-07-14 13:37:22.507	
query: "SELECT jsonb_path_query_array(meta, '$.endpoints[*].url') AS urls\n" +
2025-07-14 13:37:22.507	
query: "SELECT jsonb_path_query_array(meta, '$.endpoints[*].url') AS urls\n" +
2025-07-14 13:37:22.507	
query: "SELECT jsonb_path_query_array(meta, '$.endpoints[*].url') AS urls\n" +
2025-07-14 13:37:22.507	
params: [ 'tSXlMR9RZAO' ],
2025-07-14 13:37:22.507	
params: [ 'tSXlMR9RZAO' ],
2025-07-14 13:37:22.507	
params: [ 'tSXlMR9RZAO' ],
2025-07-14 13:37:22.507	
isJoinQuery: false,
2025-07-14 13:37:22.507	
isJoinQuery: false,
2025-07-14 13:37:22.507	
isJoinQuery: false,
2025-07-14 13:37:22.507	
table: 'artifacts',
2025-07-14 13:37:22.507	
table: 'artifacts',
2025-07-14 13:37:22.507	
table: 'artifacts',
2025-07-14 13:37:22.507	
[artifactStore] Executing query: {
2025-07-14 13:37:22.507	
[artifactStore] Executing query: {
2025-07-14 13:37:22.507	
[artifactStore] Executing query: {
2025-07-14 13:37:22.506	
[2025-07-14T20:37:22.506Z] [techStackScan] techstack=target_discovery starting for domain=vulnerable-test-site.vercel.app
2025-07-14 13:37:22.506	
[2025-07-14T20:37:22.506Z] [techStackScan] techstack=target_discovery starting for domain=vulnerable-test-site.vercel.app
2025-07-14 13:37:22.506	
[2025-07-14T20:37:22.506Z] [techStackScan] techstack=target_discovery starting for domain=vulnerable-test-site.vercel.app
2025-07-14 13:37:22.506	
[2025-07-14T20:37:22.505Z] [techStackScan] techstack=nuclei wrapper confirmed available
2025-07-14 13:37:22.506	
[2025-07-14T20:37:22.505Z] [techStackScan] techstack=nuclei wrapper confirmed available
2025-07-14 13:37:22.506	
[2025-07-14T20:37:22.505Z] [techStackScan] techstack=nuclei wrapper confirmed available
2025-07-14 13:37:22.506	
[2025-07-14T20:37:22.505Z] [nucleiWrapper] Nuclei execution completed: 0 results, exit code 0
2025-07-14 13:37:22.506	
[2025-07-14T20:37:22.505Z] [nucleiWrapper] Nuclei execution completed: 0 results, exit code 0
2025-07-14 13:37:22.506	
[2025-07-14T20:37:22.505Z] [nucleiWrapper] Nuclei execution completed: 0 results, exit code 0
2025-07-14 13:37:22.506	
[INF] PDCP Directory: /root/.pdcp
2025-07-14 13:37:22.506	
[INF] PDCP Directory: /root/.pdcp
2025-07-14 13:37:22.506	
[INF] PDCP Directory: /root/.pdcp
2025-07-14 13:37:22.506	
[INF] Nuclei Cache Directory: /root/.cache/nuclei
2025-07-14 13:37:22.506	
[INF] Nuclei Cache Directory: /root/.cache/nuclei
2025-07-14 13:37:22.506	
[INF] Nuclei Cache Directory: /root/.cache/nuclei
2025-07-14 13:37:22.506	
[INF] Nuclei Config Directory: /root/.config/nuclei
2025-07-14 13:37:22.506	
[INF] Nuclei Config Directory: /root/.config/nuclei
2025-07-14 13:37:22.506	
[INF] Nuclei Config Directory: /root/.config/nuclei
2025-07-14 13:37:22.506	
[2025-07-14T20:37:22.505Z] [nucleiWrapper] Nuclei stderr: [INF] Nuclei Engine Version: v3.4.5
2025-07-14 13:37:22.506	
[2025-07-14T20:37:22.505Z] [nucleiWrapper] Nuclei stderr: [INF] Nuclei Engine Version: v3.4.5
2025-07-14 13:37:22.506	
[2025-07-14T20:37:22.505Z] [nucleiWrapper] Nuclei stderr: [INF] Nuclei Engine Version: v3.4.5
2025-07-14 13:37:22.395	
[artifactStore] Inserted finding MALICIOUS_TYPOSQUAT for artifact 253
2025-07-14 13:37:22.395	
[artifactStore] Inserted finding MALICIOUS_TYPOSQUAT for artifact 253
2025-07-14 13:37:22.395	
[artifactStore] Inserted finding MALICIOUS_TYPOSQUAT for artifact 253
2025-07-14 13:37:22.329	
[artifactStore] Inserted typo_domain artifact: Active typosquat threat detected: vulnerable-test-site.cerce...
2025-07-14 13:37:22.329	
[artifactStore] Inserted typo_domain artifact: Active typosquat threat detected: vulnerable-test-site.cerce...
2025-07-14 13:37:22.329	
[artifactStore] Inserted typo_domain artifact: Active typosquat threat detected: vulnerable-test-site.cerce...
2025-07-14 13:37:22.181	
[2025-07-14T20:37:22.180Z] [abuseIntelScan] completed operation="main" duration=110ms
2025-07-14 13:37:22.181	
[2025-07-14T20:37:22.180Z] [abuseIntelScan] completed operation="main" duration=110ms
2025-07-14 13:37:22.181	
[2025-07-14T20:37:22.180Z] [abuseIntelScan] completed operation="main" duration=110ms
2025-07-14 13:37:22.181	
[2025-07-14T20:37:22.180Z] [abuseIntelScan] No IP artifacts found for this scan
2025-07-14 13:37:22.181	
[2025-07-14T20:37:22.180Z] [abuseIntelScan] No IP artifacts found for this scan
2025-07-14 13:37:22.181	
[2025-07-14T20:37:22.180Z] [abuseIntelScan] No IP artifacts found for this scan
2025-07-14 13:37:22.181	
[2025-07-14T20:37:22.180Z] [abuseIntelScan] Found 0 IP artifacts for scan tSXlMR9RZAO
2025-07-14 13:37:22.181	
[2025-07-14T20:37:22.180Z] [abuseIntelScan] Found 0 IP artifacts for scan tSXlMR9RZAO
2025-07-14 13:37:22.181	
[2025-07-14T20:37:22.180Z] [abuseIntelScan] Found 0 IP artifacts for scan tSXlMR9RZAO
2025-07-14 13:37:22.181	
[artifactStore] Query returned 0 rows
2025-07-14 13:37:22.181	
[artifactStore] Query returned 0 rows
2025-07-14 13:37:22.181	
[artifactStore] Query returned 0 rows
2025-07-14 13:37:22.179	
[2025-07-14T20:37:22.178Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.vercle.app
2025-07-14 13:37:22.179	
[2025-07-14T20:37:22.178Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.vercle.app
2025-07-14 13:37:22.179	
[2025-07-14T20:37:22.178Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.vercle.app
2025-07-14 13:37:22.176	
[2025-07-14T20:37:22.175Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.vercelapp.com
2025-07-14 13:37:22.176	
[2025-07-14T20:37:22.175Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.vercelapp.com
2025-07-14 13:37:22.176	
[2025-07-14T20:37:22.175Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.vercelapp.com
2025-07-14 13:37:22.175	
[2025-07-14T20:37:22.174Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:22.175	
[2025-07-14T20:37:22.174Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:22.175	
[2025-07-14T20:37:22.174Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:22.175	
[2025-07-14T20:37:22.174Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:22.175	
[2025-07-14T20:37:22.174Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:22.175	
[2025-07-14T20:37:22.174Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:22.175	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:22.175	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:22.175	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:22.175	
[2025-07-14T20:37:22.174Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:22.175	
[2025-07-14T20:37:22.174Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:22.175	
[2025-07-14T20:37:22.174Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:22.077	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] WAITING for dns_twist scan to complete...
2025-07-14 13:37:22.077	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] WAITING for dns_twist scan to complete...
2025-07-14 13:37:22.077	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] WAITING for dns_twist scan to complete...
2025-07-14 13:37:22.077	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] COMPLETED shodan scan: 0 findings found
2025-07-14 13:37:22.077	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] COMPLETED shodan scan: 0 findings found
2025-07-14 13:37:22.077	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] COMPLETED shodan scan: 0 findings found
2025-07-14 13:37:22.075	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] WAITING for shodan scan to complete...
2025-07-14 13:37:22.075	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] WAITING for shodan scan to complete...
2025-07-14 13:37:22.075	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] WAITING for shodan scan to complete...
2025-07-14 13:37:22.075	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] COMPLETED breach_directory_probe scan: 0 findings found
2025-07-14 13:37:22.075	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] COMPLETED breach_directory_probe scan: 0 findings found
2025-07-14 13:37:22.075	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] COMPLETED breach_directory_probe scan: 0 findings found
2025-07-14 13:37:22.074	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] WAITING for breach_directory_probe scan to complete...
2025-07-14 13:37:22.074	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] WAITING for breach_directory_probe scan to complete...
2025-07-14 13:37:22.074	
[2025-07-14T20:37:22.074Z] [worker] [tSXlMR9RZAO] WAITING for breach_directory_probe scan to complete...
2025-07-14 13:37:22.074	
}
2025-07-14 13:37:22.074	
}
2025-07-14 13:37:22.074	
}
2025-07-14 13:37:22.074	
"       WHERE type = 'ip' AND meta->>'scan_id' = $1"
2025-07-14 13:37:22.074	
"       WHERE type = 'ip' AND meta->>'scan_id' = $1"
2025-07-14 13:37:22.074	
"       WHERE type = 'ip' AND meta->>'scan_id' = $1"
2025-07-14 13:37:22.074	
'       FROM artifacts \n' +
2025-07-14 13:37:22.074	
'       FROM artifacts \n' +
2025-07-14 13:37:22.074	
'       FROM artifacts \n' +
2025-07-14 13:37:22.074	
query: 'SELECT id, val_text, meta \n' +
2025-07-14 13:37:22.074	
query: 'SELECT id, val_text, meta \n' +
2025-07-14 13:37:22.074	
query: 'SELECT id, val_text, meta \n' +
2025-07-14 13:37:22.074	
params: [ 'tSXlMR9RZAO' ],
2025-07-14 13:37:22.074	
params: [ 'tSXlMR9RZAO' ],
2025-07-14 13:37:22.074	
params: [ 'tSXlMR9RZAO' ],
2025-07-14 13:37:22.074	
isJoinQuery: false,
2025-07-14 13:37:22.074	
isJoinQuery: false,
2025-07-14 13:37:22.074	
isJoinQuery: false,
2025-07-14 13:37:22.074	
table: 'artifacts',
2025-07-14 13:37:22.074	
table: 'artifacts',
2025-07-14 13:37:22.074	
table: 'artifacts',
2025-07-14 13:37:22.074	
[artifactStore] Executing query: {
2025-07-14 13:37:22.074	
[artifactStore] Executing query: {
2025-07-14 13:37:22.074	
[artifactStore] Executing query: {
2025-07-14 13:37:22.072	
[2025-07-14T20:37:22.070Z] [abuseIntelScan] Starting AbuseIPDB scan for scanId=tSXlMR9RZAO
2025-07-14 13:37:22.072	
[2025-07-14T20:37:22.070Z] [abuseIntelScan] Starting AbuseIPDB scan for scanId=tSXlMR9RZAO
2025-07-14 13:37:22.072	
[2025-07-14T20:37:22.070Z] [abuseIntelScan] Starting AbuseIPDB scan for scanId=tSXlMR9RZAO
2025-07-14 13:37:22.072	
[2025-07-14T20:37:22.070Z] [abuseIntelScan] starting operation="main"
2025-07-14 13:37:22.072	
[2025-07-14T20:37:22.070Z] [abuseIntelScan] starting operation="main"
2025-07-14 13:37:22.072	
[2025-07-14T20:37:22.070Z] [abuseIntelScan] starting operation="main"
2025-07-14 13:37:22.069	
[2025-07-14T20:37:22.069Z] [worker] [tSXlMR9RZAO] STARTING AbuseIPDB intelligence scan for IPs (parallel after endpoint discovery)
2025-07-14 13:37:22.069	
[2025-07-14T20:37:22.069Z] [worker] [tSXlMR9RZAO] STARTING AbuseIPDB intelligence scan for IPs (parallel after endpoint discovery)
2025-07-14 13:37:22.069	
[2025-07-14T20:37:22.069Z] [worker] [tSXlMR9RZAO] STARTING AbuseIPDB intelligence scan for IPs (parallel after endpoint discovery)
2025-07-14 13:37:22.069	
[2025-07-14T20:37:22.069Z] [nucleiWrapper] Using baseline timeout: 8000ms
2025-07-14 13:37:22.069	
[2025-07-14T20:37:22.069Z] [nucleiWrapper] Using baseline timeout: 8000ms
2025-07-14 13:37:22.069	
[2025-07-14T20:37:22.069Z] [nucleiWrapper] Using baseline timeout: 8000ms
2025-07-14 13:37:22.065	
[2025-07-14T20:37:22.064Z] [nucleiWrapper] Executing nuclei: /usr/local/bin/nuclei -version
2025-07-14 13:37:22.065	
[2025-07-14T20:37:22.064Z] [nucleiWrapper] Executing nuclei: /usr/local/bin/nuclei -version
2025-07-14 13:37:22.065	
[2025-07-14T20:37:22.064Z] [nucleiWrapper] Executing nuclei: /usr/local/bin/nuclei -version
2025-07-14 13:37:22.065	
[2025-07-14T20:37:22.064Z] [techStackScan] techstack=start domain=vulnerable-test-site.vercel.app
2025-07-14 13:37:22.065	
[2025-07-14T20:37:22.064Z] [techStackScan] techstack=start domain=vulnerable-test-site.vercel.app
2025-07-14 13:37:22.065	
[2025-07-14T20:37:22.064Z] [techStackScan] techstack=start domain=vulnerable-test-site.vercel.app
2025-07-14 13:37:22.063	
[2025-07-14T20:37:22.063Z] [worker] [tSXlMR9RZAO] STARTING tech stack scan for vulnerable-test-site.vercel.app (parallel after endpoint discovery)
2025-07-14 13:37:22.063	
[2025-07-14T20:37:22.063Z] [worker] [tSXlMR9RZAO] STARTING tech stack scan for vulnerable-test-site.vercel.app (parallel after endpoint discovery)
2025-07-14 13:37:22.063	
[2025-07-14T20:37:22.063Z] [worker] [tSXlMR9RZAO] STARTING tech stack scan for vulnerable-test-site.vercel.app (parallel after endpoint discovery)
2025-07-14 13:37:22.063	
[2025-07-14T20:37:22.063Z] [nucleiWrapper] Using baseline timeout: 8000ms
2025-07-14 13:37:22.063	
[2025-07-14T20:37:22.063Z] [nucleiWrapper] Using baseline timeout: 8000ms
2025-07-14 13:37:22.063	
[2025-07-14T20:37:22.063Z] [nucleiWrapper] Using baseline timeout: 8000ms
2025-07-14 13:37:22.056	
[2025-07-14T20:37:22.056Z] [nucleiWrapper] Executing nuclei: /usr/local/bin/nuclei -version
2025-07-14 13:37:22.056	
[2025-07-14T20:37:22.056Z] [nucleiWrapper] Executing nuclei: /usr/local/bin/nuclei -version
2025-07-14 13:37:22.056	
[2025-07-14T20:37:22.056Z] [nucleiWrapper] Executing nuclei: /usr/local/bin/nuclei -version
2025-07-14 13:37:22.056	
[2025-07-14T20:37:22.055Z] [nuclei] Starting consolidated vulnerability scan for vulnerable-test-site.vercel.app (requested by legacy_worker)
2025-07-14 13:37:22.056	
[2025-07-14T20:37:22.055Z] [nuclei] Starting consolidated vulnerability scan for vulnerable-test-site.vercel.app (requested by legacy_worker)
2025-07-14 13:37:22.056	
[2025-07-14T20:37:22.055Z] [nuclei] Starting consolidated vulnerability scan for vulnerable-test-site.vercel.app (requested by legacy_worker)
2025-07-14 13:37:22.055	
[2025-07-14T20:37:22.055Z] [worker] [tSXlMR9RZAO] STARTING Nuclei vulnerability scan for vulnerable-test-site.vercel.app (parallel after endpoint discovery)
2025-07-14 13:37:22.055	
[2025-07-14T20:37:22.055Z] [worker] [tSXlMR9RZAO] STARTING Nuclei vulnerability scan for vulnerable-test-site.vercel.app (parallel after endpoint discovery)
2025-07-14 13:37:22.055	
[2025-07-14T20:37:22.055Z] [worker] [tSXlMR9RZAO] STARTING Nuclei vulnerability scan for vulnerable-test-site.vercel.app (parallel after endpoint discovery)
2025-07-14 13:37:22.055	
[2025-07-14T20:37:22.055Z] [worker] [tSXlMR9RZAO] COMPLETED endpoint discovery: 0 endpoint collections found
2025-07-14 13:37:22.055	
[2025-07-14T20:37:22.055Z] [worker] [tSXlMR9RZAO] COMPLETED endpoint discovery: 0 endpoint collections found
2025-07-14 13:37:22.055	
[2025-07-14T20:37:22.055Z] [worker] [tSXlMR9RZAO] COMPLETED endpoint discovery: 0 endpoint collections found
2025-07-14 13:37:22.055	
[2025-07-14T20:37:22.055Z] [endpointDiscovery] ⇢ done – 0 endpoints, 16 web assets
2025-07-14 13:37:22.055	
[2025-07-14T20:37:22.055Z] [endpointDiscovery] ⇢ done – 0 endpoints, 16 web assets
2025-07-14 13:37:22.055	
[2025-07-14T20:37:22.055Z] [endpointDiscovery] ⇢ done – 0 endpoints, 16 web assets
2025-07-14 13:37:21.987	
[2025-07-14T20:37:21.987Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/app.config.json
2025-07-14 13:37:21.987	
[2025-07-14T20:37:21.987Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/app.config.json
2025-07-14 13:37:21.987	
[2025-07-14T20:37:21.987Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/app.config.json
2025-07-14 13:37:21.987	
[2025-07-14T20:37:21.986Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/app.config.json (0 bytes)
2025-07-14 13:37:21.987	
[2025-07-14T20:37:21.986Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/app.config.json (0 bytes)
2025-07-14 13:37:21.987	
[2025-07-14T20:37:21.986Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/app.config.json (0 bytes)
2025-07-14 13:37:21.984	
[2025-07-14T20:37:21.984Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.cercel.app
2025-07-14 13:37:21.984	
[2025-07-14T20:37:21.984Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.cercel.app
2025-07-14 13:37:21.984	
[2025-07-14T20:37:21.984Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.cercel.app
2025-07-14 13:37:21.983	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/config.json
2025-07-14 13:37:21.983	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/config.json
2025-07-14 13:37:21.983	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/config.json
2025-07-14 13:37:21.983	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/config.json (0 bytes)
2025-07-14 13:37:21.983	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/config.json (0 bytes)
2025-07-14 13:37:21.983	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/config.json (0 bytes)
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/config.js
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/config.js
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/config.js
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] +web_asset javascript https://vulnerable-test-site.vercel.app/config.js (0 bytes)
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] +web_asset javascript https://vulnerable-test-site.vercel.app/config.js (0 bytes)
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] +web_asset javascript https://vulnerable-test-site.vercel.app/config.js (0 bytes)
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/.env.production
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/.env.production
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/.env.production
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/.env.production (0 bytes)
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/.env.production (0 bytes)
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.982Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/.env.production (0 bytes)
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.981Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/.env
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.981Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/.env
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.981Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/.env
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.981Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/.env (0 bytes)
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.981Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/.env (0 bytes)
2025-07-14 13:37:21.982	
[2025-07-14T20:37:21.981Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/.env (0 bytes)
2025-07-14 13:37:21.981	
[2025-07-14T20:37:21.981Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/static/js/main.js
2025-07-14 13:37:21.981	
[2025-07-14T20:37:21.981Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/static/js/main.js
2025-07-14 13:37:21.981	
[2025-07-14T20:37:21.981Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/static/js/main.js
2025-07-14 13:37:21.981	
[2025-07-14T20:37:21.981Z] [endpointDiscovery] +web_asset javascript https://vulnerable-test-site.vercel.app/static/js/main.js (0 bytes)
2025-07-14 13:37:21.981	
[2025-07-14T20:37:21.981Z] [endpointDiscovery] +web_asset javascript https://vulnerable-test-site.vercel.app/static/js/main.js (0 bytes)
2025-07-14 13:37:21.981	
[2025-07-14T20:37:21.981Z] [endpointDiscovery] +web_asset javascript https://vulnerable-test-site.vercel.app/static/js/main.js (0 bytes)
2025-07-14 13:37:21.980	
[2025-07-14T20:37:21.980Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/_next/static/chunks/webpack.js
2025-07-14 13:37:21.980	
[2025-07-14T20:37:21.980Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/_next/static/chunks/webpack.js
2025-07-14 13:37:21.980	
[2025-07-14T20:37:21.980Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/_next/static/chunks/webpack.js
2025-07-14 13:37:21.980	
[2025-07-14T20:37:21.980Z] [endpointDiscovery] +web_asset javascript https://vulnerable-test-site.vercel.app/_next/static/chunks/webpack.js (0 bytes)
2025-07-14 13:37:21.980	
[2025-07-14T20:37:21.980Z] [endpointDiscovery] +web_asset javascript https://vulnerable-test-site.vercel.app/_next/static/chunks/webpack.js (0 bytes)
2025-07-14 13:37:21.980	
[2025-07-14T20:37:21.980Z] [endpointDiscovery] +web_asset javascript https://vulnerable-test-site.vercel.app/_next/static/chunks/webpack.js (0 bytes)
2025-07-14 13:37:21.979	
[2025-07-14T20:37:21.979Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/build/config.json
2025-07-14 13:37:21.979	
[2025-07-14T20:37:21.979Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/build/config.json
2025-07-14 13:37:21.979	
[2025-07-14T20:37:21.979Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/build/config.json
2025-07-14 13:37:21.979	
[2025-07-14T20:37:21.979Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/build/config.json (0 bytes)
2025-07-14 13:37:21.979	
[2025-07-14T20:37:21.979Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/build/config.json (0 bytes)
2025-07-14 13:37:21.979	
[2025-07-14T20:37:21.979Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/build/config.json (0 bytes)
2025-07-14 13:37:21.978	
[2025-07-14T20:37:21.978Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/manifest.json
2025-07-14 13:37:21.978	
[2025-07-14T20:37:21.978Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/manifest.json
2025-07-14 13:37:21.978	
[2025-07-14T20:37:21.978Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/manifest.json
2025-07-14 13:37:21.978	
[2025-07-14T20:37:21.978Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/manifest.json (0 bytes)
2025-07-14 13:37:21.978	
[2025-07-14T20:37:21.978Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/manifest.json (0 bytes)
2025-07-14 13:37:21.978	
[2025-07-14T20:37:21.978Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/manifest.json (0 bytes)
2025-07-14 13:37:21.978	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/api/config
2025-07-14 13:37:21.978	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/api/config
2025-07-14 13:37:21.978	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/api/config
2025-07-14 13:37:21.978	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/api/config (0 bytes)
2025-07-14 13:37:21.978	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/api/config (0 bytes)
2025-07-14 13:37:21.978	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/api/config (0 bytes)
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/api/settings
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/api/settings
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/api/settings
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/api/settings (0 bytes)
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/api/settings (0 bytes)
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/api/settings (0 bytes)
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/assets/config.js
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/assets/config.js
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/assets/config.js
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] +web_asset javascript https://vulnerable-test-site.vercel.app/assets/config.js (0 bytes)
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] +web_asset javascript https://vulnerable-test-site.vercel.app/assets/config.js (0 bytes)
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.977Z] [endpointDiscovery] +web_asset javascript https://vulnerable-test-site.vercel.app/assets/config.js (0 bytes)
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.976Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/settings.json
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.976Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/settings.json
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.976Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/settings.json
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.976Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/settings.json (0 bytes)
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.976Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/settings.json (0 bytes)
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.976Z] [endpointDiscovery] +web_asset json https://vulnerable-test-site.vercel.app/settings.json (0 bytes)
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.976Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/.env.local
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.976Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/.env.local
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.976Z] [endpointDiscovery] Found high-value asset: https://vulnerable-test-site.vercel.app/.env.local
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.976Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/.env.local (0 bytes)
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.976Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/.env.local (0 bytes)
2025-07-14 13:37:21.977	
[2025-07-14T20:37:21.976Z] [endpointDiscovery] +web_asset other https://vulnerable-test-site.vercel.app/.env.local (0 bytes)
2025-07-14 13:37:21.969	
[2025-07-14T20:37:21.969Z] [dynamicBrowser] Page operation completed in 2049ms
2025-07-14 13:37:21.969	
[2025-07-14T20:37:21.969Z] [dynamicBrowser] Page operation completed in 2049ms
2025-07-14 13:37:21.969	
[2025-07-14T20:37:21.969Z] [dynamicBrowser] Page operation completed in 2049ms
2025-07-14 13:37:21.968	
[artifactStore] Inserted finding MALICIOUS_TYPOSQUAT for artifact 251
2025-07-14 13:37:21.968	
[artifactStore] Inserted finding MALICIOUS_TYPOSQUAT for artifact 251
2025-07-14 13:37:21.968	
[artifactStore] Inserted finding MALICIOUS_TYPOSQUAT for artifact 251
2025-07-14 13:37:21.908	
[artifactStore] Inserted typo_domain artifact: Active typosquat threat detected: vulnerable-test-site.berce...
2025-07-14 13:37:21.908	
[artifactStore] Inserted typo_domain artifact: Active typosquat threat detected: vulnerable-test-site.berce...
2025-07-14 13:37:21.908	
[artifactStore] Inserted typo_domain artifact: Active typosquat threat detected: vulnerable-test-site.berce...
2025-07-14 13:37:21.824	
[2025-07-14T20:37:21.823Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:21.824	
[2025-07-14T20:37:21.823Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:21.824	
[2025-07-14T20:37:21.823Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:21.730	
[2025-07-14T20:37:21.730Z] [dnstwist] ↪️ LEGITIMATE REDIRECT: vulnerable-test-site.vervel.app marked as INFO severity - redirects to original
2025-07-14 13:37:21.730	
[2025-07-14T20:37:21.730Z] [dnstwist] ↪️ LEGITIMATE REDIRECT: vulnerable-test-site.vervel.app marked as INFO severity - redirects to original
2025-07-14 13:37:21.730	
[2025-07-14T20:37:21.730Z] [dnstwist] ↪️ LEGITIMATE REDIRECT: vulnerable-test-site.vervel.app marked as INFO severity - redirects to original
2025-07-14 13:37:21.605	
[2025-07-14T20:37:21.605Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.vercle.app
2025-07-14 13:37:21.605	
[2025-07-14T20:37:21.605Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.vercle.app
2025-07-14 13:37:21.605	
[2025-07-14T20:37:21.605Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.vercle.app
2025-07-14 13:37:21.605	
[2025-07-14T20:37:21.604Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:21.605	
[2025-07-14T20:37:21.604Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:21.605	
[2025-07-14T20:37:21.604Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:21.605	
[2025-07-14T20:37:21.604Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:21.605	
[2025-07-14T20:37:21.604Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:21.605	
[2025-07-14T20:37:21.604Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:21.605	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:21.605	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:21.605	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:21.605	
[2025-07-14T20:37:21.604Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:21.605	
[2025-07-14T20:37:21.604Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:21.605	
[2025-07-14T20:37:21.604Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:21.449	
[2025-07-14T20:37:21.449Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.bercel.app
2025-07-14 13:37:21.449	
[2025-07-14T20:37:21.449Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.bercel.app
2025-07-14 13:37:21.449	
[2025-07-14T20:37:21.449Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.bercel.app
2025-07-14 13:37:21.418	
[2025-07-14T20:37:21.418Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.cercel.app
2025-07-14 13:37:21.418	
[2025-07-14T20:37:21.418Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.cercel.app
2025-07-14 13:37:21.418	
[2025-07-14T20:37:21.418Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.cercel.app
2025-07-14 13:37:21.418	
[2025-07-14T20:37:21.417Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:21.418	
[2025-07-14T20:37:21.417Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:21.418	
[2025-07-14T20:37:21.417Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:21.418	
[2025-07-14T20:37:21.417Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:21.418	
[2025-07-14T20:37:21.417Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:21.418	
[2025-07-14T20:37:21.417Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:21.418	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:21.418	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:21.418	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:21.418	
[2025-07-14T20:37:21.417Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:21.418	
[2025-07-14T20:37:21.417Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:21.418	
[2025-07-14T20:37:21.417Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:21.255	
[2025-07-14T20:37:21.254Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.vervel.app
2025-07-14 13:37:21.255	
[2025-07-14T20:37:21.254Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.vervel.app
2025-07-14 13:37:21.255	
[2025-07-14T20:37:21.254Z] [dnstwist] ❌ Serper API: No search results found for vulnerable-test-site.vervel.app
2025-07-14 13:37:21.080	
[2025-07-14T20:37:21.079Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:21.080	
[2025-07-14T20:37:21.079Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:21.080	
[2025-07-14T20:37:21.079Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:20.955	
[2025-07-14T20:37:20.952Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.bercel.app
2025-07-14 13:37:20.955	
[2025-07-14T20:37:20.952Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.bercel.app
2025-07-14 13:37:20.955	
[2025-07-14T20:37:20.952Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.bercel.app
2025-07-14 13:37:20.952	
[2025-07-14T20:37:20.952Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:20.952	
[2025-07-14T20:37:20.952Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:20.952	
[2025-07-14T20:37:20.952Z] [whoisWrapper] Saved $0.013 vs WhoisXML
2025-07-14 13:37:20.952	
[2025-07-14T20:37:20.952Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:20.952	
[2025-07-14T20:37:20.952Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:20.952	
[2025-07-14T20:37:20.952Z] [whoisWrapper] WHOIS resolution: 0 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:20.952	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:20.952	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:20.952	
Saved $0.028 vs WhoisXML
2025-07-14 13:37:20.952	
[2025-07-14T20:37:20.952Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:20.952	
[2025-07-14T20:37:20.952Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:20.952	
[2025-07-14T20:37:20.952Z] [whoisWrapper] Python stderr: WHOIS Resolution: 1 RDAP (free) + 1 Whoxy (~$0.002)
2025-07-14 13:37:20.840	
[2025-07-14T20:37:20.840Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:20.840	
[2025-07-14T20:37:20.840Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:20.840	
[2025-07-14T20:37:20.840Z] [documentExposure] process error: Please provide binary data as `Uint8Array`, rather than `Buffer`.
2025-07-14 13:37:20.817	
[2025-07-14T20:37:20.816Z] [dnstwist] 🔍 Calling Serper API for vulnerable-test-site.vervel.app
2025-07-14 13:37:20.810	
[2025-07-14T20:37:20.810Z] [whoisWrapper] Saved $0.013 vs WhoisXML