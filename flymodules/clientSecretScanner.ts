// apps/workers/modules/clientSecretScanner.ts
// Lightweight client-side secret detector with plug-in regex support
// ------------------------------------------------------------------
import { insertArtifact, insertFinding, pool } from '../core/artifactStore.js';
import { log } from '../core/logger.js';

import fs from 'node:fs';
import yaml from 'yaml';                       // ← NEW – tiny dependency

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface ClientSecretScannerJob { scanId: string; }
interface WebAsset { url: string; content: string; }

interface SecretPattern {
  name:      string;
  regex:     RegExp;
  severity:  'CRITICAL' | 'HIGH' | 'MEDIUM';
  verify?:  (key: string) => Promise<boolean>;   // optional future hook
}
type SecretHit = { pattern: SecretPattern; match: string };

// ------------------------------------------------------------------
// 1. Curated high-precision built-in patterns
// ------------------------------------------------------------------
const BUILTIN_PATTERNS: SecretPattern[] = [
  /* Core cloud / generic */
  { name: 'Supabase Service Key', regex: /(eyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{10,}).*?service_role/gi, severity: 'CRITICAL' },
  { name: 'AWS Access Key ID',    regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,            severity: 'CRITICAL' },
  { name: 'AWS Secret Access Key',regex: /aws_secret_access_key["']?\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/g,           severity: 'CRITICAL' },
  { name: 'Google API Key',       regex: /AIza[0-9A-Za-z-_]{35}/g,                                                         severity: 'HIGH'     },
  { name: 'Stripe Live Secret',   regex: /sk_live_[0-9a-zA-Z]{24}/g,                                                       severity: 'CRITICAL' },
  { name: 'Generic API Key',      regex: /(api_key|apikey|api-key|secret|token|auth_token)["']?\s*[:=]\s*["']?([A-Za-z0-9\-_.]{20,})["']?/gi,
                                                                                                                            severity: 'HIGH'     },
  { name: 'JSON Web Token (JWT)', regex: /eyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{10,}/g,               severity: 'MEDIUM'   },

  /* Popular vendor-specific */
  { name: 'Mapbox Token',         regex: /pk\.[A-Za-z0-9]{60,}/g,                                                          severity: 'HIGH'     },
  { name: 'Sentry DSN',           regex: /https:\/\/[0-9a-f]{32}@o\d+\.ingest\.sentry\.io\/\d+/gi,                        severity: 'HIGH'     },
  { name: 'Datadog API Key',      regex: /dd[0-9a-f]{32}/gi,                                                               severity: 'HIGH'     },
  { name: 'Cloudinary URL',       regex: /cloudinary:\/\/[0-9]+:[A-Za-z0-9]+@[A-Za-z0-9_-]+/gi,                           severity: 'HIGH'     },
  { name: 'Algolia Admin Key',    regex: /[a-f0-9]{32}(?:-dsn)?\.algolia\.net/gi,                                         severity: 'HIGH'     },
  { name: 'Auth0 Client Secret',  regex: /AUTH0_CLIENT_SECRET["']?\s*[:=]\s*["']?([A-Za-z0-9_-]{30,})["']?/gi,             severity: 'CRITICAL' },
  { name: 'Bugsnag API Key',      regex: /bugsnag\.apiKey\s*=\s*['"]([A-Za-z0-9]{32})['"]/gi,                             severity: 'HIGH'     },
  { name: 'New Relic License',    regex: /NRAA-[0-9a-f]{27}/i,                                                             severity: 'HIGH'     },
  { name: 'PagerDuty API Key',    regex: /pdt[A-Z0-9]{30,32}/g,                                                            severity: 'HIGH'     },
  { name: 'Segment Write Key',    regex: /SEGMENT_WRITE_KEY["']?\s*[:=]\s*["']?([A-Za-z0-9]{32})["']?/gi,                  severity: 'HIGH'     }
];

// ------------------------------------------------------------------
// 2. Optional YAML plug-in patterns (lazy loaded with caching)
// ------------------------------------------------------------------
let cachedPluginPatterns: SecretPattern[] | null = null;

function loadPluginPatterns(): SecretPattern[] {
  // Return cached patterns if already loaded
  if (cachedPluginPatterns !== null) {
    return cachedPluginPatterns;
  }

  try {
    const p = process.env.CLIENT_SECRET_REGEX_YAML ?? '/app/config/extra-client-regex.yml';
    if (!fs.existsSync(p)) {
      cachedPluginPatterns = [];
      return cachedPluginPatterns;
    }
    
    const doc = yaml.parse(fs.readFileSync(p, 'utf8')) as Array<{name:string; regex:string; severity:string}>;
    if (!Array.isArray(doc)) {
      cachedPluginPatterns = [];
      return cachedPluginPatterns;
    }
    
    cachedPluginPatterns = doc.flatMap(e => {
      try {
        return [{
          name: e.name,
          regex: new RegExp(e.regex, 'gi'),
          severity: (e.severity ?? 'HIGH').toUpperCase() as 'CRITICAL'|'HIGH'|'MEDIUM'
        } satisfies SecretPattern];
      } catch { 
        log(`[clientSecretScanner] ⚠️  invalid regex in YAML: ${e.name}`); 
        return []; 
      }
    });
    
    log(`[clientSecretScanner] loaded ${cachedPluginPatterns.length} plugin patterns from YAML`);
    return cachedPluginPatterns;
    
  } catch (err) {
    log('[clientSecretScanner] Failed to load plug-in regexes:', (err as Error).message);
    cachedPluginPatterns = [];
    return cachedPluginPatterns;
  }
}

// Lazy initialization function
let secretPatterns: SecretPattern[] | null = null;
function getSecretPatterns(): SecretPattern[] {
  if (secretPatterns === null) {
    secretPatterns = [...BUILTIN_PATTERNS, ...loadPluginPatterns()];
    log(`[clientSecretScanner] initialized ${secretPatterns.length} total patterns (${BUILTIN_PATTERNS.length} builtin + ${cachedPluginPatterns?.length || 0} plugin)`);
  }
  return secretPatterns;
}

// ------------------------------------------------------------------
// 3. Helpers
// ------------------------------------------------------------------
function findSecrets(content: string): SecretHit[] {
  const hits: SecretHit[] = [];
  for (const pattern of getSecretPatterns()) {
    for (const m of content.matchAll(pattern.regex)) {
      hits.push({ pattern, match: m[1] || m[0] });
    }
  }
  return hits;
}

// Optional entropy fallback
function looksRandom(s: string): boolean {
  if (s.length < 24) return false;
  const freq: Record<string, number> = {};
  for (const ch of Buffer.from(s)) freq[ch] = (freq[ch] ?? 0) + 1;
  const H = Object.values(freq).reduce((h,c) => h - (c/s.length)*Math.log2(c/s.length), 0);
  return H / 8 > 0.35;
}

// ------------------------------------------------------------------
// 4. Main module
// ------------------------------------------------------------------
export async function runClientSecretScanner(job: ClientSecretScannerJob): Promise<number> {
  const { scanId } = job;
  log(`[clientSecretScanner] ▶ start – scanId=${scanId}`);

  let total = 0;

  try {
    const { rows } = await pool.query(
      `SELECT meta FROM artifacts
       WHERE type='discovered_web_assets' AND meta->>'scan_id'=$1
       ORDER BY created_at DESC LIMIT 1`, [scanId]);

    if (!rows.length || !rows[0].meta?.assets) {
      log('[clientSecretScanner] no assets to scan'); return 0;
    }

    const assets = (rows[0].meta.assets as WebAsset[])
      .filter(a => a.content && a.content !== '[binary content]');

    log(`[clientSecretScanner] scanning ${assets.length}/${rows[0].meta.assets.length} assets`);

    for (const asset of assets) {
      let hits = findSecrets(asset.content);

      // entropy heuristic – optional low-severity catch-all
      for (const m of asset.content.matchAll(/[A-Za-z0-9\/+=_-]{24,}/g)) {
        const t = m[0];
        if (looksRandom(t)) hits.push({
          pattern: { name:'High-entropy token', regex:/./, severity:'MEDIUM' },
          match: t
        });
      }

      if (!hits.length) continue;
      log(`[clientSecretScanner] ${hits.length} hit(s) → ${asset.url}`);
      let assetHits = 0;

      for (const { pattern, match } of hits) {
        if (++assetHits > 25) { log('  ↪ noisy asset, truncated'); break; }
        total++;

        const artifactId = await insertArtifact({
          type: 'secret',
          val_text: `[Client] ${pattern.name}`,
          severity: pattern.severity,
          src_url: asset.url,
          meta: { scan_id: scanId, detector:'ClientSecretScanner', pattern:pattern.name, preview:match.slice(0,50) }
        });

        await insertFinding(
          artifactId,
          'CLIENT_SIDE_SECRET_EXPOSURE',
          'Revoke / rotate this credential immediately; it is publicly downloadable.',
          `Exposed ${pattern.name} in client asset. Sample: ${match.slice(0,80)}…`
        );
      }
    }
  } catch (err) {
    log('[clientSecretScanner] error:', (err as Error).message);
  }

  await insertArtifact({
    type: 'scan_summary',
    val_text: `Client-side secret scan finished – ${total} secret(s) found`,
    severity: total ? 'HIGH' : 'INFO',
    meta: { scan_id: scanId, module:'clientSecretScanner', total }
  });

  log(`[clientSecretScanner] ▶ done – ${total} finding(s)`);
  return total;
}