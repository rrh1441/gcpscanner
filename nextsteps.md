# GCP Scanner Testing Guide

## Migration Status ✅
- ✅ **Fly.io/Redis Infrastructure PURGED**: All Fly.io and Upstash/Redis code removed
- ✅ **Server.ts Rewritten**: Pure GCP Pub/Sub + Firestore implementation
- ✅ **Docker Configuration**: Updated to run worker-pubsub.ts (Pub/Sub listener)
- ✅ **Core Services**: GCP Pub/Sub, Firestore, Cloud Storage, Cloud Run Jobs
- ✅ **Queue System**: Pub/Sub → worker-pubsub.ts → worker.ts pipeline

## Module Execution Architecture 🔄

The scanner uses a **three-phase execution model** to handle module dependencies:

### Phase 1: Independent Parallel Modules
These run simultaneously since they don't depend on other modules:
- `breach_directory_probe` - Data breach correlation
- `shodan` - Internet device scanning  
- `dns_twist` - Domain typosquatting detection
- `document_exposure` - Sensitive document discovery
- `tls_scan` - SSL/TLS configuration analysis
- `spf_dmarc` - Email security policy validation
- `config_exposure` - Configuration file exposure

### Phase 2: Endpoint Discovery (Blocking)
- `endpoint_discovery` - **Must complete first** as it provides data for dependent modules

### Phase 3: Dependent Modules (Parallel)
These modules run after endpoint discovery provides necessary data:
- `nuclei` - Uses discovered endpoints for vulnerability scanning
- `tech_stack_scan` - Analyzes discovered endpoints for technology identification
- `abuse_intel_scan` - Correlates findings with threat intelligence
- `client_secret_scanner` - Scans discovered assets for exposed credentials
- `backend_exposure_scanner` - Analyzes backend services found in endpoint discovery
- `accessibility_scan` - Tests discovered web interfaces

### Phase 4: Final Correlation
- `asset_correlator` - Runs after all modules to correlate and enrich findings

## Current Architecture Flow
```
Pub/Sub Message → Cloud Run Job (worker-pubsub.ts) → processScan() → Firestore + Cloud Storage
```

## Testing Strategy

### 1. Deploy Updated Container
```bash
# Build and push the updated container (now runs worker-pubsub.ts)
gcloud builds submit --tag us-central1-docker.pkg.dev/precise-victory-467219-s4/dealbrief/scanner-worker:latest \
    --project=precise-victory-467219-s4

# Update the Cloud Run Job with new image
gcloud run jobs replace-image scanner-job \
    --image=us-central1-docker.pkg.dev/precise-victory-467219-s4/dealbrief/scanner-worker:latest \
    --region=us-central1 \
    --project=precise-victory-467219-s4
```

### 2. Environment Verification
```bash
# Verify Pub/Sub topic and subscription exist
gcloud pubsub topics describe scan-jobs \
    --project=precise-victory-467219-s4
    
gcloud pubsub subscriptions describe scan-jobs-subscription \
    --project=precise-victory-467219-s4

# Check Cloud Run Job configuration
gcloud run jobs describe scanner-job \
    --region=us-central1 \
    --project=precise-victory-467219-s4

# Verify secrets are accessible
gcloud secrets versions list shodan-api-key \
    --project=precise-victory-467219-s4
```

### 3. Deploy as Cloud Run Service (Long-Running Pub/Sub Listener)

**ARCHITECTURE CHANGE**: Deploy as Cloud Run Service to run continuous Pub/Sub listener:

```bash
# Deploy worker-pubsub.ts as a Cloud Run Service that listens continuously
gcloud run deploy scanner-service \
    --image=us-central1-docker.pkg.dev/precise-victory-467219-s4/dealbrief/scanner-worker:latest \
    --region=us-central1 \
    --project=precise-victory-467219-s4 \
    --service-account=scanner-worker-sa@precise-victory-467219-s4.iam.gserviceaccount.com \
    --memory=4Gi \
    --cpu=2 \
    --port=8080 \
    --set-env-vars=RUNTIME_MODE=gcp \
    --set-secrets=SHODAN_API_KEY=shodan-api-key:latest,OPENAI_API_KEY=openai-api-key:latest,ABUSEIPDB_API_KEY=abuseipdb-api-key:latest,CAPTCHA_API_KEY=captcha-api-key:latest,CENSYS_PAT=censys-api-token:latest,LEAKCHECK_API_KEY=leakcheck-api-key:latest,SERPER_KEY=serper-key:latest,WHOXY_API_KEY=whoxy-api-key:latest \
    --min-instances=1 \
    --max-instances=3 \
    --allow-unauthenticated

# Check service status
gcloud run services describe scanner-service \
    --region=us-central1 \
    --project=precise-victory-467219-s4
```

### 4. Test Pub/Sub → Scanner Pipeline

#### Basic Connectivity Test
```bash
# Test simple scan job via Pub/Sub
gcloud pubsub topics publish scan-jobs \
    --message='{
      "scanId": "test-'$(date +%s)'",
      "companyName": "Test Company",
      "domain": "httpbin.org",
      "originalDomain": "httpbin.org",
      "tags": ["test"],
      "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }' \
    --project=precise-victory-467219-s4

# Monitor Cloud Run Service logs (not job logs!)
gcloud logging tail 'resource.type="cloud_run_revision" resource.labels.service_name="scanner-service"' \
    --project=precise-victory-467219-s4
```

