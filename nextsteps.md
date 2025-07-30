# Next Steps for GCP Scanner Testing

## Migration Status ✅
- ✅ **Fly.io/Supabase Infrastructure Removed**: All worker files migrated to GCP
- ✅ **Docker Configuration**: Clean GCP-only Dockerfile 
- ✅ **Core Services**: Using GCP Pub/Sub, Cloud Storage, Artifact Registry
- ✅ **Remaining References**: Only legitimate security scanning patterns (detecting exposed Supabase/Fly endpoints)

## Ready for Full Scan Testing

### 1. Verify Environment Setup
```bash
# Check current job configuration
gcloud run jobs describe scanner-job \
    --region=us-central1 \
    --project=precise-victory-467219-s4

# Ensure secrets are accessible
gcloud secrets versions list shodan-api-key \
    --project=precise-victory-467219-s4
```

### 2. Set Up Pub/Sub Trigger (If Not Done)
```bash
# Create or update the Eventarc trigger
gcloud eventarc triggers create scan-trigger \
    --destination-run-job=scanner-job \
    --destination-run-region=us-central1 \
    --location=us-central1 \
    --project=precise-victory-467219-s4 \
    --event-filters="type=google.cloud.pubsub.topic.v1.messagePublished" \
    --service-account="scanner-worker-sa@precise-victory-467219-s4.iam.gserviceaccount.com" \
    --transport-topic=scan-jobs
```

### 3. Test Complete Scan Flow
```bash
# Test with a simple domain first
gcloud pubsub topics publish scan-jobs \
    --message='{
      "scanId": "test-simple-' $(date +%s)'",
      "companyName": "Test Company",
      "domain": "httpbin.org",
      "originalDomain": "httpbin.org",
      "tags": ["test", "simple"],
      "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }' \
    --project=precise-victory-467219-s4

# Test with a more complex domain
gcloud pubsub topics publish scan-jobs \
    --message='{
      "scanId": "test-complex-' $(date +%s)'",
      "companyName": "Example Corp",
      "domain": "example.com",
      "originalDomain": "example.com", 
      "tags": ["test", "full"],
      "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }' \
    --project=precise-victory-467219-s4
```

### 4. Monitor Test Results
```bash
# Watch job execution logs in real-time
gcloud logging tail 'resource.type="cloud_run_job" resource.labels.job_name="scanner-job"' \
    --project=precise-victory-467219-s4

# Check for errors specifically
gcloud logging read 'resource.type="cloud_run_job" resource.labels.job_name="scanner-job" severity>=ERROR' \
    --project=precise-victory-467219-s4 --limit=20 --format=json
```

### 5. Validate Scan Results
```bash
# Check if results are being stored in Cloud Storage
gsutil ls gs://dealbrief-scanner-artifacts/scans/

# Look for job completion logs
gcloud logging read 'resource.type="cloud_run_job" textPayload:"Scan completed"' \
    --project=precise-victory-467219-s4 --limit=10
```

### 6. Performance Testing
```bash
# Test concurrent scans
for i in {1..3}; do
  gcloud pubsub topics publish scan-jobs \
    --message='{
      "scanId": "concurrent-test-'$i'-'$(date +%s)'",
      "companyName": "Concurrent Test '$i'",
      "domain": "httpbin.org",
      "originalDomain": "httpbin.org",
      "tags": ["performance", "concurrent"],
      "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }' \
    --project=precise-victory-467219-s4 &
done
wait
```

## Expected Test Outcomes

### Success Indicators
- ✅ Job starts within 10-30 seconds of message publish
- ✅ All scan modules execute without errors
- ✅ Results stored in Cloud Storage
- ✅ Job completes and scales to zero
- ✅ Memory/CPU usage within limits

### Common Issues to Watch For
- 🔍 **Secret Access**: SHODAN_API_KEY not accessible
- 🔍 **Network Issues**: Firewall blocking external requests
- 🔍 **Timeout Issues**: Job exceeding task timeout
- 🔍 **Memory Limits**: Scanner hitting memory constraints
- 🔍 **Storage Permissions**: Unable to write to Cloud Storage

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