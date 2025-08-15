# Production Deployment Guide - DealBrief Scanner

## Current Status (2025-08-15 - TIER 1 ENHANCED, TIER 2 PLANNED)
✅ **HTTP CLIENT MIGRATION COMPLETE** - All modules use undici, no axios timeouts
✅ **FAST-ACK SERVER ENHANCED** - OIDC auth, idempotency, full observability
✅ **TIER 1 MODULES EXPANDED** - Added denial_wallet_scan, ai_path_finder, whois_wrapper (code ready, needs deployment)
✅ **SCANNER PRODUCTION-READY** - Eventarc with scale-to-zero, all gaps closed
✅ **API KEYS CONFIGURED** - All required secrets in Secret Manager and linked to service
✅ **FIRESTORE WORKING** - Database configured, findings being written, verified working
✅ **TIER 2 ARCHITECTURE PLANNED** - Complete guide in tier2next.md with 12 deep-scan modules

### Implementation Complete (All ChatGPT Requirements Met):

#### ✅ **Egress/NAT Validation**
- Created validation script: `/scripts/validate-nat.sh`
- Dockerfile configured without VPC connector dependencies
- Runbook for testing IPv4 connectivity included

#### ✅ **IPv6/AAAA Handling**
- `NODE_OPTIONS="--dns-result-order=ipv4first"` in Dockerfile
- `forceIPv4: true` default in httpClient
- IPv4 hostname resolution with fallback

#### ✅ **Per-Phase Timeouts**
- Total timeout: 10s (hard abort)
- Connect timeout: 3s (via HEAD probe option)
- First-byte timeout: 5s (separate controller)
- Idle timeout: 5s (resets on each chunk)
- Body drain abortable with size limits

#### ✅ **Redirects & Body Limits**
- `maxRedirects: 5` default (configurable)
- `redirect: 'manual'` option available
- `maxBodyBytes: 2MB` default per request
- Module-tunable via options

#### ✅ **Keep-Alive & Parallelism**
- `disableKeepAlive` option for disparate hosts
- Connection: close header support
- Module concurrency controlled in executeScan
- Error isolation per module

#### ✅ **Cloud Tasks Configuration**
- Retry policy via task queue config
- OIDC token authentication ready
- Idempotency via scan_id-based task names
- Dead-letter handling via err.code checks

#### ✅ **Observability**
- Structured logging with scan_id, domain, duration
- Module-level success/failure tracking
- Cloud Tasks retry headers logged
- Per-phase timeout error messages

#### ✅ **Worker/Process Limits**
- containerConcurrency: 1 (configurable)
- Fast-ack prevents starvation
- Metadata tracking for completed/failed modules
- Safe error handling without crashes

#### ✅ **Security**
- Pub/Sub payload validation with schema checks
- Domain format validation (regex)
- OIDC audience verification ready
- No exposed secrets in logs

#### ✅ **Persistence & Idempotency**
- Scan results structured for Firestore
- Idempotent task creation (ALREADY_EXISTS handling)
- Retry-safe with scan_id tracking

## 🚨 CRITICAL: Required API Keys and Services

### API Keys Your Modules ACTUALLY Need:

```bash
# REQUIRED - Modules will fail without these
SHODAN_API_KEY=          # Required by: shodan module
SERPER_KEY=              # Required by: documentExposure, dnsTwist, adversarialMediaScan
OPENAI_API_KEY=          # Required by: documentExposure, dnsTwist, aiPathFinder, clientSecretScanner
ABUSEIPDB_API_KEY=       # Required by: abuseIntelScan
LEAKCHECK_API_KEY=       # Required by: breachDirectoryProbe (replaced breach directory)

# OPTIONAL - Some modules can work without these
WHOXY_API_KEY=           # Optional: dnsTwist (falls back to WHOISXML)
WHOISXML_API_KEY=        # Optional: dnsTwist (falls back if no WHOXY)
HIBP_API_KEY=            # Optional: spiderFoot
CHAOS_API_KEY=           # Optional: spiderFoot
CAPTCHA_API_KEY=         # Optional: captchaSolver (not critical)

# GCP Configuration
GCP_PROJECT=precise-victory-467219-s4
GCP_LOCATION=us-central1
TASKS_QUEUE=scan-queue
TASKS_WORKER_URL=https://scanner-service-[HASH].us-central1.run.app/tasks/scan
SCAN_WORKER_SA=scanner-worker-sa@precise-victory-467219-s4.iam.gserviceaccount.com

# Runtime
NODE_ENV=production
PORT=8080
NODE_OPTIONS=--dns-result-order=ipv4first
REQUIRE_AUTH=true  # Enable OIDC verification for /tasks/scan
```

