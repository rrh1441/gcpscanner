# DealBrief Scanner Workflow

## Architecture Overview

The DealBrief Scanner is now a **pure GCP-based architecture** that uses Cloud Run Jobs triggered by Pub/Sub messages. Arc and traditional pub/sub systems have been removed.

## Core Components

### 1. Message Queue System
- **GCP Pub/Sub**: Topic `scan-jobs` receives scan requests
- **Eventarc**: Triggers Cloud Run Jobs based on Pub/Sub messages
- **Cloud Run Jobs**: Executes security scans in containerized environment

### 2. Worker Architecture
- **Main Worker** (`apps/workers/worker.ts`): Core scanning logic with 17 security modules
- **Pub/Sub Adapter** (`apps/workers/worker-pubsub.ts`): Handles GCP integration and message processing
- **API Server** (`apps/api-main/server.ts`): HTTP endpoint for health checks and management

### 3. Container Environment
- **Base Image**: Node.js 22 Alpine with comprehensive security toolkit
- **Security Tools**: TruffleHog, Nuclei, Nmap, WhatWeb, SpiderFoot, OWASP ZAP, SSLScan
- **Browser Support**: Chromium for web-based scanning modules

## Workflow Process

### 1. Scan Initiation
```
API/Manual → Pub/Sub Topic (scan-jobs) → Eventarc → Cloud Run Job
```

### 2. Message Processing
1. **Pub/Sub Adapter** receives message from `scan-jobs-subscription`
2. Parses scan data: `{ scanId, companyName, domain, createdAt }`
3. Updates Firestore scan status to "processing"
4. Calls `processScan()` from main worker

### 3. Scan Execution
The main worker runs **17 security modules** in parallel groups:

#### Tier 1 Modules (All Active)
- **config_exposure**: Configuration file exposure detection
- **dns_twist**: Domain typosquatting detection
- **document_exposure**: Sensitive document discovery
- **shodan**: Internet-connected device scanning
- **breach_directory_probe**: Data breach correlation
- **endpoint_discovery**: API/endpoint enumeration
- **tech_stack_scan**: Technology stack identification
- **abuse_intel_scan**: Threat intelligence correlation
- **accessibility_scan**: Web accessibility analysis
- **nuclei**: Vulnerability template scanning
- **tls_scan**: SSL/TLS configuration analysis
- **spf_dmarc**: Email security policy validation
- **client_secret_scanner**: Exposed credential detection
- **backend_exposure_scanner**: Backend service exposure

#### Execution Strategy
1. **Parallel Independent Modules**: Run simultaneously for efficiency
2. **Endpoint Discovery First**: Provides data for dependent modules
3. **Dependent Modules**: Execute after endpoint discovery completes
4. **Asset Correlation**: Aggregates and correlates all findings

### 4. Data Storage
- **Firestore**: Scan metadata, status, and completion tracking
- **Cloud Storage**: Security artifacts and detailed findings via `insertArtifactGCP()`
- **Structured Logging**: GCP-compatible JSON logging for monitoring

### 5. Completion Flow
1. Updates Firestore with completion status and finding counts
2. Publishes message to `report-generation` topic for PDF generation
3. Scales Cloud Run Job to zero (cost optimization)

## Key Differences from Previous Architecture

### Removed Components
- **Arc**: No longer used for task queuing
- **Traditional Pub/Sub**: Replaced with GCP Pub/Sub
- **Supabase/Fly.io**: Completely migrated to GCP services

### Current GCP-Only Stack
- **Messaging**: GCP Pub/Sub + Eventarc
- **Compute**: Cloud Run Jobs (auto-scaling, pay-per-execution)  
- **Storage**: Cloud Storage + Firestore
- **Authentication**: GCP Service Accounts with least-privilege IAM
- **Monitoring**: Cloud Logging with structured JSON output

## Environment Configuration

### Required Environment Variables
- `SHODAN_API_KEY`: Shodan API key for device scanning
- `K_SERVICE` or `CLOUD_RUN_JOB`: GCP runtime detection
- `SCAN_DATA`: JSON scan parameters (set by Cloud Tasks/Eventarc)

### GCP Resources
- **Project**: `precise-victory-467219-s4`
- **Region**: `us-central1`
- **Service Account**: `scanner-worker-sa@precise-victory-467219-s4.iam.gserviceaccount.com`
- **Container Registry**: GCP Artifact Registry

## Cost Optimization
- **Zero Idle Cost**: Cloud Run Jobs scale to zero when not processing
- **Pay-per-execution**: Only charged during active scan processing
- **Parallel Processing**: Efficient resource utilization with concurrent modules
- **Containerized**: Consistent, reproducible execution environment

## Testing & Monitoring
- **Health Checks**: Express server on port 8080 for container health
- **Structured Logging**: JSON format with severity levels for GCP integration
- **Error Handling**: Graceful failure with artifact logging and Firestore updates
- **Message Acknowledgment**: Proper Pub/Sub ack/nack for reliable processing