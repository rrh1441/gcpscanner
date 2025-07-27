#!/bin/bash

# Deploy Scanner Worker as Cloud Run Job
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-dealbrief-scanner}"
REGION="${REGION:-us-central1}"
JOB_NAME="scanner-worker"
IMAGE_NAME="scanner-worker"

echo "🚀 Deploying Scanner Worker as Cloud Run Job"

# Build and push container image
echo "📦 Building container image..."
cd ../scanner-worker

# Build image with security tools
gcloud builds submit \
  --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/dealbrief-images/${IMAGE_NAME}:latest" \
  --project="$PROJECT_ID" \
  --timeout="20m"

# Deploy as Cloud Run Job
echo "⚙️ Creating Cloud Run Job..."
gcloud run jobs create "$JOB_NAME" \
  --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/dealbrief-images/${IMAGE_NAME}:latest" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --service-account="dealbrief-scanner-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars="PROJECT_ID=${PROJECT_ID},REGION=${REGION},GCS_ARTIFACTS_BUCKET=dealbrief-artifacts" \
  --set-secrets="SHODAN_API_KEY=shodan-api-key:latest,OPENAI_API_KEY=openai-api-key:latest" \
  --memory="4Gi" \
  --cpu="2" \
  --max-retries="3" \
  --parallelism="1" \
  --task-timeout="3600" || \
  
# If job exists, update it
gcloud run jobs replace-job "$JOB_NAME" \
  --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/dealbrief-images/${IMAGE_NAME}:latest" \
  --region="$REGION" \
  --project="$PROJECT_ID"

# Create Cloud Function to trigger worker from Pub/Sub
echo "🔧 Creating Pub/Sub trigger function..."
cd ../deploy

gcloud functions deploy trigger-scan-worker \
  --runtime="python39" \
  --source="function-source" \
  --entry-point="trigger_scan_worker" \
  --trigger-topic="scan-jobs" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --service-account="dealbrief-scanner-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars="PROJECT_ID=${PROJECT_ID},REGION=${REGION}"

echo "✅ Scanner Worker deployed successfully!"
echo "🎯 Worker will be triggered by Pub/Sub messages on 'scan-jobs' topic"