## Step 0: Firestore Setup (✅ COMPLETED - 2025-08-14)

### Firestore is now fully configured:
- ✅ Firestore API enabled
- ✅ Database created at `us-central1`
- ✅ Service account has `datastore.user` permissions
- ✅ Collections created: `scans`, `findings`, `artifacts`
- ✅ Successfully tested write/read operations

### Verified Configuration:
```bash
# Database location: us-central1
# Project: precise-victory-467219-s4
# Collections: scans, findings, artifacts, test-collection
# Service Account: scanner-worker-sa@precise-victory-467219-s4.iam.gserviceaccount.com
```

## Step 1: API Keys Configuration (✅ COMPLETED - 2025-08-14)

### All required secrets are configured in Secret Manager:
- ✅ `shodan-api-key` - Created and accessible
- ✅ `serper-key` - Created and accessible
- ✅ `openai-api-key` - Created and accessible
- ✅ `abuseipdb-api-key` - Created and accessible
- ✅ `leakcheck-api-key` - Created and accessible (replaces breach directory)
- ✅ `whoxy-api-key` - Created and accessible
- ✅ `captcha-api-key` - Created and accessible
- ✅ `censys-api-token` - Created and accessible

### Service Configuration:
- ✅ All secrets linked to `scanner-service` via environment variables
- ✅ Service account has `secretmanager.secretAccessor` role
- ✅ Successfully tested with direct scan endpoint

## Full Production Test

### Step 2: Run Complete Scan Test via API
```bash
# Trigger a scan via the API endpoint
curl -X POST https://scanner-api-242181373909.us-central1.run.app/scan \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Test Company", "domain": "example.com"}'

# Save the scan ID from the response
SCAN_ID="<scan_id_from_response>"
```

### Alternative: Direct Pub/Sub Test
```bash
# Publish directly to Pub/Sub topic
gcloud pubsub topics publish scan-jobs \
  --message='{"scanId":"test-'$(date +%s)'","companyName":"Test Company","domain":"example.com","createdAt":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}' \
  --project=precise-victory-467219-s4
```

### Step 3: Monitor Execution
```bash
# Monitor scanner-service logs (now using Cloud Run service, not jobs)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=scanner-service" \
  --project=precise-victory-467219-s4 \
  --format="table(timestamp,jsonPayload.message,jsonPayload.scanId)" \
  --limit=20 \
  --freshness=5m

# Check for scan processing
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=scanner-service AND jsonPayload.scanId=\"$SCAN_ID\"" \
  --project=precise-victory-467219-s4 \
  --format="table(timestamp,jsonPayload.severity,jsonPayload.message)" \
  --limit=50

# Monitor module execution
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=scanner-service AND textPayload:\"[worker]\"" \
  --project=precise-victory-467219-s4 \
  --format="table(timestamp,textPayload)" \
  --limit=20 \
  --freshness=5m
```

### Step 4: Verify Complete Scan
```bash
# Check for scan completion in Firestore
curl https://scanner-api-242181373909.us-central1.run.app/scan/$SCAN_ID/status

# Check service instances (should scale back to 0 after processing)
gcloud run services describe scanner-service \
  --region=us-central1 \
  --project=precise-victory-467219-s4 \
  --format="value(status.conditions[0].message)"

# Verify Eventarc trigger is healthy
gcloud eventarc triggers describe scanner-pubsub-trigger \
  --location=us-central1 \
  --project=precise-victory-467219-s4 \
  --format="value(state)"
```

## Data Verification

### Step 5: Check Results via API
```bash
# Check scan status
curl https://scanner-api-242181373909.us-central1.run.app/scan/$SCAN_ID/status

# Get findings
curl https://scanner-api-242181373909.us-central1.run.app/scan/$SCAN_ID/findings

# Alternative: Direct Firestore access
gcloud auth print-access-token | xargs -I {} curl -H "Authorization: Bearer {}" \
"https://firestore.googleapis.com/v1/projects/precise-victory-467219-s4/databases/(default)/documents/scans/$SCAN_ID"

# Check findings written
gcloud auth print-access-token | xargs -I {} curl -H "Authorization: Bearer {}" \
"https://firestore.googleapis.com/v1/projects/precise-victory-467219-s4/databases/(default)/documents/findings?pageSize=50" | grep -A5 -B5 "$SCAN_ID"

# Check artifacts written  
gcloud auth print-access-token | xargs -I {} curl -H "Authorization: Bearer {}" \
"https://firestore.googleapis.com/v1/projects/precise-victory-467219-s4/databases/(default)/documents/artifacts?pageSize=50" | grep -A5 -B5 "$SCAN_ID"
```

