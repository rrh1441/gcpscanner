-- Supabase Migration Script
-- This migrates the Dealbrief Scanner to write directly to Supabase instead of Fly PostgreSQL

-- 1. Create artifacts table (matching Fly's schema)
CREATE TABLE IF NOT EXISTS artifacts (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  val_text TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  src_url TEXT,
  sha256 VARCHAR(64),
  mime VARCHAR(100),
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Drop existing findings table if it exists (to recreate with proper schema)
DROP TABLE IF EXISTS findings CASCADE;

-- 3. Create findings table with proper foreign key to artifacts
CREATE TABLE findings (
  id BIGSERIAL PRIMARY KEY,
  artifact_id BIGINT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  finding_type VARCHAR(50) NOT NULL,
  recommendation TEXT NOT NULL,
  description TEXT NOT NULL,
  repro_command TEXT,
  remediation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional columns needed for Supabase compatibility
  scan_id VARCHAR(255),
  type VARCHAR(50) GENERATED ALWAYS AS (finding_type) STORED, -- Alias for compatibility
  severity VARCHAR(20),
  attack_type_code TEXT,
  state VARCHAR(50) DEFAULT 'active',
  eal_low BIGINT,
  eal_ml INTEGER,
  eal_high BIGINT,
  eal_daily INTEGER
);

-- 4. Update scan_status table to match expected schema
ALTER TABLE scan_status 
  ADD COLUMN IF NOT EXISTS scan_id VARCHAR(255) UNIQUE;

-- Create index on scan_id if not exists
CREATE INDEX IF NOT EXISTS idx_scan_status_scan_id ON scan_status(scan_id);

-- 5. Create necessary indexes for performance
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(type);
CREATE INDEX IF NOT EXISTS idx_artifacts_severity ON artifacts(severity);
CREATE INDEX IF NOT EXISTS idx_artifacts_created_at ON artifacts(created_at);
CREATE INDEX IF NOT EXISTS idx_artifacts_meta_scan_id ON artifacts((meta->>'scan_id'));
CREATE INDEX IF NOT EXISTS idx_findings_artifact_id ON findings(artifact_id);
CREATE INDEX IF NOT EXISTS idx_findings_type ON findings(finding_type);
CREATE INDEX IF NOT EXISTS idx_findings_created_at ON findings(created_at);
CREATE INDEX IF NOT EXISTS idx_findings_scan_id ON findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);

-- 6. Create function to extract scan_id from artifact meta and populate findings
CREATE OR REPLACE FUNCTION populate_finding_scan_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get scan_id from the artifact's meta field
  SELECT meta->>'scan_id' INTO NEW.scan_id
  FROM artifacts
  WHERE id = NEW.artifact_id;
  
  -- Set default severity if not provided
  IF NEW.severity IS NULL THEN
    NEW.severity = 'MEDIUM';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to automatically populate scan_id in findings
DROP TRIGGER IF EXISTS findings_populate_scan_id ON findings;
CREATE TRIGGER findings_populate_scan_id
  BEFORE INSERT ON findings
  FOR EACH ROW
  EXECUTE FUNCTION populate_finding_scan_id();

-- 8. Enable Row Level Security (RLS) for Supabase
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

-- 9. Create policies for service role access (adjust as needed)
CREATE POLICY "Service role can do everything on artifacts" ON artifacts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on findings" ON findings
  FOR ALL USING (auth.role() = 'service_role');

-- 10. Create view for easier querying of findings with artifact data
CREATE OR REPLACE VIEW findings_with_artifacts AS
SELECT 
  f.*,
  a.type as artifact_type,
  a.val_text as artifact_text,
  a.severity as artifact_severity,
  a.src_url,
  a.meta as artifact_meta
FROM findings f
JOIN artifacts a ON f.artifact_id = a.id;

-- 11. Grant necessary permissions
GRANT ALL ON artifacts TO service_role;
GRANT ALL ON findings TO service_role;
GRANT ALL ON findings_with_artifacts TO service_role;
GRANT USAGE ON SEQUENCE artifacts_id_seq TO service_role;
GRANT USAGE ON SEQUENCE findings_id_seq TO service_role;