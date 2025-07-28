#!/bin/bash

# Deploy Scanner Worker as Cloud Run Service (listens to Pub/Sub)
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-precise-victory-467219-s4}"
REGION="${REGION:-us-west1}"
SERVICE_NAME="scanner-worker"
IMAGE_NAME="scanner-worker"
SERVICE_ACCOUNT="dealbrief-scanner-sa@precise-victory-467219-s4.iam.gserviceaccount.com"

echo "🚀 Deploying Scanner Worker as Cloud Run Service"

# Change to scanner-worker directory
cd "$(dirname "$0")/../scanner-worker"

# Build and push container image
echo "📦 Building container image..."
gcloud builds submit \
  --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/dealbrief-images/${IMAGE_NAME}:latest" \
  --project="$PROJECT_ID" \
  --timeout="20m"

# Deploy as Cloud Run Service (not job, since it listens continuously)
echo "⚙️ Deploying Cloud Run Service..."
gcloud run deploy "$SERVICE_NAME" \
  --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/dealbrief-images/${IMAGE_NAME}:latest" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --service-account="$SERVICE_ACCOUNT" \
  --set-env-vars="PROJECT_ID=${PROJECT_ID},REGION=${REGION},GCS_ARTIFACTS_BUCKET=dealbrief-artifacts" \
  --set-secrets="SHODAN_API_KEY=shodan-api-key:latest,OPENAI_API_KEY=openai-api-key:latest,CENSYS_API_ID=censys-api-id:latest,CENSYS_API_SECRET=censys-api-secret:latest,BREACHDIRECTORY_API_KEY=breachdirectory-api-key:latest,SPIDERFOOT_API_KEY=spiderfoot-api-key:latest,ABUSEIPDB_API_KEY=abuseipdb-api-key:latest" \
  --memory="4Gi" \
  --cpu="2" \
  --timeout="3600" \
  --concurrency="1" \
  --min-instances="1" \
  --max-instances="5" \
  --no-allow-unauthenticated

echo "✅ Scanner Worker deployed successfully!"

# Get the deployed service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format='value(status.url)' --project="$PROJECT_ID")
echo "📋 Service URL: $SERVICE_URL"

echo ""
echo "Next steps:"
echo "1. Test with: gcloud pubsub topics publish scan-jobs --message='{\"scanId\":\"test-123\",\"domain\":\"example.com\",\"companyName\":\"Test Corp\"}' --project=$PROJECT_ID"
echo "2. Monitor logs: gcloud logs tail /projects/${PROJECT_ID}/logs/run.googleapis.com%2Fstdout"
echo "3. Deploy report generator"