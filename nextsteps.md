# GCP Scanner Testing Guide

## Migration Status ✅
- ✅ **Fly.io/Redis Infrastructure PURGED**: All Fly.io and Upstash/Redis code removed
- ✅ **Server.ts Rewritten**: Pure GCP Pub/Sub + Firestore implementation
- ✅ **Docker Configuration**: Updated to run worker-pubsub.ts (Pub/Sub listener)
- ✅ **Core Services**: GCP Pub/Sub, Firestore, Cloud Storage, Cloud Run
- ✅ **Queue System**: Pub/Sub → worker-pubsub.ts → worker.ts pipeline
- ✅ **TypeScript Build**: All compilation errors fixed, ready for deployment
- ✅ **Production Features**: Rate limiting, DLQ, monitoring alerts implemented

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

### 0. Pre-Deployment Setup

#### Install Dependencies and Build
```bash
# Install all dependencies
pnpm install

# Verify the build succeeds locally
pnpm build

# Run the build with proper ignore scripts
pnpm approve-builds # If prompted about ignored build scripts
```

#### Set Up Dead Letter Queue (Required for Production)
```bash
# Configure DLQ for failed messages
tsx apps/workers/setup-dlq.ts

# This creates:
# - scan-jobs-dlq topic
# - scan-jobs-dlq-subscription
# - Updates main subscription with 5 retry attempts
# - Sets 7-day retention for failed messages
```

### 1. Deploy Updated Container
```bash
# Build and push the updated container (now runs worker-pubsub.ts)
gcloud builds submit --tag us-central1-docker.pkg.dev/precise-victory-467219-s4/dealbrief/scanner-worker:latest \
    --project=precise-victory-467219-s4

# Update the Cloud Run Job with new image
gcloud run jobs update scanner-job \
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

### 3. Deploy Services

#### Deploy Scanner Service (Worker)
Deploy as Cloud Run Service to run continuous Pub/Sub listener:

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

Start here
# Check service status
gcloud run services describe scanner-service \
    --region=us-central1 \
    --project=precise-victory-467219-s4
```

#### Deploy API Service
```bash
# Build API container
gcloud builds submit \
    --project=precise-victory-467219-s4 \
    --config=cloudbuild-api.yaml

# Deploy API service
gcloud run deploy scanner-api \
    --image=us-central1-docker.pkg.dev/precise-victory-467219-s4/dealbrief/scanner-api:latest \
    --region=us-central1 \
    --project=precise-victory-467219-s4 \
    --service-account=scanner-worker-sa@precise-victory-467219-s4.iam.gserviceaccount.com \
    --memory=1Gi \
    --cpu=1 \
    --set-env-vars=RUNTIME_MODE=gcp \
    --min-instances=1 \
    --max-instances=10 \
    --allow-unauthenticated

# Get API URL
gcloud run services describe scanner-api \
    --region=us-central1 \
    --project=precise-victory-467219-s4 \
    --format='value(status.url)'
```

#### Create Cloud Build Configuration for API
```bash
cat > cloudbuild-api.yaml << 'EOF'
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/dealbrief/scanner-api:latest', 
           '-f', 'Dockerfile.api', '.']
images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/dealbrief/scanner-api:latest'
EOF

cat > Dockerfile.api << 'EOF'
FROM node:22-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api-main/package.json ./apps/api-main/
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm --filter @dealbrief/api-main build
EXPOSE 3000
CMD ["node", "apps/api-main/dist/server.js"]
EOF
```

### 4. Configure Pub/Sub Subscription

```bash
# Update subscription ack deadline for long-running scans
gcloud pubsub subscriptions update scan-jobs-subscription \
    --ack-deadline=600 \
    --project=precise-victory-467219-s4

# Verify DLQ configuration
gcloud pubsub subscriptions describe scan-jobs-subscription \
    --project=precise-victory-467219-s4 \
    --format=json | jq '.deadLetterPolicy'
```

### 5. Test the Complete System

#### Test API Health Check
```bash
# Get API URL
API_URL=$(gcloud run services describe scanner-api \
    --region=us-central1 \
    --project=precise-victory-467219-s4 \
    --format='value(status.url)')

# Test health endpoint
curl $API_URL/health

# Expected response:
# {
#   "status": "healthy",
#   "pubsub": "connected",
#   "firestore": "connected",
#   "timestamp": "2024-..."
# }
```

#### Test Scan Creation via API
```bash
# Create a scan through the API
curl -X POST $API_URL/scan \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Company via API",
    "domain": "example.com",
    "tags": ["api-test"]
  }'

# Save the scanId from the response for monitoring
```

#### Test Direct Pub/Sub → Scanner Pipeline
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

### 6. Monitor & Debug

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

## 7. Production Deployment

