# Sync Worker

This worker syncs data from Fly.io PostgreSQL to Supabase for the frontend to consume.

## Setup

### 1. Create the Database Table

First, run the SQL script to create the `scans_master` table in your Fly.io PostgreSQL database:

```bash
# Connect to your Fly.io PostgreSQL database
fly postgres connect -a your-postgres-app-name

# Run the SQL script
\i scripts/create_scans_master_table.sql
```

### 2. Set Environment Variables

Set the required environment variables for the sync worker:

```bash
# Set Supabase credentials
fly secrets set SUPABASE_URL="https://cssqcaieeixukjxqpynp.supabase.co" -a dealbrief-sync-worker
fly secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzc3FjYWllZWl4dWtqeHFweW5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTcwODU5NSwiZXhwIjoyMDYxMjg0NTk1fQ.SZI80-RDucQjMMS_4NcAx16LwDOek1zi_DVVdBwjZX8" -a dealbrief-sync-worker

# Set database connection (same as your main worker)
fly secrets set DATABASE_URL="your-fly-postgres-connection-string" -a dealbrief-sync-worker
```

### 3. Deploy the Sync Worker

```bash
# From the sync-worker directory
cd apps/sync-worker

# Deploy to Fly.io
fly deploy
```

## How It Works

1. **Scan Status Tracking**: The main worker (`apps/workers/worker.ts`) now updates the `scans_master` table with:
   - Job start: Creates record with status 'processing'
   - Phase updates: Updates status to 'analyzing_modules', 'generating_report'
   - Job completion: Updates status to 'done' with findings count and max severity
   - Job failure: Updates status to 'failed' with error message

2. **Data Sync**: The sync worker runs every 60 seconds and:
   - Syncs updated scans from `scans_master` to Supabase `scans` table
   - Syncs new findings from `findings` table to Supabase `findings` table
   - Uses incremental sync based on timestamps

3. **Frontend Integration**: Your frontend can now query Supabase for real-time scan status and findings.

## Monitoring

Check the sync worker logs:

```bash
fly logs -a dealbrief-sync-worker
```

## Supabase Tables

Make sure your Supabase database has these tables:

### `scans` table:
```sql
CREATE TABLE scans (
  scan_id VARCHAR(255) PRIMARY KEY,
  company_name VARCHAR(255),
  domain VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  total_findings INTEGER,
  max_severity VARCHAR(20),
  total_artifacts_count INTEGER
);
```

### `findings` table:
```sql
CREATE TABLE findings (
  id INTEGER PRIMARY KEY,
  scan_id VARCHAR(255),
  type VARCHAR(50),
  description TEXT,
  recommendation TEXT,
  severity VARCHAR(20),
  created_at TIMESTAMPTZ
);
```