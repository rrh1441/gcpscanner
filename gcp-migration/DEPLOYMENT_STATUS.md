# 🚨 DealBrief Scanner GCP Deployment - CRITICAL RECOVERY STATUS

## ❌ **SYSTEM FAILURE: COMPLETE REBUILD REQUIRED**

**Current Status**: ❌ **COMPLETELY BROKEN**  
**Service URLs**: 
- Scanner Worker: https://scanner-worker-242181373909.us-west1.run.app (BROKEN)
- Report Generator: https://report-generator-242181373909.us-west1.run.app (UNREACHABLE)

**Assessment**: **CRITICAL BUT SALVAGEABLE** - Architecture is sound, implementation needs systematic fixes

---

## 🔥 **CURRENT FAILURE STATE**

### ❌ **BROKEN COMPONENTS**
1. **❌ Scanner Worker**: Cannot process any Pub/Sub messages (JSON parsing errors, Firestore undefined values)
2. **❌ Report Generator**: Never receives jobs due to scanner failures
3. **❌ Deployment Pipeline**: Builds consistently hang/timeout (5-8 minutes)
4. **❌ End-to-End Flow**: 0% success rate - complete pipeline failure
5. **❌ Message Processing**: Pub/Sub queue polluted with failed messages

### ✅ **WORKING INFRASTRUCTURE**
1. **✅ GCP Services**: Pub/Sub, Firestore, Cloud Run, GCS all healthy
2. **✅ Authentication**: Service accounts and API keys working
3. **✅ Network/Routing**: HTTP endpoints respond to health checks
4. **✅ Architecture Choice**: Event-driven pipeline design is excellent for scaling

---

## 🛠️ **PHASED RECOVERY PLAN FOR NEW AGENT**

### **PHASE 1: STOP THE BLEEDING & ESTABLISH STABLE STATE**

**Goal**: Halt cascading failures and prevent further cost/data pollution

1. **🚨 IMMEDIATE: Halt All Cloud Run Services**
   ```bash
   # Stop scanner worker to prevent failed message processing
   gcloud run services update scanner-worker --region=us-west1 --project=precise-victory-467219-s4 --min-instances=0 --max-instances=0
   
   # Stop report generator 
   gcloud run services update report-generator --region=us-west1 --project=precise-victory-467219-s4 --min-instances=0 --max-instances=0
   ```

2. **🧹 PURGE PUB/SUB QUEUE**
   ```bash
   # Clear all failed messages from subscription
   gcloud pubsub subscriptions seek scan-jobs-subscription --time=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ") --project=precise-victory-467219-s4
   ```

3. **🛡️ IMPLEMENT DEAD-LETTER QUEUE (DLQ)**
   ```bash
   # Create DLQ topic and configure main subscription to use it
   gcloud pubsub topics create scan-jobs-dlq --project=precise-victory-467219-s4
   
   # Update subscription with DLQ configuration
   gcloud pubsub subscriptions update scan-jobs-subscription \
     --dead-letter-topic=scan-jobs-dlq \
     --max-delivery-attempts=5 \
     --project=precise-victory-467219-s4
   ```

### **PHASE 2: FORTIFY SCANNER WORKER CODE**

**Goal**: Address root causes of worker crashes

1. **🔧 FIX PUB/SUB MESSAGE PARSING** (`scanner-worker/worker.ts`)
   - **Problem**: Malformed messages crash entire worker
   - **Solution**: Wrap `JSON.parse` in try/catch, log raw message, nack() failures to DLQ

2. **🔧 FIX FIRESTORE WRITES** (`scanner-worker/worker.ts`)
   - **Problem**: Crashes on `undefined` values like `src_url`
   - **Solution**: Validate data before Firestore writes, ensure undefined → null
   ```typescript
   // Example fix before writing findings
   const findingData = {
     src_url: finding.srcUrl || null, // Ensure undefined becomes null
     artifact_id: finding.artifactId || null,
     // ... other fields
   };
   ```

3. **🔧 CORRECT FIRESTORE DOCUMENT UPDATES**
   - **Problem**: Tries to update non-existent documents
   - **Solution**: Use `set()` with `{ merge: true }` for upsert behavior

### **PHASE 3: REPAIR DEPLOYMENT PIPELINE**

**Goal**: Make deployments fast and reliable

1. **🐳 OPTIMIZE DOCKERFILE** (`scanner-worker/Dockerfile`)
   - **Problem**: Build hangs on `nuclei -update-templates`
   - **Solution**: Remove network-dependent commands, use versioned template downloads

2. **⚙️ REFINE DEPLOYMENT SCRIPT** (`deploy/deploy-worker.sh`)
   - **Problem**: `--min-instances=1` complicates deployments
   - **Solution**: Change to `--min-instances=0` for better scaling and deployment resilience

### **PHASE 4: RE-DEPLOY AND VERIFY**

**Goal**: Validate fixes work end-to-end

1. **🚀 DEPLOY FIXES**
   ```bash
   cd /Users/ryanheger/dealbrief-scanner/gcp-migration
   ./deploy/deploy-all.sh
   ```

2. **🧪 TEST INCREMENTALLY**
   ```bash
   # Test single message
   gcloud pubsub topics publish scan-jobs --message='{"scanId":"recovery-test-001","domain":"httpbin.org","companyName":"Recovery Test"}' --project=precise-victory-467219-s4
   
   # Monitor logs
   gcloud beta logging tail 'resource.labels.service_name="scanner-worker"' --project=precise-victory-467219-s4
   
   # Verify Firestore data
   # Check GCS for reports
   gcloud storage ls gs://dealbrief-reports-1753717766/reports/
   ```

