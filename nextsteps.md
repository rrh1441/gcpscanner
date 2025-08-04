# 🚀 URGENT: Frontend-Backend Testing Guide

## Your Vercel Frontend is LIVE!
**URL**: https://frontend-i3lzo2d4d-simpleapps.vercel.app

## Complete Workflow Test Checklist

### 1. 🔍 **Frontend Access Test**
- [ ] Open https://frontend-i3lzo2d4d-simpleapps.vercel.app
- [ ] Verify the page loads without errors
- [ ] Check browser console for any JavaScript errors

### 2. 🎯 **Single Scan Creation Test**
- [ ] Enter Company Name: "Test Company" 
- [ ] Enter Domain: "example.com"
- [ ] Click "Start Scan" button
- [ ] **VERIFY**: You get a scan ID in response (like `abc123xyz`)
- [ ] **VERIFY**: No CORS errors in browser console
- [ ] **VERIFY**: Network tab shows successful API call to `/api/proxy/scans`

### 3. 📊 **Scan Status Monitoring**
- [ ] Use the scan ID from step 2
- [ ] Check scan status (should start as "queued")
- [ ] Wait 30-60 seconds and check again
- [ ] **VERIFY**: Status progresses: `queued` → `running` → `completed`

### 4. 🔄 **Backend Health Verification**
Before frontend testing, verify your GCP backend is running:
```bash
curl https://scanner-api-242181373909.us-central1.run.app/health
```
**Expected Response**:
```json
{
  "status": "healthy",
  "pubsub": "connected", 
  "firestore": "connected",
  "timestamp": "2024-..."
}
```

### 5. 📤 **Bulk Upload Test**
- [ ] Navigate to `/upload` page on your Vercel frontend
- [ ] Create a test CSV file:
  ```csv
  Company,Domain
  Test Company 1,example.com
  Test Company 2,httpbin.org
  ```
- [ ] Upload the CSV file
- [ ] **VERIFY**: Multiple scan IDs are returned
- [ ] **VERIFY**: All scans appear in the system

### 6. 🔧 **API Proxy Verification**
Open Browser DevTools → Network tab during scan creation:
- [ ] **VERIFY**: Frontend calls `/api/proxy/scans` (not direct GCP URL)
- [ ] **VERIFY**: Proxy route returns 200 status
- [ ] **VERIFY**: Response contains scan ID and status
- [ ] **VERIFY**: No authentication errors

### 7. 🚨 **Error Handling Test**
- [ ] Try creating scan with invalid domain (e.g., "invalid")
- [ ] **VERIFY**: Frontend shows appropriate error message
- [ ] Try accessing non-existent scan ID
- [ ] **VERIFY**: Returns "Scan not found" error

### 8. 📱 **Cross-Browser Test**
Test in at least 2 browsers:
- [ ] Chrome/Edge
- [ ] Firefox/Safari
- [ ] **VERIFY**: Consistent behavior across browsers

## Debug Commands

### Check GCP Backend Logs
```bash
# Monitor API calls reaching your backend
gcloud logging tail 'resource.type="cloud_run_revision" resource.labels.service_name="scanner-api"' \
    --project=precise-victory-467219-s4
```

### Verify Firestore Records
```bash
# Check if scans are being stored
gcloud firestore documents list scans --project=precise-victory-467219-s4 --limit=5
```

### Test Direct Backend Call
```bash
# Bypass frontend and test backend directly
curl -X POST https://scanner-api-242181373909.us-central1.run.app/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "companyName": "Direct Backend Test",
    "domain": "example.com",
    "tags": ["backend-test"]
  }'
```

## Expected Success Indicators ✅

### Frontend Success:
- ✅ No CORS errors in browser console
- ✅ API calls go through `/api/proxy/` routes
- ✅ Scan creation returns valid scan ID
- ✅ Status checks return proper scan state
- ✅ File uploads process multiple scans

### Backend Integration Success:
- ✅ Frontend proxy authenticates to GCP successfully
- ✅ Scans appear in Firestore database
- ✅ Pub/Sub messages are published (triggers worker)
- ✅ GCP scanner service processes scans
- ✅ Scan statuses update from queued → running → completed

## 🚨 Common Issues & Fixes

### CORS Errors
- Backend already configured for `*.vercel.app` domains
- If errors persist, check domain spelling in backend CORS config

### Authentication Failures  
- Frontend uses server-side proxy with Google Auth
- Check that `GOOGLE_APPLICATION_CREDENTIALS` is accessible in Vercel

### API Timeout Errors
- Default timeout is 60s in `vercel.json`
- For long-running operations, this should be sufficient

### Scan Status Stuck on "Queued"
- Check GCP scanner service is running: 
  ```bash
  gcloud run services describe scanner-service --region=us-central1 --project=precise-victory-467219-s4
  ```

## 🎯 Success Criteria

**Complete success means**:
1. ✅ Frontend loads and accepts scan requests
2. ✅ Scans are created in Firestore via API
3. ✅ GCP scanner processes the scans
4. ✅ Scan status updates are visible
5. ✅ No CORS or authentication errors
6. ✅ Both single and bulk scans work

**Once all tests pass, your migration is complete!** 🎉

Your Vercel frontend will auto-deploy on every GitHub push, while your GCP backend handles all the heavy security scanning work.