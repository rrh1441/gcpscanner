-- =============================================================================
-- MIGRATION: Add indexes for asset correlation performance
-- =============================================================================
-- This migration adds indexes to optimize the assetCorrelator module queries
-- Run time: ~2-5 seconds on tables with <1M rows
-- =============================================================================

-- Index for fast artifact retrieval by scan_id and IP
-- This is the primary query pattern for correlation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artifacts_scan_ip 
ON artifacts USING gin ((meta->>'scan_id'), (meta->>'ip'))
WHERE meta->>'scan_id' IS NOT NULL;

-- Index for hostname-based artifact lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artifacts_scan_host
ON artifacts USING gin ((meta->>'scan_id'), (meta->>'host'))
WHERE meta->>'scan_id' IS NOT NULL AND meta->>'host' IS NOT NULL;

-- Index for port-based service correlation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artifacts_scan_port
ON artifacts USING gin ((meta->>'scan_id'), (meta->>'port'))
WHERE meta->>'scan_id' IS NOT NULL AND meta->>'port' IS NOT NULL;

-- Composite index for the main correlation query
-- Covers the WHERE clause and frequently accessed JSON fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artifacts_correlation
ON artifacts (created_at, id)
WHERE meta->>'scan_id' IS NOT NULL;

-- Index for finding correlation summaries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_artifacts_type_scan
ON artifacts (type, created_at)
WHERE type = 'correlated_asset_summary';

-- Analyze tables to update statistics for query planner
ANALYZE artifacts;

-- Verify indexes were created
DO $$
BEGIN
    RAISE NOTICE 'Correlation indexes created successfully';
    RAISE NOTICE 'Run EXPLAIN on correlation queries to verify index usage';
END $$;