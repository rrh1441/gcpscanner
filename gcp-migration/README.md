# DealBrief Scanner - GCP Migration

Complete end-to-end scan pipeline deployment for Google Cloud Platform.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   API Server    │    │   Pub/Sub    │    │ Scanner Worker  │
│   (Cloud Run)   │───▶│  scan-jobs   │───▶│  (Cloud Run)    │
└─────────────────┘    └──────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│ Report Generator│◀───│   Pub/Sub    │    │   Firestore     │
│   (Cloud Run)   │    │report-generation   │  (Findings)     │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  GCS Bucket     │
│   (Reports)     │
└─────────────────┘
```

## Quick Start

### Prerequisites

1. **GCP Project Setup**
   ```bash
   gcloud config set account ryan@simplcyber.io
   gcloud config set project precise-victory-467219-s4
   gcloud services enable run.googleapis.com pubsub.googleapis.com firestore.googleapis.com storage-api.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
   ```

2. **API Keys in Secret Manager** (verify they exist)

### Deployment Steps

1. **Setup Infrastructure**
   ```bash
   cd gcp-migration/deploy
   ./setup-pubsub.sh
   ```

2. **Deploy Services**
   ```bash
   ./deploy-worker.sh
   ./deploy-reports.sh
   ```

3. **Test Pipeline**
   ```bash
   cd ../test
   ./test-workflow.sh complete
   ```

## Components

- **Scanner Worker**: Processes scans via Pub/Sub, stores findings in Firestore
- **Report Generator**: Creates HTML/PDF reports, stores in GCS
- **Infrastructure**: Pub/Sub topics, Firestore collections, GCS buckets

## Usage

Trigger scan via existing API or Pub/Sub:
```bash
gcloud pubsub topics publish scan-jobs --message='{"scanId":"test-123","domain":"example.com","companyName":"Test Corp"}'
```

Monitor with:
```bash
gcloud logs tail /projects/precise-victory-467219-s4/logs/run.googleapis.com%2Fstdout
```

See full documentation in individual component directories.