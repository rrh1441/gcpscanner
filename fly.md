# Fly.io Database Access Guide

## Quick Commands

### List Apps
```bash
flyctl apps list | grep dealbrief
```

### List Scanner Machines
```bash
flyctl machine list -a dealbrief-scanner
```

### SSH into Scanner Worker Machine (RECOMMENDED)
```bash
flyctl ssh console -a dealbrief-scanner --machine 286565eb5406d8
```

### Get Environment Variables
```bash
flyctl ssh console -a dealbrief-scanner --machine 286565eb5406d8 -C "env | grep DATABASE"
```

## Database Connection Details

**DATABASE_URL**: `postgresql://postgres:EWLwYpuVkFIb@dealbrief-scanner-db.flycast:5432/postgres?sslmode=disable`

**Key Machine**: `286565eb5406d8` (scanner_worker with 4GB RAM)

## Database Access Methods

### Method 1: Local Proxy Connection (RECOMMENDED)
**Problem**: Shell escaping breaks complex queries via SSH
**Solution**: Use fly proxy to connect locally with psql

```bash
# Step 1: Start local proxy (use different port if 5432 in use)
fly proxy 5433 -a dealbrief-scanner-db &

# Step 2: Connect with psql
export PGPASSWORD=EWLwYpuVkFIb
psql "postgresql://postgres@localhost:5433/postgres?sslmode=disable"

# Step 3: Run queries directly
SELECT COUNT(*) FROM artifacts;
```

**Caveats**:
- Proxy runs in background - check with `ps aux | grep "fly proxy"`
- Kill existing proxy if port conflicts: `lsof -ti:5432 | xargs kill -9`
- Always use `localhost` not `flycast` when proxy is active
- Connection string: `postgresql://postgres@localhost:5433/postgres?sslmode=disable`

### Method 2: Docker psql (if psql not installed locally)
```bash
# With proxy running on 5433
docker run --rm -it --network host postgres \
  psql "postgresql://postgres:EWLwYpuVkFIb@localhost:5433/postgres?sslmode=disable"
```

### Method 3: Interactive SSH (for Node.js queries)
```bash
fly ssh console -a dealbrief-scanner --machine 286565eb5406d8
# Inside VM - no -C quoting issues:
cat > /tmp/check.js << 'EOF'
const { Client } = require('pg');
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { rows } = await client.query(`
    SELECT type, val_text, severity 
    FROM artifacts 
    WHERE val_text ILIKE '%vulnerable-test-site%' 
    LIMIT 10
  `);
  console.table(rows);
  await client.end();
})();
EOF

node /tmp/check.js
```

### Method 2: Simple Single Commands (LIMITED)
```bash
# Test basic connection
flyctl ssh console -a dealbrief-scanner --machine 286565eb5406d8 -C "node -p \"require('/app/apps/workers/dist/core/artifactStore.js').pool.query('SELECT COUNT(*) FROM artifacts').then(r => console.log('Total:', r.rows[0].count))\""

# Get environment
flyctl ssh console -a dealbrief-scanner --machine 286565eb5406d8 -C "printenv DATABASE_URL"
```

### Method 3: Interactive SSH Session
```bash
flyctl ssh console -a dealbrief-scanner --machine 286565eb5406d8
# Then inside the container:
cd /app
node
# In Node REPL:
const { pool } = require('./apps/workers/dist/core/artifactStore.js');
pool.query('SELECT * FROM artifacts LIMIT 5;').then(console.log);
```

## Common Queries

### Check Recent Scans
```sql
SELECT type, val_text, severity, created_at 
FROM artifacts 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Find Specific Domain Results
```sql
SELECT type, val_text, severity, created_at, meta 
FROM artifacts 
WHERE val_text ILIKE '%domain-name%' 
ORDER BY created_at DESC;
```

### Check Scan Module Performance
```sql
SELECT 
  meta->>'scan_module' as module,
  COUNT(*) as findings,
  AVG(EXTRACT(EPOCH FROM (created_at - (meta->>'scan_start_time')::timestamp))) as avg_duration
