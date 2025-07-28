#!/bin/bash

# Setup Pub/Sub infrastructure for DealBrief Scanner
set -e

PROJECT_ID="precise-victory-467219-s4"
REGION="us-west1"

echo "Setting up Pub/Sub infrastructure..."

# Create scan-jobs topic if it doesn't exist
if ! gcloud pubsub topics describe scan-jobs --project=$PROJECT_ID >/dev/null 2>&1; then
    echo "Creating scan-jobs topic..."
    gcloud pubsub topics create scan-jobs --project=$PROJECT_ID
else
    echo "scan-jobs topic already exists"
fi

# Create scan-jobs subscription
if ! gcloud pubsub subscriptions describe scan-jobs-subscription --project=$PROJECT_ID >/dev/null 2>&1; then
    echo "Creating scan-jobs subscription..."
    gcloud pubsub subscriptions create scan-jobs-subscription \
        --topic=scan-jobs \
        --ack-deadline=600 \
        --message-retention-duration=7d \
        --project=$PROJECT_ID
else
    echo "scan-jobs-subscription already exists"
fi

# Create report-generation topic if it doesn't exist
if ! gcloud pubsub topics describe report-generation --project=$PROJECT_ID >/dev/null 2>&1; then
    echo "Creating report-generation topic..."
    gcloud pubsub topics create report-generation --project=$PROJECT_ID
else
    echo "report-generation topic already exists"
fi

# Create report-generation subscription
if ! gcloud pubsub subscriptions describe report-generation-subscription --project=$PROJECT_ID >/dev/null 2>&1; then
    echo "Creating report-generation subscription..."
    gcloud pubsub subscriptions create report-generation-subscription \
        --topic=report-generation \
        --ack-deadline=600 \
        --message-retention-duration=7d \
        --project=$PROJECT_ID
else
    echo "report-generation-subscription already exists"
fi

# Create GCS bucket for reports with unique timestamp
BUCKET_NAME="dealbrief-reports-$(date +%s)"
echo "Creating GCS bucket: $BUCKET_NAME"

if ! gsutil ls gs://$BUCKET_NAME >/dev/null 2>&1; then
    gsutil mb -l $REGION gs://$BUCKET_NAME
    gsutil lifecycle set - gs://$BUCKET_NAME <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF
    echo "Created bucket: gs://$BUCKET_NAME"
    echo "BUCKET_NAME=$BUCKET_NAME" > /tmp/bucket-name.env
else
    echo "Bucket already exists: gs://$BUCKET_NAME"
fi

echo "Pub/Sub and GCS infrastructure setup complete!"
echo "Next steps:"
echo "1. Update scanner-worker with the bucket name"
echo "2. Deploy scanner-worker"
echo "3. Deploy report-generator"