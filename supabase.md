# Supabase SQL Commands

## Fix CLIENT_SIDE_SECRET_EXPOSURE Risk Model

```sql
-- Fix CLIENT_SIDE_SECRET_EXPOSURE risk model - Option 1
-- Create new attack type with proper risk values
-- This addresses the core issue: CLIENT_SIDE_SECRET_EXPOSURE findings have no attack_type_code

-- 1. Add new attack type to attack_meta table
INSERT INTO public.attack_meta (attack_type_code, prevalence, raw_weight) VALUES 
  ('CLIENT_SIDE_SECRET_EXPOSURE', '0.8', '600000')
ON CONFLICT (attack_type_code) DO UPDATE SET 
  prevalence = EXCLUDED.prevalence,
  raw_weight = EXCLUDED.raw_weight;

-- 2. Add updated risk constants with your revised LGB tiers
INSERT INTO public.risk_constants (key, value) VALUES
  ('CLIENT_SECRET_CRITICAL', 600000),   -- Up from 500K
  ('CLIENT_SECRET_HIGH',     300000),   -- Up from 200K
  ('CLIENT_SECRET_MEDIUM',   100000)    -- Unchanged
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Update existing CLIENT_SIDE_SECRET_EXPOSURE findings to have proper attack_type_code
UPDATE findings 
SET attack_type_code = 'CLIENT_SIDE_SECRET_EXPOSURE'
WHERE type = 'CLIENT_SIDE_SECRET_EXPOSURE' 
  AND attack_type_code IS NULL;

-- 4. Update sync worker to handle CLIENT_SIDE_SECRET_EXPOSURE in financial calculations
-- This requires code changes - add to sync.ts switch statement:
-- case 'CLIENT_SIDE_SECRET_EXPOSURE':
--     totals.site_hack_low += low;
--     totals.site_hack_ml += ml;
--     totals.site_hack_high += high;
--     break;

-- 5. Verify the fix worked
SELECT 
  f.type as finding_type,
  f.attack_type_code,
  COUNT(*) as finding_count,
  am.prevalence,
  am.raw_weight
FROM findings f
LEFT JOIN attack_meta am ON f.attack_type_code = am.attack_type_code
WHERE f.type = 'CLIENT_SIDE_SECRET_EXPOSURE'
GROUP BY f.type, f.attack_type_code, am.prevalence, am.raw_weight
ORDER BY finding_count DESC;

-- 6. Check what the new financial calculation would look like for scan YgvqoxIo6Uc
SELECT 
  f.scan_id,
  f.type as finding_type,
  f.attack_type_code,
  COUNT(*) as finding_count,
  am.raw_weight,
  (COUNT(*) * am.raw_weight) as total_financial_impact
FROM findings f
JOIN attack_meta am ON f.attack_type_code = am.attack_type_code
WHERE f.scan_id = 'YgvqoxIo6Uc'
  AND f.type = 'CLIENT_SIDE_SECRET_EXPOSURE'
GROUP BY f.scan_id, f.type, f.attack_type_code, am.raw_weight;
```