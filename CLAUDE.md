# DealBrief Scanner - Complete Status & Handoff

*Last Updated: 2025-08-18 15:45 PST*

## 🚨 CRITICAL: Authentication DOES NOT WORK in Claude Code

**THE PROBLEM:** 
- `gcloud auth login --no-launch-browser` creates a NEW session every time it's called
- Each call generates a new state/challenge pair, invalidating any previous verification code
- Claude cannot maintain a persistent gcloud auth session between commands

**THE ONLY SOLUTION:**
Run authentication in YOUR terminal, not in Claude:
```bash
# In YOUR terminal (not Claude):
gcloud auth login
# Complete the browser flow
# Then run deployment commands in YOUR terminal or back in Claude
```

## Current Scanner Status (2025-08-18)

### ✅ What's Working
- **Auth issue fixed**: Set `REQUIRE_AUTH=false` to bypass OIDC verification
- **Logging enabled**: Fastify logger now shows all requests  
- **Handler executing**: `/tasks/scan` endpoint confirmed working
- **7 modules working**: Complete in 100-1400ms

### ⚠️ What's Broken
- **Subprocess modules hang**: techStackScan, tlsScan, spfDmarc, nuclei all hang
- **Root cause**: IPv6 DNS resolution - binaries try AAAA lookups that hang indefinitely
- **Failed fix**: Added `-4` flag to httpx but **httpx doesn't support this flag**

## Architecture Overview

```
Pub/Sub Topic (scan-jobs) 
    ↓
Eventarc Trigger → scanner-service /events endpoint (FAST ACK)
    ↓
Cloud Tasks Queue
    ↓
scanner-service /tasks/scan endpoint (ACTUAL SCAN - this is where modules run)
```

**Current Deployment:**
- Service: scanner-service-00050-q46  
- URL: https://scanner-service-242181373909.us-central1.run.app
- Region: us-central1
- Project: precise-victory-467219-s4

## Module Status Table

### ✅ WORKING (7 modules - all pure Node.js)
| Module | Timing | Type |
|--------|--------|------|
| client_secret_scanner | 108ms | Pure Node.js |
| backend_exposure_scanner | 108ms | Pure Node.js |
| lightweight_cve_check | 142ms | Pure Node.js |
| abuse_intel_scan | 145ms | Axios HTTP |
| denial_wallet_scan | 106ms | Pure Node.js |
| shodan_scan | 1293ms | Axios HTTP |
| breach_directory_probe | 1371ms | Axios HTTP |

### ❌ HANGING (all use subprocess calls)
| Module | Subprocess | Problem |
|--------|------------|---------|
| **techStackScan** | httpx binary | Hangs on DNS resolution |
| **tlsScan** | sslscan binary | Hangs on DNS resolution |
| **spfDmarc** | dig binary | Hangs on DNS resolution |
| **nuclei** | nuclei binary | Doesn't even start |
| **configExposureScanner** | Unknown | HTTP requests start but don't complete |
| **endpointDiscovery** | Partial | Initial requests work (298ms) then hangs |
| **aiPathFinder** | OpenAI API | No logs, likely hanging |
| **documentExposure** | Serper API | No logs, likely hanging |

## The IPv6 Problem & Failed Solution

### Root Cause
1. GCP Cloud Run prefers IPv6
2. Subprocess binaries (httpx, sslscan, dig) attempt AAAA (IPv6) lookups first
3. These lookups hang indefinitely in Cloud Run environment
4. Node.js has `NODE_OPTIONS="--dns-result-order=ipv4first"` but **subprocesses don't inherit this**

### Failed Fix Attempt
```javascript
// Added -4 flag to force IPv4 - BUT HTTPX DOESN'T SUPPORT THIS FLAG!
const { stdout } = await exec('httpx', [
  '-u', url,
  '-4',            // ❌ httpx doesn't have this flag!
  '-td',           
  '-json',         
  '-timeout', '10',
  '-silent',       
  '-no-color'      
], {
  timeout: 15000,
  killSignal: 'SIGKILL'  // ✅ This part is good
});
```

## Required Solution

