# GCP Scanner - Development Version

This repository contains the **GCP Cloud Run scanner** with Firestore backend. This version has known issues and is under active development.

## ⚠️ Status: DEVELOPMENT (HAS ISSUES)

This codebase is the GCP version that had hanging and persistence issues. **Use `flyscanner` repository for the working reference implementation.**

## Known Issues

### 🚨 Critical Issues
- **Module Hanging**: Some modules hang instead of timing out properly
- **Subprocess Problems**: httpx, sslscan, dig can hang on IPv6 DNS resolution  
- **Concurrent Execution**: Complex Promise handling causes scan failures
- **Firestore Persistence**: Authentication and connection issues

### ⚠️ Recent Fixes Applied
- ✅ Fixed Promise.allSettled() usage in worker.ts
- ✅ Added sequential tech detection from working Fly version
- ✅ Fixed Firestore project ID configuration  
- ✅ Added proper environment variables for IPv4-only DNS
- ⚠️ **Still needs testing and deployment**

## Architecture

- **Backend**: Google Cloud Firestore
- **Module Execution**: Parallel with timeout wrappers
- **Tech Detection**: Complex concurrent approach (problematic)
- **Infrastructure**: GCP Cloud Run with Cloud Build
- **Deployment**: Requires gcloud authentication

## Current Deployment

- **Service**: scanner-service-242181373909.us-central1.run.app
- **Status**: Scaled to zero (to avoid charges)
- **Project**: precise-victory-467219-s4
- **Region**: us-central1

## Recent Changes Made

1. **worker.ts**: Fixed Promise.allSettled() pattern
2. **techStackScan.ts**: Applied sequential detection from Fly version
3. **spfDmarc.js**: Fixed artifactStoreGCP import path
4. **Dockerfile**: Added IPv4-only environment variables

## Testing Required

The fixes need to be built and deployed to verify:

```bash
# Build (requires gcloud auth)
gcloud builds submit --config cloudbuild-scanner-service.yaml

# Deploy  
gcloud run deploy scanner-service --image=...

# Test
curl -X POST https://scanner-service-242181373909.us-central1.run.app/tasks/scan \
  -H "Content-Type: application/json" \
  -d '{"scan_id":"test","domain":"example.com"}'
```

## Working Reference

For a **working scanner implementation**, use the `flyscanner` repository:
- https://github.com/rrh1441/flyscanner
- All modules confirmed functional
- Sequential execution (no hangs)  
- PostgreSQL backend (no auth issues)

---

**Repository**: https://github.com/rrh1441/gcpscanner  
**Created**: August 20, 2025  
**Status**: Development/Testing Required