3. **✅ FULL END-TO-END TEST**
   ```bash
   cd test && ./test-workflow.sh complete
   ```

---

## 🔧 **CRITICAL CONTEXT FOR NEW AGENT**

### **Project Details**
- **Project ID**: `precise-victory-467219-s4`
- **Region**: `us-west1`
- **Account**: `ryan@simplcyber.io`
- **Service Account**: `dealbrief-scanner-sa@precise-victory-467219-s4.iam.gserviceaccount.com`

### **Key Infrastructure**
- **Pub/Sub Topics**: `scan-jobs`, `report-generation`
- **Subscriptions**: `scan-jobs-subscription`, `report-generation-subscription`
- **GCS Buckets**: `gs://dealbrief-artifacts/`, `gs://dealbrief-reports-1753717766/`
- **Scanner Worker**: https://scanner-worker-242181373909.us-west1.run.app

### **API Keys in Secret Manager**
- ✅ `shodan-api-key` 
- ✅ `openai-api-key`
- ✅ `censys-api-token` (Value: EwnhsqDC)

### **ROOT CAUSE ANALYSIS**

**Critical Failures Identified:**
1. **JSON Parsing Error**: `handleScanMessage()` crashes on malformed Pub/Sub data
2. **Firestore Undefined Values**: `src_url: undefined` rejected by Firestore validation
3. **Document Update Failures**: Trying to update non-existent Firestore documents
4. **Deployment Pipeline Issues**: Docker builds hanging on `nuclei -update-templates`
5. **Message Queue Pollution**: Failed messages redelivered indefinitely without DLQ

**Assessment**: These are **implementation bugs**, not architectural flaws. The GCP service selection (Cloud Run + Pub/Sub + Firestore) is excellent for this use case.

### **WHAT STILL WORKS (Infrastructure Layer)**
- ✅ **GCP Services**: All infrastructure services healthy and responding
- ✅ **Authentication**: Service accounts, API keys, IAM permissions working
- ✅ **Networking**: HTTP endpoints, service discovery, Cloud Run routing working  
- ✅ **Storage**: GCS buckets accessible, Firestore database operational
- ✅ **EAL Financial Methodology**: Research-backed calculations are sound
- ✅ **Container Images**: Built and stored in Artifact Registry

### **WHAT'S BROKEN (Application Layer)**
- ❌ **Message Processing**: Scanner cannot parse Pub/Sub messages
- ❌ **Data Persistence**: Firestore writes fail on undefined values
- ❌ **Error Handling**: No resilience for malformed data or network issues
- ❌ **Deployment Process**: Builds timeout, revisions don't update properly
- ❌ **End-to-End Flow**: Complete pipeline failure (0% success rate)

---

## 📊 **File Structure**

```
gcp-migration/
├── deploy/
│   ├── setup-pubsub.sh          # ✅ COMPLETED
│   ├── deploy-worker.sh          # ✅ COMPLETED  
│   ├── deploy-reports.sh         # ⏳ READY TO RUN
│   └── deploy-all.sh             # Master script
├── scanner-worker/               # ✅ DEPLOYED
│   ├── worker.ts                 # Main scanner logic
│   ├── package.json              # Fixed dependencies
│   ├── Dockerfile                # Working container
│   └── dist/worker.js            # Compiled output
├── report-generator/             # ⏳ READY TO DEPLOY
│   ├── generator.ts              # Report generation logic
│   ├── package.json              # Dependencies
│   └── Dockerfile                # Container config
├── test/
│   └── test-workflow.sh          # ⏳ READY TO TEST
└── README.md                     # Documentation
```

---

## 🎯 **RECOVERY SUCCESS METRICS**

**Recovery Goals:**
- ✅ **Phase 1**: Services halted, queues purged, DLQ implemented
- ✅ **Phase 2**: Scanner worker code fortified against crashes
- ✅ **Phase 3**: Deployment pipeline optimized for reliability
- ✅ **Phase 4**: End-to-end testing validates complete functionality

**Expected Results After Recovery:**
- Scan findings stored at: `scans/{scanId}/findings/` without undefined values
- Reports generated at: `gs://dealbrief-reports-1753717766/` 
- 100% success rate for valid messages
- Failed messages isolated in DLQ for debugging
- Fast, reliable deployments (< 2 minutes)

---

## 🚨 **CRITICAL GUIDANCE FOR NEW AGENT**

### **AUTHENTICATION & ENVIRONMENT**
```bash
# Always authenticate first
gcloud config set account ryan@simplcyber.io

# Set working directory
cd /Users/ryanheger/dealbrief-scanner/gcp-migration
```

### **MONITORING COMMANDS**
```bash
# Monitor logs during recovery
gcloud beta logging tail 'resource.labels.service_name="scanner-worker"' --project=precise-victory-467219-s4

# Check service status
gcloud run services list --region=us-west1 --project=precise-victory-467219-s4

# Check message queues
gcloud pubsub subscriptions list --project=precise-victory-467219-s4
```

### **RECOVERY APPROACH**
1. **DO NOT attempt to fix the running system** - it will fail
2. **Follow the phased approach exactly** - each phase builds on the previous
3. **Test incrementally** - single message → small batch → full test
4. **Document all issues** in DEPLOYMENT_ISSUES.md as you find them

---

## ⚡ **CONCLUSION: MIGRATION IS SALVAGEABLE**

**The GCP architecture is EXCELLENT** - Cloud Run + Pub/Sub + Firestore is the right choice for scaling.

**The issues are fixable implementation bugs**, not fundamental design flaws. With systematic fixes, this will be a robust, production-ready system that scales far better than the previous Fly.io deployment.

**Do NOT revert to Fly.io** - push through these fixes to achieve a superior long-term solution.