## Expected Results

### Performance Targets (SHOULD ACHIEVE):
- **Total scan time**: 3-4 minutes (down from 10+ minutes of hanging)
- **endpointDiscovery**: Complete in 1-3 minutes (was hanging indefinitely)
- **Module completion**: All 13 Tier 1 modules should complete
- **No timeouts**: No modules should hit the 3-minute timeout
- **Data persistence**: Scan status should update to "completed" in Firestore

### Success Criteria:
1. ✅ **Execution completes** - Job shows "1 task completed successfully"
2. ✅ **All modules run** - See START/COMPLETE messages for all 13 modules
3. ✅ **No hanging** - No modules timeout or hang indefinitely  
4. ✅ **Data written** - Findings and artifacts saved to Firestore
5. ✅ **Scan status updated** - Scan marked as "completed" (not stuck in "processing")

### Module Checklist:
Expected to see COMPLETED messages for:
- [x] breach_directory_probe (~250ms)
- [x] shodan (~300ms)  
- [x] document_exposure (~1-2s)
- [x] **endpointDiscovery** (~1-3 minutes) ⭐ **KEY TEST**
- [x] spf_dmarc (~3s)
- [x] config_exposure (~6s)
- [x] tls_scan (with Python script fix)
- [x] nuclei (baseline mode)
- [x] tech_stack_scan
- [x] abuse_intel_scan  
- [x] client_secret_scanner
- [x] backend_exposure_scanner
- [x] accessibility_scan (~70s)
- [x] asset_correlator (final)

## Troubleshooting

### If Scan Hangs:
```bash
# Check if scanner-service is running
gcloud run services describe scanner-service \
  --region=us-central1 \
  --project=precise-victory-467219-s4 \
  --format="table(status.latestReadyRevisionName,status.conditions[0].message)"

# Check Eventarc subscription for stuck messages
gcloud pubsub subscriptions pull eventarc-us-central1-scanner-pubsub-trigger-sub-798 \
  --project=precise-victory-467219-s4 \
  --limit=5 \
  --format=json

# Check which module hung
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=scanner-service AND jsonPayload.scanId=\"$SCAN_ID\"" \
  --project=precise-victory-467219-s4 \
  --format="table(timestamp,textPayload)" \
  --limit=50 \
  --order=desc
```

### If Authentication Fails:
- Verify you're using `ryan@simplcyber.io` (not intelengine)
- Re-run the authentication setup commands above
- Check project: `gcloud config get-value project` should show `precise-victory-467219-s4`

## EPSS Migration Steps (NEW)

### Deploy EPSS Integration:
1. **Set up service account credentials**:
   ```bash
   # Ensure scanner-sa-key.json has proper credentials
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/scanner-sa-key.json
   ```

2. **Run Firestore migration**:
   ```bash
   node migrations/apply-epss-firestore.js
   ```

3. **For PostgreSQL/Supabase** (if applicable):
   ```bash
   psql -d your_database < migrations/add_epss_to_findings.sql
   ```

### Monitor EPSS Performance:
```bash
# Check for EPSS scores being fetched
gcloud logging read "textPayload:\"[epss]\"" --project=precise-victory-467219-s4 --limit=20

# Check for high-risk CVEs (EPSS > 90%)
gcloud logging read "textPayload:\"Critical EPSS\"" --project=precise-victory-467219-s4 --limit=20
```

## Where to Get API Keys

### Required API Keys (Scanner won't work without these):

1. **SHODAN_API_KEY** - https://account.shodan.io/
   - Sign up for account
   - Go to Account → API
   - Copy your API key

2. **SERPER_KEY** - https://serper.dev/
   - Sign up for free account
   - Dashboard shows API key
   - Free tier: 2,500 searches/month

3. **OPENAI_API_KEY** - https://platform.openai.com/
   - Create account
   - Go to API keys section
   - Create new secret key

4. **ABUSEIPDB_API_KEY** - https://www.abuseipdb.com/
   - Register for free account
   - Go to API tab
   - Generate API key

5. **LEAKCHECK_API_KEY** - https://leakcheck.io/api
   - Purchase API access
   - Find key in dashboard

### Optional API Keys:

7. **WHOXY_API_KEY** - https://www.whoxy.com/
   - More affordable than WhoisXML
   - $10 gets you 10,000 queries

8. **WHOISXML_API_KEY** - https://whois.whoisxmlapi.com/
   - Alternative to Whoxy
   - More expensive but reliable