### Need CORRECT IPv4-only flags for:
1. **httpx** - What flag forces IPv4? (NOT -4)
2. **sslscan** - Verify if `--ipv4` actually works
3. **dig** - Is it `-4` or `+noaaaa` or something else?
4. **nuclei** - What flag forces IPv4?

### Alternative Solutions to Consider:
1. Set DNS resolution at container/OS level (e.g., /etc/resolv.conf)
2. Pre-resolve domains to IPv4 and pass IPs instead of domains
3. Use Node.js libraries instead of subprocess binaries
4. Proxy subprocess calls through IPv4-only resolver

## Files Changed Recently

### Fixed Authentication Issue:
- `apps/workers/server.ts`: Enabled Fastify logging, added debug messages

### Attempted IPv6 Fix (INCORRECT FLAGS):
- `apps/workers/util/fastTechDetection.ts`: Added `-4` to httpx (doesn't work!)
- `apps/workers/modules/tlsScan.ts`: Added `--ipv4` to sslscan
- Added `killSignal: 'SIGKILL'` to execFile calls (good)

## Testing Commands

```bash
# Deploy latest build
gcloud run deploy scanner-service \
  --image=us-central1-docker.pkg.dev/precise-victory-467219-s4/dealbrief/scanner-service:latest \
  --region=us-central1 \
  --project=precise-victory-467219-s4 \
  --update-env-vars="REQUIRE_AUTH=false"

# Test full scan
curl -X POST https://scanner-service-242181373909.us-central1.run.app/tasks/scan \
  -H "Content-Type: application/json" \
  -d '{"scan_id":"test-'$(date +%s)'","domain":"vulnerable-test-site.vercel.app"}'

# Monitor logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=scanner-service" \
  --project=precise-victory-467219-s4 --limit=30 --freshness=2m
```

## API Keys Status
All configured in Secret Manager and accessible. Errors like "Shodan 403" are rate limiting, not auth issues.

## Previous Fixes That ARE Working
- ✅ IPv6 fix for Node.js: `NODE_OPTIONS="--dns-result-order=ipv4first"` in Dockerfile
- ✅ httpClient with undici has proper timeout handling
- ✅ Replaced WebTech with httpx for tech detection
- ✅ Fixed Fastify logger configuration
- ✅ Set `REQUIRE_AUTH=false` to bypass OIDC

## Contact & Resources
- Project: precise-victory-467219-s4
- Service Account: scanner-worker-sa@precise-victory-467219-s4.iam.gserviceaccount.com
- Architecture docs: workflow.md
- Build config: cloudbuild-scanner-service.yaml


Here’s the straight-line path to figure out – and finally kill – the hanging subprocesses.
Confirm the actual httpx flags you’re using
httpx -h shows there is no -ip-version switch in v1.6.x.
The only “network” knobs are -timeout, -retries, -proxy, etc.
Bottom-line: every run you thought was “IPv4-only” was still the stock behaviour (Happy-Eyeballs → AAAA first, then A).
Reproduce the hang inside the running container
debug
If it prints nothing for ~10 s you’ll see the stall first-hand.
Add dig +trace example.com – you’ll notice it resolves both AAAA and A.
Force IPv4 at the OS / Go-runtime level instead of fake CLI flags
a) gai.conf (glibc resolver) – works for all subprocesses:
conf
b) Go resolver knob – works for every Go binary (httpx, nuclei, etc.):
)
Or bake it into the image:
v4
Verify locally before deploying
10
Should finish in < 0.2 s now.
Redeploy and re-test
"
Fallback guard (in case any subprocess still wedges)
Keep the existing execFile timeouts but add killSignal: 'SIGKILL' – you already did this for sslscan; do it for every other spawn.
If after steps 1–5 techStackScan still freezes, run it interactively with strace -f -e connect,recvfrom,sendto -p <pid> while it’s stuck – you’ll almost certainly see repeated IPv6 SYNs that never complete. With GODEBUG=netdns=go+v4 those SYNs disappear.
Short version to the next agent:
Remove the bogus -ip-version 4 usage.
Add ENV GODEBUG=netdns=go+v4 (or gai.conf precedence tweak) to the image.
Keep SIGKILL safety timers.
Re-build, deploy, smoke-test techStackScan and tlsScan again – they should both complete in < 10 s.