// apps/workers/modules/clientSecretScanner.ts
// Lightweight client-side secret detector with plug-in regex support
// ------------------------------------------------------------------
import { insertArtifact, insertFinding, pool } from '../core/artifactStore.js';
import { log } from '../core/logger.js';

import fs from 'node:fs';
import yaml from 'yaml';                       // ← NEW – tiny dependency
import OpenAI from 'openai';

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
type SecretHit = { pattern: SecretPattern; match: string; context?: string };

// LLM validation cache to avoid redundant checks
const llmValidationCache = new Map<string, boolean>();

// ------------------------------------------------------------------
// 1. Curated high-precision built-in patterns
// ------------------------------------------------------------------
const BUILTIN_PATTERNS: SecretPattern[] = [
  /* Database Exposure - CRITICAL */
  { name: 'Database Connection String', regex: /(postgres|postgresql|mysql|mongodb|redis):\/\/[^:]+:([^@]+)@[^/\s'"]+/gi, severity: 'CRITICAL' },
  { name: 'Supabase Database URL', regex: /(postgresql:\/\/postgres:[^@]+@[^/]*supabase[^/\s'"]+)/gi, severity: 'CRITICAL' },
  { name: 'Neon Database URL', regex: /(postgresql:\/\/[^:]+:[^@]+@[^/]*neon\.tech[^/\s'"]+)/gi, severity: 'CRITICAL' },
  { name: 'PlanetScale Database URL', regex: /(mysql:\/\/[^:]+:[^@]+@[^/]*\.psdb\.cloud[^/\s'"]+)/gi, severity: 'CRITICAL' },
  { name: 'Database Password', regex: /(db_password|database_password|DB_PASSWORD|DATABASE_PASSWORD|password)["']?\s*[:=]\s*["']?([^"'\s]{8,})["']?/gi, severity: 'CRITICAL' },
  { name: 'Postgres Host', regex: /(postgres_host|POSTGRES_HOST|pg_host|PG_HOST|host)["']?\s*[:=]\s*["']?([^"'\s]+\.(supabase\.co|neon\.tech|amazonaws\.com|pooler\.supabase\.com))["']?/gi, severity: 'HIGH' },
  { name: 'Database User', regex: /(postgres_user|POSTGRES_USER|db_user|DB_USER|user)["']?\s*[:=]\s*["']?(postgres|root|admin|db_admin)["']?/gi, severity: 'HIGH' },
  
  /* Core cloud / generic */
  { name: 'Supabase Service Key', regex: /(eyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{10,}).*?service_role/gi, severity: 'CRITICAL' },
  { name: 'Supabase Anon Key', regex: /(supabase_anon_key|SUPABASE_ANON_KEY)["']?\s*[:=]\s*["']?(eyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{10,})["']?/gi, severity: 'HIGH' },
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
  { name: 'New Relic License',    regex: /NRAA-[0-9a-f]{27}/gi,                                                            severity: 'HIGH'     },
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

// Helper to ensure all patterns have global flag for matchAll compatibility
function ensureGlobalFlag(pattern: SecretPattern): SecretPattern {
  if (pattern.regex.global) {
    return pattern;
  }
  return {
    ...pattern,
    regex: new RegExp(pattern.regex.source, pattern.regex.flags + 'g')
  };
}

// Lazy initialization function
let secretPatterns: SecretPattern[] | null = null;
function getSecretPatterns(): SecretPattern[] {
  if (secretPatterns === null) {
    // Ensure all patterns have global flag to prevent matchAll errors
    secretPatterns = [...BUILTIN_PATTERNS, ...loadPluginPatterns()].map(ensureGlobalFlag);
    log(`[clientSecretScanner] initialized ${secretPatterns.length} total patterns (${BUILTIN_PATTERNS.length} builtin + ${cachedPluginPatterns?.length || 0} plugin)`);
  }
  return secretPatterns;
}

// ------------------------------------------------------------------
// 3. Helpers
// ------------------------------------------------------------------

// Check if a match is within CSS context
function isInCSSContext(content: string, matchIndex: number): boolean {
  const beforeMatch = content.slice(Math.max(0, matchIndex - 200), matchIndex);
  const afterMatch = content.slice(matchIndex, matchIndex + 200);
  const fullContext = beforeMatch + afterMatch;
  
  // Check for CSS custom property definitions: --variable-name: value
  if (beforeMatch.includes('--') && (beforeMatch.includes(':') || afterMatch.includes(':'))) {
    return true;
  }
  
  // Check for CSS class definitions or selectors
  if (beforeMatch.match(/\.([\w-]+\s*{[^}]*|[\w-]+\s*:)/)) {
    return true;
  }
  
  // Check for CSS-in-JS or style objects
  if (beforeMatch.match(/(style|css|theme|colors?|styles|stylesheet)\s*[=:]\s*[{\[`"']/i)) {
    return true;
  }
  
  // Check for Tailwind config context
  if (beforeMatch.match(/(tailwind\.config|theme\s*:|extend\s*:)/)) {
    return true;
  }
  
  // Check for CSS property context (property: value)
  if (beforeMatch.match(/[a-zA-Z-]+\s*:\s*['"]?$/) || afterMatch.match(/^['"]?\s*[;,}]/)) {
    return true;
  }
  
  // Check for HTML attribute context
  if (beforeMatch.match(/<[^>]+\s+(style|class|className|data-[a-zA-Z-]+|aria-[a-zA-Z-]+)\s*=\s*['"]?$/)) {
    return true;
  }
  
  // Check for common CSS/HTML file patterns
  if (fullContext.match(/<style[^>]*>|<\/style>|\.css\s*['"`]|\.scss\s*['"`]|\.sass\s*['"`]/i)) {
    return true;
  }
  
  // Check for CSS framework contexts
  if (fullContext.match(/\b(mui|material-ui|styled-components|emotion|stitches|css-modules)\b/i)) {
    return true;
  }
  
  return false;
}

function findSecrets(content: string): SecretHit[] {
  const hits: SecretHit[] = [];
  for (const pattern of getSecretPatterns()) {
    for (const m of content.matchAll(pattern.regex)) {
      const match = m[1] || m[0];
      const matchIndex = m.index || 0;
      
      // Skip if this looks like a CSS variable or is in CSS context
      if (isCSSVariable(match) || isInCSSContext(content, matchIndex)) {
        continue;
      }
      
      hits.push({ pattern, match });
    }
  }
  return hits;
}

// CSS variable patterns that should be ignored
const CSS_VARIABLE_PATTERNS = [
  /^--[a-zA-Z-]+$/,                    // Standard CSS custom properties: --primary-color
  /^tw-[a-zA-Z-]+$/,                   // Tailwind CSS variables: tw-ring-color
  /^(primary|secondary|destructive|muted|accent|popover|card|border|input|ring|background|foreground)-?(border|foreground|background)?$/,
  /^(sidebar|chart)-[a-zA-Z0-9-]+$/,  // UI component variables: sidebar-primary, chart-1
  /^hsl\([0-9\s,%]+\)$/,              // HSL color values: hsl(210, 40%, 98%)
  /^rgb\([0-9\s,%]+\)$/,              // RGB color values: rgb(255, 255, 255)
  /^#[0-9a-fA-F]{3,8}$/,              // Hex colors: #ffffff, #fff
  /^[0-9]+(\.[0-9]+)?(px|em|rem|%|vh|vw|pt)$/,  // CSS units: 1rem, 100px, 50%
  /^-webkit-[a-zA-Z-]+$/,             // Webkit CSS properties: -webkit-tap-highlight-color
  /^-moz-[a-zA-Z-]+$/,                // Mozilla CSS properties: -moz-appearance
  /^-ms-[a-zA-Z-]+$/,                 // Microsoft CSS properties: -ms-flex
  /^transition-[a-zA-Z-]+$/,          // CSS transition properties: transition-timing-function
  /^animation-[a-zA-Z-]+$/,           // CSS animation properties: animation-timing-function
  /^transform-[a-zA-Z-]+$/,           // CSS transform properties: transform-origin
  /^flex-[a-zA-Z-]+$/,                // CSS flex properties: flex-direction
  /^grid-[a-zA-Z-]+$/,                // CSS grid properties: grid-template-columns
  /^data-[a-zA-Z-]+=\w+$/,            // HTML data attributes: data-panel-group-direction=vertical
  /^aria-[a-zA-Z-]+=\w+$/,            // ARIA attributes: aria-expanded=true
  /^[a-zA-Z]+-[a-zA-Z-]+$/,           // Generic CSS property pattern: background-color, font-family
];

// Check if a string looks like a CSS variable or design token
function isCSSVariable(s: string): boolean {
  return CSS_VARIABLE_PATTERNS.some(pattern => pattern.test(s));
}

// Optional entropy fallback
function looksRandom(s: string): boolean {
  if (s.length < 24) return false;
  
  // Skip CSS variables and design tokens
  if (isCSSVariable(s)) return false;
  
  const freq: Record<string, number> = {};
  for (const ch of Buffer.from(s)) freq[ch] = (freq[ch] ?? 0) + 1;
  const H = Object.values(freq).reduce((h,c) => h - (c/s.length)*Math.log2(c/s.length), 0);
  return H / 8 > 0.35;
}

// Batch validate potential secrets with LLM
async function validateSecretsWithLLM(candidates: Array<{match: string, context: string}>): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  // Check cache first
  const uncachedCandidates = candidates.filter(c => !llmValidationCache.has(c.match));
  if (uncachedCandidates.length === 0) {
    candidates.forEach(c => results.set(c.match, llmValidationCache.get(c.match) || false));
    return results;
  }
  
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `Analyze these potential secrets found in web assets. Return ONLY a JSON array of booleans in the same order.
True = likely a real secret/credential, False = CSS/HTML/benign code.

Candidates:
${uncachedCandidates.map((c, i) => `${i+1}. Token: "${c.match.slice(0, 50)}${c.match.length > 50 ? '...' : ''}"
   Context: ${c.context}`).join('\n\n')}

Rules:
- CSS properties, HTML attributes, style values = False
- API keys, tokens, passwords, JWTs, database URLs = True
- Base64 that decodes to CSS/HTML = False
- Webpack chunks, CSS hashes = False

Response format: [true, false, true, ...]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 1000,
    });
    
    const content = response.choices[0]?.message?.content || '[]';
    const validationResults = JSON.parse(content) as boolean[];
    
    // Store results in cache and return map
    uncachedCandidates.forEach((c, i) => {
      const isSecret = validationResults[i] ?? false;
      llmValidationCache.set(c.match, isSecret);
      results.set(c.match, isSecret);
    });
    
    // Add cached results
    candidates.forEach(c => {
      if (!results.has(c.match)) {
        results.set(c.match, llmValidationCache.get(c.match) || false);
      }
    });
    
    log(`[clientSecretScanner] LLM validated ${uncachedCandidates.length} candidates: ${validationResults.filter(v => v).length} secrets, ${validationResults.filter(v => !v).length} false positives`);
    
  } catch (err) {
    log('[clientSecretScanner] LLM validation failed:', (err as Error).message);
    // On error, be conservative and mark all as potential secrets
    candidates.forEach(c => results.set(c.match, true));
  }
  
  return results;
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

    // Collect all potential secrets across all assets for batch validation
    const allCandidates: Array<{asset: WebAsset, hits: SecretHit[]}> = [];
    
    for (const asset of assets) {
      let hits = findSecrets(asset.content);

      // entropy heuristic – optional low-severity catch-all
      // Only match tokens that look like actual secrets (base64, hex, alphanumeric with special chars)
      for (const m of asset.content.matchAll(/\b[A-Za-z0-9\/+=_]{32,}[A-Za-z0-9\/+=_]*\b/g)) {
        const t = m[0];
        const matchIndex = m.index || 0;
        
        // Skip if this looks like a CSS variable or is in CSS context
        if (isCSSVariable(t) || isInCSSContext(asset.content, matchIndex)) {
          continue;
        }
        
        // Skip common false positives
        if (t.match(/^[a-zA-Z-]+$/) ||           // Only letters and hyphens (CSS properties)
            t.match(/^[0-9]+$/) ||               // Only numbers
            t.includes('--') ||                  // CSS custom properties
            t.startsWith('data-') ||             // Data attributes
            t.startsWith('aria-') ||             // ARIA attributes
            t.match(/^(webkit|moz|ms|o)-/) ||   // Vendor prefixes
            t.match(/(color|theme|style|class|component|module|chunk|vendor|polyfill)/i)) {  // Common non-secret patterns
          continue;
        }
        
        if (looksRandom(t)) {
          const context = asset.content.slice(Math.max(0, matchIndex - 50), Math.min(asset.content.length, matchIndex + 50));
          hits.push({
            pattern: { name: 'High-entropy token - potential secret', regex:/./, severity:'MEDIUM' },
            match: t,
            context: context.replace(/\s+/g, ' ').trim()
          });
        }
      }

      if (hits.length > 0) {
        allCandidates.push({ asset, hits });
      }
    }

    // Batch validate all entropy-based candidates with LLM
    const entropyBasedCandidates = allCandidates.flatMap(({ hits }) => 
      hits.filter(h => h.pattern.name.includes('High-entropy')).map(h => ({ match: h.match, context: h.context || '' }))
    );
    
    let llmValidationMap = new Map<string, boolean>();
    if (entropyBasedCandidates.length > 0) {
      log(`[clientSecretScanner] validating ${entropyBasedCandidates.length} entropy-based candidates with LLM`);
      llmValidationMap = await validateSecretsWithLLM(entropyBasedCandidates);
    }

    // Process validated results
    for (const { asset, hits } of allCandidates) {
      // Filter hits based on LLM validation for entropy-based detections
      const validatedHits = hits.filter(hit => {
        if (hit.pattern.name.includes('High-entropy')) {
          return llmValidationMap.get(hit.match) || false;
        }
        // Keep all regex-based detections (they're already high-precision)
        return true;
      });

      if (!validatedHits.length) continue;
      log(`[clientSecretScanner] ${validatedHits.length} validated hit(s) → ${asset.url}`);
      let assetHits = 0;

      for (const { pattern, match } of validatedHits) {
        if (++assetHits > 25) { log('  ↪ noisy asset, truncated'); break; }
        total++;

        const artifactId = await insertArtifact({
          type: 'secret',
          val_text: `[Client] ${pattern.name}`,
          severity: pattern.severity,
          src_url: asset.url,
          meta: { scan_id: scanId, detector:'ClientSecretScanner', pattern:pattern.name, preview:match.slice(0,50) }
        });

        // Special handling for database exposure
        if (pattern.name.includes('Database') || pattern.name.includes('Postgres') || pattern.name.includes('Supabase') || pattern.name.includes('Neon')) {
          await insertFinding(
            artifactId,
            'DATABASE_EXPOSURE',
            'CRITICAL: Database access exposed! Rotate credentials IMMEDIATELY and restrict database access. This allows full database access including reading, modifying, and deleting all data.',
            `Exposed ${pattern.name} in client-side code. This grants FULL DATABASE ACCESS. Sample: ${match.slice(0,80)}…`
          );
        } else {
          await insertFinding(
            artifactId,
            'CLIENT_SIDE_SECRET_EXPOSURE',
            'Revoke / rotate this credential immediately; it is publicly downloadable.',
            `Exposed ${pattern.name} in client asset. Sample: ${match.slice(0,80)}…`
          );
        }
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