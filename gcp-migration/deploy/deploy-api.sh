#!/bin/bash

# Deploy API Server to Cloud Run
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-precise-victory-467219-s4}"
REGION="${REGION:-us-west1}"
SERVICE_NAME="dealbrief-api"
IMAGE_NAME="dealbrief-api"

echo "🚀 Deploying API Server to Cloud Run"

# Build and push container image
echo "📦 Building container image..."
cd ../api-server

# Build image
gcloud builds submit \
  --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/dealbrief-images/${IMAGE_NAME}:latest" \
  --project="$PROJECT_ID"

# Deploy to Cloud Run
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/dealbrief-images/${IMAGE_NAME}:latest" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --service-account="dealbrief-scanner-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars="PROJECT_ID=${PROJECT_ID},REGION=${REGION}" \
  --memory="1Gi" \
  --cpu="1" \
  --concurrency="100" \
  --max-instances="10" \
  --allow-unauthenticated \
  --port="8080"

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(status.url)")

echo "✅ API Server deployed successfully!"
echo "📍 Service URL: $SERVICE_URL"
echo ""
echo "Test with:"
echo "curl $SERVICE_URL/health"