FROM artifacts 
WHERE meta->>'scan_module' IS NOT NULL
GROUP BY meta->>'scan_module';
```

## Troubleshooting

### Database Connection Issues
- **SASL password error**: Usually means environment variables aren't loaded properly
- **Connection refused**: Database proxy might not be running or wrong credentials
- **Module not found**: Need to run from correct directory with built assets

### SSH Session Issues  
- **Host unavailable**: Try specifying machine ID with `-m machine-id`
- **Timeout**: Network issues, try different region or wait and retry
- **Permission denied**: Check fly auth status with `flyctl auth whoami`

### Environment Variables
```bash
# Check if DATABASE_URL is set
echo $DATABASE_URL

# Check all environment variables
env | grep -E "(DATABASE|POSTGRES)"
```

## App Structure
- **dealbrief-scanner**: Main application with workers
- **dealbrief-scanner-db**: PostgreSQL database
- **dealbrief-admin**: Admin interface (currently suspended)

## Database Schema Key Tables
- `artifacts`: Main scan results and findings
- `scan_jobs`: Job queue and status
- `scan_metadata`: Scan configuration and timing

## Best Practices
1. Always query with LIMIT to avoid overwhelming output
2. Use `ORDER BY created_at DESC` to see recent results first  
3. Check `meta` column for detailed scan information
4. Use ILIKE for case-insensitive domain searches
5. Include timestamp filters for performance on large datasets

## Quick Finding Analysis Commands

### Check Scan Status via API
```bash
# Replace SCAN_ID with actual scan ID from scan response
curl -s https://dealbrief-scanner.fly.dev/scan/SCAN_ID/status | jq .
curl -s https://dealbrief-scanner.fly.dev/scan/SCAN_ID/findings | jq .
```

### Query Findings for Domain
```bash
export PGPASSWORD=EWLwYpuVkFIb
psql "postgresql://postgres@localhost:5433/postgres?sslmode=disable" -c "
SELECT type, severity, COUNT(*) as count 
FROM artifacts 
WHERE val_text ILIKE '%domain-name%' 
AND created_at > NOW() - INTERVAL '1 hour' 
GROUP BY type, severity 
ORDER BY severity DESC, count DESC;
"
```

### Get Detailed Findings for Domain
```bash
export PGPASSWORD=EWLwYpuVkFIb
psql "postgresql://postgres@localhost:5433/postgres?sslmode=disable" -c "
SELECT type, val_text, severity, created_at 
FROM artifacts 
WHERE val_text ILIKE '%domain-name%' 
AND created_at > NOW() - INTERVAL '1 hour' 
ORDER BY created_at DESC 
LIMIT 20;
"
```

### Check for Secret/Credential Exposures
```bash
# Check artifacts for secret scanning results
curl -s https://dealbrief-scanner.fly.dev/scan/SCAN_ID/artifacts | jq '.artifacts[] | select(.type | contains("secret") or contains("asset") or contains("credential") or contains("key") or contains("token"))'

# Check specific web assets content
curl -s https://dealbrief-scanner.fly.dev/scan/SCAN_ID/artifacts | jq '.artifacts[] | select(.type == "discovered_web_assets") | .meta.assets[] | select(.type == "javascript" or .content | contains("password") or contains("key") or contains("token"))'
```

### Debug Missing Findings
```bash
# Check if TruffleHog created secret artifacts but no findings
export PGPASSWORD=EWLwYpuVkFIb
psql "postgresql://postgres@localhost:5433/postgres?sslmode=disable" -c "
SELECT 
    a.type,
    a.val_text,
    a.severity,
    f.finding_type,
    f.description,
    a.created_at
FROM artifacts a
LEFT JOIN findings f ON a.id = f.artifact_id
WHERE a.type = 'secret' 
AND a.created_at > NOW() - INTERVAL '1 hour'
ORDER BY a.created_at DESC;
"
```