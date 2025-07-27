# DealBrief Scanner - GCP Migration

Complete migration from Fly.io to Google Cloud Platform with native services.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Cloud Run     │    │   Pub/Sub    │    │ Cloud Run Jobs  │
│   (API Server)  │───▶│  (Queue)     │───▶│ (Scan Workers)  │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                       │                    │
         ▼                       ▼                    ▼
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Firestore     │    │ Cloud Storage│    │ Cloud Run Jobs  │
│   (Database)    │    │ (Artifacts)  │    │ (Report Gen)    │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Infrastructure Setup
```bash
cd deploy/
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# Setup GCP resources
chmod +x setup-infrastructure.sh
./setup-infrastructure.sh
```

### 2. Deploy Services
```bash
# Deploy API server
./deploy-api.sh

# Deploy scanner workers
./deploy-worker.sh

# Deploy report generator
./deploy-reports.sh
```

### 3. Configure Secrets
```bash
# Set API keys in Secret Manager
echo "your-shodan-key" | gcloud secrets create shodan-api-key --data-file=-
echo "your-openai-key" | gcloud secrets create openai-api-key --data-file=-
```

## 🗄️ Data Model

### Firestore Collections

#### `scans/{scanId}`
```javascript
{
  scan_id: "abc123",
  company_name: "Example Corp", 
  domain: "example.com",
  status: "completed", // queued, processing, completed, failed
  progress: 100,
  created_at: timestamp,
  completed_at: timestamp,
  total_findings: 25,
  max_severity: "CRITICAL"
}
```

#### `scans/{scanId}/findings/{findingId}`
```javascript
{
  finding_type: "exposed_api_key",
  description: "API key found in JavaScript",
  recommendation: "Remove or rotate the exposed API key",
  severity: "HIGH",
  eal_estimate: 75000, // Expected Annual Loss
  attack_type_code: "SITE_HACK",
  src_url: "https://example.com/app.js",
  created_at: timestamp
}
```

#### `reports/{reportId}`
```javascript
{
  report_id: "def456",
  scan_id: "abc123", 
  report_type: "detailed", // summary, standard, detailed
  format: "both", // html, pdf, both
  html_url: "signed-gcs-url",
  pdf_url: "signed-gcs-url",
  generated_at: timestamp,
  expires_at: timestamp
}
```

## 💰 Cost Attribution

Expected Annual Loss (EAL) is calculated deterministically for each finding:

```javascript
EAL = BaseCost × SeverityMultiplier × IndustryMultiplier × ExposureMultiplier
```

### Multipliers:
- **Severity**: Critical (2.5x), High (1.8x), Medium (1.0x), Low (0.4x)
- **Industry**: Healthcare (2.1x), Financial (2.5x), Tech (1.9x), Default (1.5x) 
- **Exposure**: Public (1.5x), Authenticated (1.2x), Internal (0.8x)

### Attack Categories:
- **SITE_HACK**: SQL injection, XSS, exposed credentials
- **PHISHING_BEC**: Email spoofing, SPF/DMARC issues
- **MALWARE**: Malware detection, trojans
- **ADA_COMPLIANCE**: Accessibility violations
- **DENIAL_OF_WALLET**: DDoS vulnerabilities, rate limiting

## 📊 API Endpoints

### Scan Management
```bash
# Create scan
POST /scan
{
  "companyName": "Example Corp",
  "domain": "example.com",
  "tags": ["client", "high-priority"]
}

# Get scan status
GET /scan/{scanId}/status

# Get findings
GET /scan/{scanId}/findings

# Bulk scan
POST /scan/bulk
{
  "companies": [
    {"companyName": "Corp A", "domain": "corp-a.com"},
    {"companyName": "Corp B", "domain": "corp-b.com"}
  ]
}
```

### Report Generation
```bash
# Generate report
POST /scan/{scanId}/report
{
  "reportType": "detailed", // summary, standard, detailed
  "format": "both"         // html, pdf, both
}

# Get report
GET /reports/{reportId}
```

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- Docker
- GCP CLI (`gcloud`)
- Firebase CLI

### Setup
```bash
# Clone and install dependencies
cd api-server/
npm install

cd ../scanner-worker/
npm install

cd ../report-generator/
npm install

# Set up local env
cp .env.example .env
# Edit .env with your API keys
```

### Run Locally
```bash
# Start Firestore emulator
firebase emulators:start --only firestore

# Run API server
cd api-server/
npm run dev

# Test scan
curl -X POST http://localhost:8080/scan \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Test Corp", "domain": "test.com"}'
```

## 🔍 Monitoring

### Logs
```bash
# API server logs
gcloud run services logs read dealbrief-api --region=us-central1

# Worker job logs
gcloud run jobs logs read scanner-worker --region=us-central1

# Report generator logs  
gcloud run jobs logs read report-generator --region=us-central1
```

### Metrics
- **Scan Throughput**: Scans completed per hour
- **Worker Utilization**: Job execution time vs queue time
- **Error Rate**: Failed scans / total scans
- **Cost Per Scan**: GCP costs allocated per scan

## 🛡️ Security

### IAM Roles
- **API Service Account**: Firestore user, Pub/Sub editor, Secret Manager accessor
- **Worker Service Account**: Same + Cloud Storage admin
- **Report Service Account**: Same + signed URL generation

### Network Security
- All services use private Google networks
- No external IPs on workers
- VPC-native networking for isolation

## 🚦 Scaling

### Auto-scaling Configuration
- **API Server**: 0-10 instances, CPU-based scaling
- **Scanner Workers**: On-demand via Pub/Sub triggers
- **Report Generator**: On-demand execution

### Performance Limits
- **API**: 100 concurrent requests per instance
- **Workers**: 1 scan per job, 3600s timeout
- **Reports**: 2GB memory for PDF generation

## 📈 Migration Benefits

### Eliminated Complexity
- ❌ Fly Machines API management
- ❌ Postgres → Supabase sync worker
- ❌ Manual worker scaling logic
- ❌ Queue depth monitoring

### Added Capabilities  
- ✅ Scale-to-zero workers
- ✅ Unified Firestore database
- ✅ Automatic cost attribution
- ✅ Signed URL report delivery
- ✅ Native GCP monitoring

### Cost Optimization
- Workers only run during scans (vs always-on)
- No double database storage/sync costs
- Predictable per-scan pricing
- Built-in GCP cost allocation tags

## 🔄 Migration Checklist

### Pre-Migration
- [ ] Export existing scan data from Fly Postgres
- [ ] Backup Supabase data
- [ ] Test worker modules with Firestore adapter
- [ ] Validate cost calculations against historical data

### Migration
- [ ] Deploy GCP infrastructure
- [ ] Migrate API keys to Secret Manager
- [ ] Import historical scan data to Firestore
- [ ] Update frontend to use new API endpoints
- [ ] Switch DNS from Fly.io to Cloud Run

### Post-Migration
- [ ] Monitor worker performance and costs
- [ ] Validate report generation quality
- [ ] Archive old Fly.io infrastructure
- [ ] Update documentation and runbooks

---

**🎯 Result**: Fully GCP-native architecture with simplified operations, scale-to-zero workers, unified data storage, and deterministic cost attribution for security findings.**