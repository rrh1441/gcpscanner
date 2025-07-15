# How to Trigger a Scan

## Quick Start - Single Scan

### Using curl (Recommended)
```bash
curl -X POST https://dealbrief-scanner.fly.dev/scan \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Company Name", "domain": "example.com"}'
```

### Using the Web Interface
Visit https://dealbrief-scanner.fly.dev and fill out the form

## Response Format
```json
{
  "scanId": "9Pzz-2u8Ehp",
  "status": "queued",
  "companyName": "Company Name", 
  "domain": "example.com",
  "originalDomain": "example.com",
  "message": "Scan started successfully"
}
```

## Check Scan Results

### Query Database for Findings
```bash
# Start database proxy (if not already running)
fly proxy 5433 -a dealbrief-scanner-db &

# Query findings for a specific domain
export PGPASSWORD=EWLwYpuVkFIb
psql "postgresql://postgres@localhost:5433/postgres?sslmode=disable" -c "
SELECT type, val_text, severity, created_at 
FROM artifacts 
WHERE val_text ILIKE '%domain-name%' 
ORDER BY created_at DESC 
LIMIT 10;
"
```

### Check Scan Status via API
```bash
# Replace SCAN_ID with actual scan ID from response
curl https://dealbrief-scanner.fly.dev/scan/SCAN_ID/status
curl https://dealbrief-scanner.fly.dev/scan/SCAN_ID/findings
```

## Bulk Scans

### JSON Array
```bash
curl -X POST https://dealbrief-scanner.fly.dev/scan/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {"companyName": "Company 1", "domain": "example1.com"},
    {"companyName": "Company 2", "domain": "example2.com"}
  ]'
```

### CSV Upload
```bash
curl -X POST https://dealbrief-scanner.fly.dev/scan/csv \
  -F "file=@companies.csv"
```

## Additional Options

### Add Tags
```bash
curl -X POST https://dealbrief-scanner.fly.dev/scan \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Company Name", "domain": "example.com", "tags": ["priority", "customer"]}'
```

### Scan Tiers
- **TIER_1**: Safe, automated modules (default)
- **TIER_2**: Deep scanning with active probing (requires authorization)

## Alternative Endpoints
- `POST /scans` - Frontend compatibility
- `POST /api/scans` - Another frontend compatibility endpoint

## Test Scripts (Local Development)
```bash
# Trigger test scan to production
node scripts/trigger-test-scan.js

# Test individual scans locally  
node test-batch-scan.js

# Test bulk scan endpoints
node test-bulk-scan.js
```

## Common Finding Types
- `tls_weakness` - SSL/TLS vulnerabilities
- `typo_domain` - Domain typosquatting threats
- `discovered_endpoints` - Exposed endpoints
- `breach_directory_summary` - Breach database checks
- And many more security findings...