#### Module Execution Phases Test
```bash
# Test with a domain that will trigger all modules
gcloud pubsub topics publish scan-jobs \
    --message='{
      "scanId": "full-test-'$(date +%s)'",
      "companyName": "Full Module Test",
      "domain": "example.com",
      "originalDomain": "example.com",
      "tags": ["test", "all-modules"],
      "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }' \
    --project=precise-victory-467219-s4

# Monitor execution phases
gcloud logging tail 'resource.type="cloud_run_revision"' \
    --project=precise-victory-467219-s4 --filter='textPayload:("Endpoint discovery completed" OR "Asset correlation completed" OR "completed:")'
```

#### Firestore Verification
```bash
# Check if scan records are being created in Firestore
gcloud firestore documents list scans --project=precise-victory-467219-s4 --limit=5

# Check specific scan status
SCAN_ID="test-12345"  # Replace with actual scan ID from above
gcloud firestore documents describe scans/${SCAN_ID} --project=precise-victory-467219-s4
```

### 5. Monitor & Debug

#### Service Health Check
```bash
# Check if Cloud Run Service is healthy
gcloud run services describe scanner-service \
    --region=us-central1 \
    --project=precise-victory-467219-s4 \
    --format='value(status.conditions[0].status,status.conditions[0].message)'

# Monitor service logs for errors
gcloud logging read 'resource.type="cloud_run_revision" resource.labels.service_name="scanner-service" severity>=ERROR' \
    --project=precise-victory-467219-s4 --limit=10
```

#### Module Execution Monitoring
```bash
# Monitor execution phases to verify dependency handling
gcloud logging tail 'resource.type="cloud_run_revision" resource.labels.service_name="scanner-service"' \
    --project=precise-victory-467219-s4 --filter='textPayload:("completed:" OR "Endpoint discovery completed" OR "Asset correlation completed")'

# Check for module-specific errors
gcloud logging read 'resource.type="cloud_run_revision" resource.labels.service_name="scanner-service" severity>=ERROR' \
    --project=precise-victory-467219-s4 --limit=20 --format=json | \
    jq -r '.[] | select(.textPayload | contains("failed")) | .textPayload'
```

#### Data Flow Validation  
```bash
# Verify artifacts are being stored in Cloud Storage
gsutil ls -la gs://dealbrief-scanner-artifacts/scans/ | head -20

# Check scan status progression in Firestore
gcloud firestore documents list scans --project=precise-victory-467219-s4 --limit=5 --format='value(name,data.status,data.updated_at)'

# Validate report generation messages
gcloud logging read 'resource.type="cloud_run_revision"' \
    --project=precise-victory-467219-s4 --filter='textPayload:"report-generation"' --limit=5
```

## Expected Test Outcomes

### Module Execution Success Indicators
- ✅ **Phase 1 Parallel Execution**: Independent modules start simultaneously (within 5-10 seconds)
- ✅ **Endpoint Discovery Blocking**: Phase 3 modules wait for endpoint discovery completion
- ✅ **Dependency Timing**: No dependent module starts before endpoint discovery finishes
- ✅ **Asset Correlation**: Runs last after all other modules complete
- ✅ **Parallel Efficiency**: Phase 1 modules complete in overlapping timeframes

### System Success Indicators  
- ✅ Job starts within 10-30 seconds of Pub/Sub message publish
- ✅ All 17 security modules execute without critical errors
- ✅ Firestore status updates: processing → completed
- ✅ Artifacts stored in Cloud Storage with proper structure
- ✅ Report generation message published successfully
- ✅ Job completes and scales to zero (cost optimization)
- ✅ Memory/CPU usage within configured limits

### Module Dependency Issues to Watch For
- 🚨 **Broken Dependencies**: Phase 3 modules starting before endpoint discovery
- 🚨 **Infinite Waiting**: Dependent modules blocked indefinitely
- 🚨 **Race Conditions**: Asset correlator running before module completion
- 🚨 **Resource Starvation**: Too many parallel modules causing memory issues
- 🚨 **Timeout Cascades**: One slow module blocking all dependent modules

### Infrastructure Issues to Monitor
- 🔍 **Secret Access**: SHODAN_API_KEY not accessible to security modules
- 🔍 **Network Issues**: Firewall blocking external security tool requests
- 🔍 **Module Timeouts**: Individual modules exceeding execution limits
- 🔍 **Memory Pressure**: Scanner hitting container memory constraints during parallel execution
- 🔍 **Storage Permissions**: Unable to write artifacts to Cloud Storage
- 🔍 **Pub/Sub Delays**: Message delivery or acknowledgment issues

## Cost Status 🟢
**Current Cost**: Near zero - only pay for:
- Container image storage (~$0.10/month)
- Pub/Sub messages (~$0.0001 per test)
- Cloud Run execution time (seconds of usage)
- Cloud Storage for results

## Architecture Verified ✅
```
API/Manual → Pub/Sub Topic → Eventarc → Cloud Run Job → Cloud Storage
                                                      → Firestore (future)
```
All components scale to zero when idle.