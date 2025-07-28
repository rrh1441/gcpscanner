#!/bin/bash

# Deploy Report Generator as Cloud Run Service (listens to Pub/Sub)
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-precise-victory-467219-s4}"
REGION="${REGION:-us-west1}"
SERVICE_NAME="report-generator"
IMAGE_NAME="report-generator"
SERVICE_ACCOUNT="dealbrief-scanner-sa@precise-victory-467219-s4.iam.gserviceaccount.com"

echo "🚀 Deploying Report Generator as Cloud Run Service"

# Change to report-generator directory
cd "$(dirname "$0")/../report-generator"

# Build and push container image
echo "📦 Building container image..."
gcloud builds submit \
  --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/dealbrief-images/${IMAGE_NAME}:latest" \
  --project="$PROJECT_ID" \
  --timeout="15m"

# Deploy as Cloud Run Service (not job, since it listens continuously)
echo "📄 Deploying Cloud Run Service..."
gcloud run deploy "$SERVICE_NAME" \
  --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/dealbrief-images/${IMAGE_NAME}:latest" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --service-account="$SERVICE_ACCOUNT" \
  --set-env-vars="PROJECT_ID=${PROJECT_ID},REGION=${REGION},GCS_REPORTS_BUCKET=dealbrief-reports" \
  --memory="2Gi" \
  --cpu="1" \
  --timeout="1800" \
  --concurrency="1" \
  --min-instances="0" \
  --max-instances="3" \
  --no-allow-unauthenticated

echo "✅ Report Generator deployed successfully!"

# Get the deployed service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format='value(status.url)' --project="$PROJECT_ID")
echo "📋 Service URL: $SERVICE_URL"

echo ""
echo "📊 Reports will be automatically generated when scans complete"
echo "📋 Reports will be stored in GCS bucket: dealbrief-reports"
echo ""
echo "Next steps:"
echo "1. Verify both services are running"
echo "2. Test the complete pipeline"
echo "3. Add monitoring and alerting"