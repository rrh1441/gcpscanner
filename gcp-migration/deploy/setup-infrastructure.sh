#!/bin/bash

# GCP Infrastructure Setup for DealBrief Scanner
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-dealbrief-scanner}"
REGION="${REGION:-us-central1}"
SERVICE_ACCOUNT="dealbrief-scanner-sa"

echo "🚀 Setting up GCP infrastructure for DealBrief Scanner"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Enable required APIs
echo "📡 Enabling required GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  pubsub.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project="$PROJECT_ID"

# Create service account
echo "👤 Creating service account..."
gcloud iam service-accounts create "$SERVICE_ACCOUNT" \
  --display-name="DealBrief Scanner Service Account" \
  --project="$PROJECT_ID" || true

# Grant necessary permissions
echo "🔐 Granting IAM permissions..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/pubsub.editor"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.invoker"

# Initialize Firestore
echo "🗄️ Initializing Firestore..."
gcloud firestore databases create \
  --location="$REGION" \
  --project="$PROJECT_ID" || echo "Firestore already exists"

# Create Pub/Sub topics and subscriptions
echo "📬 Creating Pub/Sub resources..."
gcloud pubsub topics create scan-jobs --project="$PROJECT_ID" || true
gcloud pubsub topics create report-requests --project="$PROJECT_ID" || true

gcloud pubsub subscriptions create scan-jobs-sub \
  --topic=scan-jobs \
  --project="$PROJECT_ID" || true

gcloud pubsub subscriptions create report-requests-sub \
  --topic=report-requests \
  --project="$PROJECT_ID" || true

# Create GCS buckets
echo "🪣 Creating Cloud Storage buckets..."
gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://dealbrief-artifacts" || true
gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://dealbrief-reports" || true

# Set bucket permissions
gsutil iam ch "serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com:roles/storage.admin" \
  "gs://dealbrief-artifacts"
gsutil iam ch "serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com:roles/storage.admin" \
  "gs://dealbrief-reports"

# Create Artifact Registry repository
echo "📦 Creating Artifact Registry repository..."
gcloud artifacts repositories create dealbrief-images \
  --repository-format=docker \
  --location="$REGION" \
  --project="$PROJECT_ID" || true

# Store API keys in Secret Manager
echo "🔐 Setting up Secret Manager..."
echo "Please set your API keys manually:"
echo "gcloud secrets create shodan-api-key --data-file=- --project=$PROJECT_ID"
echo "gcloud secrets create openai-api-key --data-file=- --project=$PROJECT_ID"

# Create Cloud Function trigger for Pub/Sub
echo "⚙️ Creating Cloud Function trigger..."
cat > function-source/main.py << EOF
import json
import os
from google.cloud import run_v2

def trigger_scan_worker(cloud_event):
    """Triggered by Pub/Sub message to start scan worker"""
    
    # Parse Pub/Sub message
    message_data = json.loads(cloud_event.data['message']['data'])
    
    # Create Cloud Run Job execution
    client = run_v2.JobsClient()
    
    job_name = f"projects/{os.environ['PROJECT_ID']}/locations/{os.environ['REGION']}/jobs/scanner-worker"
    
    execution = run_v2.Execution()
    execution.spec.template.spec.template.spec.containers[0].env = [
        {"name": "JOB_DATA", "value": json.dumps(message_data)}
    ]
    
    operation = client.run_job(name=job_name, execution=execution)
    print(f"Started job execution: {operation.name}")

def trigger_report_generator(cloud_event):
    """Triggered by Pub/Sub message to generate report"""
    
    # Parse Pub/Sub message  
    message_data = json.loads(cloud_event.data['message']['data'])
    
    # Create Cloud Run Job execution for report generation
    client = run_v2.JobsClient()
    
    job_name = f"projects/{os.environ['PROJECT_ID']}/locations/{os.environ['REGION']}/jobs/report-generator"
    
    execution = run_v2.Execution()
    execution.spec.template.spec.template.spec.containers[0].env = [
        {"name": "REPORT_REQUEST", "value": json.dumps(message_data)}
    ]
    
    operation = client.run_job(name=job_name, execution=execution)
    print(f"Started report generation: {operation.name}")
EOF

mkdir -p function-source
echo "google-cloud-run==1.12.0" > function-source/requirements.txt

echo "✅ Infrastructure setup completed!"
echo ""
echo "Next steps:"
echo "1. Deploy the API server: ./deploy-api.sh"
echo "2. Deploy the scanner worker: ./deploy-worker.sh" 
echo "3. Deploy the report generator: ./deploy-reports.sh"
echo "4. Set up API keys in Secret Manager"