### Deploy Monitoring Function
```bash
# Deploy the failed scan monitor as a Cloud Function
gcloud functions deploy monitor-failed-scans \
  --gen2 \
  --runtime=nodejs22 \
  --region=us-central1 \
  --source=apps/workers \
  --entry-point=monitorScans \
  --trigger-schedule="*/15 * * * *" \
  --set-env-vars="ALERT_WEBHOOK_URL=YOUR_WEBHOOK_URL" \
  --service-account=scanner-worker-sa@precise-victory-467219-s4.iam.gserviceaccount.com \
  --project=precise-victory-467219-s4

# Test the monitoring function
gcloud functions call monitor-failed-scans \
  --region=us-central1 \
  --project=precise-victory-467219-s4
```

### Set Up Cloud Monitoring Alerts
```bash
# Create alert policy for high failure rate
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Scanner High Failure Rate" \
  --condition='{"displayName":"Failed scans > 10%","conditionThreshold":{"filter":"resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/failed_scans\"","comparison":"COMPARISON_GT","thresholdValue":0.1,"duration":"300s"}}' \
  --project=precise-victory-467219-s4

# Create alert for DLQ messages
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Scanner DLQ Has Messages" \
  --condition='{"displayName":"DLQ messages > 0","conditionThreshold":{"filter":"resource.type=\"pubsub_subscription\" AND resource.labels.subscription_id=\"scan-jobs-dlq-subscription\" AND metric.type=\"pubsub.googleapis.com/subscription/num_undelivered_messages\"","comparison":"COMPARISON_GT","thresholdValue":0,"duration":"60s"}}' \
  --project=precise-victory-467219-s4
```

### Configure Log Exports
```bash
# Export logs to BigQuery for analysis
gcloud logging sinks create scanner-logs-bq \
  bigquery.googleapis.com/projects/precise-victory-467219-s4/datasets/scanner_logs \
  --log-filter='resource.type="cloud_run_revision" AND (resource.labels.service_name="scanner-service" OR resource.labels.service_name="scanner-api")' \
  --project=precise-victory-467219-s4
```

## 8. Performance Testing

### Load Test the API
```bash
# Install hey (HTTP load generator)
go install github.com/rakyll/hey@latest

# Test API rate limits (should hit rate limit after 10 requests/minute)
hey -n 20 -c 1 -m POST \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Load Test","domain":"example.com"}' \
  $API_URL/scan

# Test concurrent scans
hey -n 5 -c 5 -m POST \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Concurrent Test","domain":"example.com"}' \
  $API_URL/scan
```

### Monitor Resource Usage
```bash
# Watch CPU and memory usage during scans
watch -n 5 'gcloud run services describe scanner-service \
  --region=us-central1 \
  --project=precise-victory-467219-s4 \
  --format="table(status.conditions.lastTransitionTime,spec.template.spec.containers[0].resources)"'
```

## 9. Cleanup Failed Tests

### Clear DLQ Messages
```bash
# Pull and acknowledge DLQ messages to clear them
gcloud pubsub subscriptions pull scan-jobs-dlq-subscription \
  --project=precise-victory-467219-s4 \
  --auto-ack \
  --limit=100
```

### Delete Test Scans from Firestore
```bash
# List test scans
gcloud firestore documents list scans \
  --project=precise-victory-467219-s4 \
  --filter='tags:test' \
  --limit=10

# Delete specific test scan
gcloud firestore documents delete scans/TEST_SCAN_ID \
  --project=precise-victory-467219-s4
```

## Architecture Verified ✅
```
API Service → Pub/Sub Topic → Scanner Service (Pub/Sub Listener) → Firestore + Cloud Storage
     ↓                                      ↓
Rate Limiting                         Dead Letter Queue
     ↓                                      ↓
Health Check                        Monitoring Function
```

All components auto-scale based on load and include production-ready monitoring.

## 🎯 DEPLOYMENT COMPLETE - SYSTEM OPERATIONAL ✅

### **Deployed Services Status:**
- **Scanner Service**: `https://scanner-service-242181373909.us-central1.run.app` ✅ RUNNING
- **API Service**: `https://scanner-api-242181373909.us-central1.run.app` ✅ RUNNING
- **Pub/Sub Topic**: `scan-jobs` ✅ ACTIVE
- **Firestore Database**: ✅ READY
- **Cloud Storage**: Artifacts bucket ✅ READY

### **How to Trigger Scans:**

#### **Method 1: Direct Pub/Sub (Recommended for Testing)**
```bash
# Send scan job directly to Pub/Sub queue
gcloud pubsub topics publish scan-jobs \
    --message='{
      "scanId": "test-'$(date +%s)'",
      "companyName": "Your Company Name",
      "domain": "target-domain.com",
      "originalDomain": "target-domain.com",
      "tags": ["manual-test"],
      "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }' \
    --project=precise-victory-467219-s4
```