## Files Changed in Today's Fix (2025-08-14)
- `apps/workers/worker-pubsub.ts` - Updated to handle CloudEvents format from Eventarc
- `scan.md` - Updated architecture documentation for Eventarc workflow
- `nextsteps.md` - Updated test procedures for new architecture
- `runfix.md` - Documentation of the Eventarc migration process

## Files Added for EPSS Integration (2025-08-08)
- `apps/workers/util/epss.ts` - NEW: EPSS fetching utility with caching
- `migrations/add_epss_to_findings.sql` - NEW: PostgreSQL migration for EPSS
- `migrations/apply-epss-firestore.js` - NEW: Firestore migration script
- `EPSS_INTEGRATION_COMPLETE.md` - NEW: Complete documentation of EPSS implementation
- **Modified**: `apps/workers/modules/lightweightCveCheck.ts` - Added EPSS fetching
- **Modified**: `apps/workers/modules/nuclei.ts` - Added EPSS fetching

## 🚨 IMMEDIATE NEXT STEPS FOR HANDOFF

### 1. Deploy Updated Tier 1 Scanner (PRIORITY)
The code has been updated with 3 new modules but needs deployment:
```bash
# The image has been built but needs deployment with force flag
gcloud run services update scanner-service \
  --image=us-central1-docker.pkg.dev/precise-victory-467219-s4/dealbrief/scanner-service:latest \
  --region=us-central1 \
  --project=precise-victory-467219-s4 \
  --force

# Verify new modules are running
curl -X POST https://scanner-service-242181373909.us-central1.run.app/tasks/scan \
  -H "Content-Type: application/json" \
  -d '{"scan_id":"verify-new-modules","domain":"example.com"}'

# Check logs for ai_path_finder, whois_wrapper, denial_wallet_scan
gcloud logging read "resource.type=cloud_run_revision AND textPayload:\"ai_path_finder\"" \
  --project=precise-victory-467219-s4 --limit=10
```

### 2. Deploy Report Generator Service (OPTIONAL)
Report generation infrastructure exists but service not deployed:
```bash
# Build and deploy report generator
cd clean-deploy
gcloud builds submit --tag us-central1-docker.pkg.dev/precise-victory-467219-s4/dealbrief/report-generator:latest
gcloud run deploy report-generator \
  --image=us-central1-docker.pkg.dev/precise-victory-467219-s4/dealbrief/report-generator:latest \
  --region=us-central1 \
  --memory=2Gi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=5 \
  --min-instances=0 \
  --service-account=scanner-worker-sa@precise-victory-467219-s4.iam.gserviceaccount.com
```

### 3. Implement Tier 2 Scanner
Complete implementation guide in `tier2next.md`. Key steps:
- Deploy scanner-tier2-service with 4Gi memory
- Create scan-tier2-jobs Pub/Sub topic
- Set up Eventarc trigger for tier 2
- Test with 12 deep-scan modules

### 4. Monitor Current Production
```bash
# Check scan completion rates
gcloud firestore documents list scans --limit=10 \
  --filter="status=completed" \
  --project=precise-victory-467219-s4

# Monitor service health
gcloud run services describe scanner-service \
  --region=us-central1 \
  --project=precise-victory-467219-s4 \
  --format="value(status.conditions[0].message)"
```

## Module Organization Summary

### Tier 1 (Currently 14, Will be 17 modules):
**Currently Deployed (14):**
- shodan, breach_directory_probe, document_exposure, endpoint_discovery
- tls_scan, spf_dmarc, config_exposure, nuclei (lightweight)
- tech_stack_scan, abuse_intel_scan, client_secret_scanner
- backend_exposure_scanner, accessibility_scan, asset_correlator

**To Be Added (3):**
- denial_wallet_scan - Cloud cost exploitation detection
- ai_path_finder - AI-powered intelligent path discovery
- whois_wrapper - RDAP + Whoxy domain registration data

### Tier 2 (12 modules - See tier2next.md):
- nuclei (intensive), dns_twist, adversarial_media_scan, censys
- trufflehog, zap_scan, web_archive_scanner, openvas_scan
- db_port_scan, email_bruteforce_surface, rate_limit_scan, rdp_vpn_templates

## Recent Changes (2025-08-15)
- Added 3 new modules to Tier 1 in worker.ts
- Created comprehensive Tier 2 implementation guide (tier2next.md)
- Verified Firestore is working and storing findings
- Identified report generator needs deployment
- Cleaned up module organization and removed deprecated modules

## Contact Info
Scanner is production-ready. Tier 1 enhanced with new modules (needs deployment). Tier 2 architecture fully planned and ready for implementation.