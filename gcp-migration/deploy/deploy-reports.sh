#!/bin/bash

# Deploy Report Generator as Cloud Run Job
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-dealbrief-scanner}"
REGION="${REGION:-us-central1}"
JOB_NAME="report-generator"
IMAGE_NAME="report-generator"

echo "🚀 Deploying Report Generator as Cloud Run Job"

# Build and push container image
echo "📦 Building container image..."
cd ../report-generator

# Build image with Puppeteer
gcloud builds submit \
  --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/dealbrief-images/${IMAGE_NAME}:latest" \
  --project="$PROJECT_ID" \
  --timeout="15m"

# Deploy as Cloud Run Job
echo "📄 Creating Cloud Run Job..."
gcloud run jobs create "$JOB_NAME" \
  --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/dealbrief-images/${IMAGE_NAME}:latest" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --service-account="dealbrief-scanner-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars="PROJECT_ID=${PROJECT_ID},REGION=${REGION},GCS_REPORTS_BUCKET=dealbrief-reports" \
  --memory="2Gi" \
  --cpu="1" \
  --max-retries="2" \
  --parallelism="1" \
  --task-timeout="1800" || \
  
# If job exists, update it
gcloud run jobs replace-job "$JOB_NAME" \
  --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/dealbrief-images/${IMAGE_NAME}:latest" \
  --region="$REGION" \
  --project="$PROJECT_ID"

# Create Cloud Function to trigger report generation
echo "🔧 Creating report trigger function..."
cd ../deploy

gcloud functions deploy trigger-report-generator \
  --runtime="python39" \
  --source="function-source" \
  --entry-point="trigger_report_generator" \
  --trigger-topic="report-requests" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --service-account="dealbrief-scanner-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars="PROJECT_ID=${PROJECT_ID},REGION=${REGION}"

# Add report generation endpoint to API
echo "📋 Adding report endpoint to API..."
cat >> ../api-server/server.ts << 'EOF'

// Generate report endpoint
fastify.post('/scan/:scanId/report', async (request, reply) => {
  try {
    const { scanId } = request.params as { scanId: string };
    const { reportType = 'standard', format = 'html' } = request.body as { 
      reportType?: 'summary' | 'standard' | 'detailed';
      format?: 'html' | 'pdf' | 'both';
    };
    
    // Validate scan exists
    const scanDoc = await db.collection('scans').doc(scanId).get();
    if (!scanDoc.exists) {
      reply.status(404);
      return { error: 'Scan not found' };
    }
    
    // Publish report request to Pub/Sub
    const reportRequestTopic = pubsub.topic('report-requests');
    const requestPayload = {
      scanId,
      reportType,
      format,
      requestedAt: new Date().toISOString()
    };

    const messageBuffer = Buffer.from(JSON.stringify(requestPayload));
    await reportRequestTopic.publishMessage({ data: messageBuffer });
    
    return {
      message: 'Report generation started',
      scanId,
      reportType,
      format,
      status: 'queued'
    };

  } catch (error) {
    reply.status(500);
    return { error: 'Failed to generate report' };
  }
});

// Get report status and download URLs
fastify.get('/reports/:reportId', async (request, reply) => {
  try {
    const { reportId } = request.params as { reportId: string };
    
    const reportDoc = await db.collection('reports').doc(reportId).get();
    if (!reportDoc.exists) {
      reply.status(404);
      return { error: 'Report not found' };
    }

    return reportDoc.data();
  } catch (error) {
    reply.status(500);
    return { error: 'Failed to retrieve report' };
  }
});
EOF

echo "✅ Report Generator deployed successfully!"
echo "📊 Reports will be generated on-demand and stored in GCS"
echo "📋 New API endpoints:"
echo "  POST /scan/{scanId}/report - Generate report"
echo "  GET /reports/{reportId} - Get report URLs"