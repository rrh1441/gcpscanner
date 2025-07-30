# Next Steps for GCP Scanner Deployment

## Current Status ✅
- Docker image built and pushed to Artifact Registry
- Cloud Run Job created (`scanner-job`)
- **The job has already scaled to zero** - Cloud Run Jobs only run when triggered, so you're not being charged right now

## What Still Needs to Be Done

### 1. Fix Pub/Sub Integration
The worker.ts currently checks for `K_SERVICE` or `CLOUD_RUN_JOB` env vars to detect GCP mode, but Cloud Run Jobs don't set these. We need to either:
- Pass a custom env var like `RUNTIME_MODE=gcp` 
- Or just create a separate entry point for GCP

### 2. Set Up Eventarc Trigger
```bash
# Fix the Eventarc trigger to properly connect Pub/Sub to Cloud Run Job
gcloud eventarc triggers create scan-trigger \
    --destination-run-job=scanner-job \
    --destination-run-region=us-central1 \
    --location=us-central1 \
    --project=precise-victory-467219-s4 \
    --event-filters="type=google.cloud.pubsub.topic.v1.messagePublished" \
    --service-account="scanner-worker-sa@precise-victory-467219-s4.iam.gserviceaccount.com" \
    --transport-topic=scan-jobs
```

### 3. Add Secrets Properly
```bash
# Grant Secret Manager access to the service account
gcloud secrets add-iam-policy-binding shodan-api-key \
    --member="serviceAccount:scanner-worker-sa@precise-victory-467219-s4.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project=precise-victory-467219-s4

# Then update the job to include the secret
gcloud run jobs update scanner-job \
    --update-secrets="SHODAN_API_KEY=shodan-api-key:latest" \
    --region=us-central1 \
    --project=precise-victory-467219-s4
```

### 4. Test End-to-End Flow
```bash
# Publish a test message to trigger a scan
gcloud pubsub topics publish scan-jobs \
    --message='{
      "scanId": "test-123",
      "companyName": "Test Company",
      "domain": "example.com",
      "originalDomain": "example.com",
      "tags": ["test"],
      "createdAt": "2024-01-30T12:00:00Z"
    }' \
    --project=precise-victory-467219-s4
```

### 5. Connect Firestore for Results
The worker needs to write scan results to Firestore instead of PostgreSQL when running in GCP mode.

### 6. Set Up API Endpoint
Create a Cloud Run Service (not Job) for the API that:
- Receives scan requests
- Publishes to Pub/Sub topic
- Returns scan ID to track progress

## Cost Status 🟢
**You are NOT being charged right now!** Cloud Run Jobs:
- Scale to zero when not running
- Only charge when processing (per-second billing)
- No VMs running continuously
- The container image in Artifact Registry has minimal storage cost (~$0.10/GB/month)

## To Resume Tomorrow
1. Check logs from the test execution:
```bash
gcloud logging read 'resource.type="cloud_run_job" resource.labels.job_name="scanner-job"' \
    --project=precise-victory-467219-s4 --limit=50 --format=json | jq -r '.[] | .textPayload'
```

2. The main issue to fix is making the worker detect it's running in Cloud Run and use Pub/Sub instead of Redis.

## Architecture Summary
```
User Request → API (Cloud Run Service) → Pub/Sub Topic → Eventarc Trigger → Cloud Run Job → Firestore
```

No servers running 24/7. Everything scales to zero. You only pay when scans are actually running.