#### **Method 2: API Service (Requires Auth)**
The API service is deployed but requires authentication. To use it:

**Fix API Authentication (one-time setup):**
```bash
# Option A: Allow public access (if org policy permits)
gcloud run services update scanner-api \
    --region=us-central1 \
    --project=precise-victory-467219-s4 \
    --allow-unauthenticated

# Option B: Use authenticated requests
curl -X POST https://scanner-api-242181373909.us-central1.run.app/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "companyName": "Test Company",
    "domain": "example.com",
    "tags": ["api-test"]
  }'
```

**Alternative API Auth Fix (if org policy blocks public access):**
```bash
# Create a service account for API access
gcloud iam service-accounts create api-client-sa \
    --project=precise-victory-467219-s4

# Grant invoker role to service account
gcloud run services add-iam-policy-binding scanner-api \
    --region=us-central1 \
    --member="serviceAccount:api-client-sa@precise-victory-467219-s4.iam.gserviceaccount.com" \
    --role="roles/run.invoker" \
    --project=precise-victory-467219-s4

# Use service account token for API calls
gcloud auth activate-service-account api-client-sa@precise-victory-467219-s4.iam.gserviceaccount.com \
    --key-file=path/to/service-account-key.json

curl -X POST https://scanner-api-242181373909.us-central1.run.app/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{"companyName": "Test", "domain": "example.com"}'
```

### **Monitor Scan Execution:**

#### **Check Scanner Service Logs:**
```bash
# View recent scanner processing logs
gcloud logging read 'resource.type="cloud_run_revision" resource.labels.service_name="scanner-service"' \
    --project=precise-victory-467219-s4 \
    --limit=20 \
    --format='value(timestamp,textPayload,jsonPayload.message)'
```

#### **Monitor Scan Progress:**
```bash
# Watch for scan completion messages
gcloud logging tail 'resource.type="cloud_run_revision" resource.labels.service_name="scanner-service"' \
    --project=precise-victory-467219-s4 \
    --filter='textPayload:("completed:" OR "Endpoint discovery completed" OR "Asset correlation completed")'
```

#### **Check Firestore Scan Records:**
```bash
# List recent scans (requires alpha components)
gcloud components install alpha --quiet
gcloud alpha firestore documents list scans \
    --project=precise-victory-467219-s4 \
    --limit=5
```

### **Service Management:**

#### **Scale Services:**
```bash
# Scale scanner service
gcloud run services update scanner-service \
    --region=us-central1 \
    --project=precise-victory-467219-s4 \
    --min-instances=2 \
    --max-instances=5

# Scale API service  
gcloud run services update scanner-api \
    --region=us-central1 \
    --project=precise-victory-467219-s4 \
    --min-instances=0 \
    --max-instances=20
```

#### **Update Services:**
```bash
# Rebuild and update scanner worker
gcloud builds submit --tag us-central1-docker.pkg.dev/precise-victory-467219-s4/dealbrief/scanner-worker:latest \
    --project=precise-victory-467219-s4

gcloud run jobs update scanner-job \
    --image=us-central1-docker.pkg.dev/precise-victory-467219-s4/dealbrief/scanner-worker:latest \
    --region=us-central1 \
    --project=precise-victory-467219-s4

# Rebuild and update API service
gcloud builds submit \
    --project=precise-victory-467219-s4 \
    --config=cloudbuild-api.yaml

gcloud run deploy scanner-api \
    --image=us-central1-docker.pkg.dev/precise-victory-467219-s4/dealbrief/scanner-api:latest \
    --region=us-central1 \
    --project=precise-victory-467219-s4
```

### **Troubleshooting:**

#### **Common Issues:**
1. **"User not authorized"**: Service account needs `roles/pubsub.subscriber` role
2. **"403 Forbidden" on API**: Need to configure authentication (see auth fixes above)
3. **Scanner not processing**: Check Pub/Sub subscription exists and has proper permissions
4. **Module failures**: Check that all required API keys are stored in Secret Manager

#### **Debug Commands:**
```bash
# Check service health
gcloud run services describe scanner-service \
    --region=us-central1 \
    --project=precise-victory-467219-s4

# View error logs
gcloud logging read 'resource.type="cloud_run_revision" severity>=ERROR' \
    --project=precise-victory-467219-s4 \
    --limit=10

# Test Pub/Sub connectivity
gcloud pubsub topics list --project=precise-victory-467219-s4
gcloud pubsub subscriptions list --project=precise-victory-467219-s4
```

## 🚀 **System Ready for Production Scanning**

The GCP migration is complete. Use Method 1 (Direct Pub/Sub) for immediate scan testing, or configure API authentication using the solutions above for programmatic access.