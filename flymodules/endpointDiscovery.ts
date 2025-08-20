/* =============================================================================
 * MODULE: endpointDiscovery.ts (Consolidated v5 – 2025‑06‑15)
 * =============================================================================
 * - Discovers endpoints via robots.txt, sitemaps, crawling, JS analysis, and brute-force
 * - Integrates endpoint visibility checking to label whether each discovered route is:
 *     • public GET‑only (no auth)  → likely static content
 *     • requires auth             → sensitive / attack surface
 *     • allows state‑changing verbs (POST / PUT / …)
 * - Consolidated implementation with no external module dependencies
 * =============================================================================
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { parse } from 'node-html-parser';
import { insertArtifact } from '../core/artifactStore.js';
import { log } from '../core/logger.js';
import { URL } from 'node:url';
import * as https from 'node:https';

// ---------- Configuration ----------------------------------------------------

const MAX_CRAWL_DEPTH = 2;
const MAX_CONCURRENT_REQUESTS = 5;
const REQUEST_TIMEOUT = 8_000;
const DELAY_BETWEEN_CHUNKS_MS = 500;
const MAX_JS_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
const VIS_PROBE_CONCURRENCY = 5;
const VIS_PROBE_TIMEOUT = 10_000;

const ENDPOINT_WORDLIST = [
  'api',
  'admin',
  'app',
  'auth',
  'login',
  'register',
  'dashboard',
  'config',
  'settings',
  'user',
  'users',
  'account',
  'profile',
  'upload',
  'download',
  'files',
  'docs',
  'documentation',
  'help',
  'support',
  'contact',
  'about',
  'status',
  'health',
  'ping',
  'test',
  'dev',
  'debug',
  'staging',
  'prod',
  'production',
  'v1',
  'v2',
  'graphql',
  'rest',
  'webhook',
  'callback',
  'oauth',
  'token',
  'jwt',
  'session',
  'logout',
  'forgot',
  'reset',
  'verify',
  'confirm',
  'activate',
  'wordpress'
];

const AUTH_PROBE_HEADERS = [
  { Authorization: 'Bearer test' },
  { 'X-API-Key': 'test' },
  { 'x-access-token': 'test' },
  { 'X-Auth-Token': 'test' },
  { Cookie: 'session=test' },
  { 'X-Forwarded-User': 'test' }
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'curl/8.8.0',
  'python-requests/2.32.0',
  'Go-http-client/2.0'
];

const VERBS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const HTTPS_AGENT = new https.Agent({ rejectUnauthorized: true });

// ---------- Types ------------------------------------------------------------

interface DiscoveredEndpoint {
  url: string;
  path: string;
  confidence: 'high' | 'medium' | 'low';
  source:
    | 'robots.txt'
    | 'sitemap.xml'
    | 'crawl_link'
    | 'js_analysis'
    | 'wordlist_enum'
    | 'auth_probe';
  statusCode?: number;
  visibility?: 'public_get' | 'auth_required' | 'state_changing';
}

interface WebAsset {
  url: string;
  type: 'javascript' | 'css' | 'html' | 'json' | 'sourcemap' | 'other';
  size?: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'crawl' | 'js_analysis' | 'sourcemap_hunt' | 'targeted_probe';
  content?: string;
  mimeType?: string;
}

interface SafeResult {
  ok: boolean;
  status?: number;
  data?: unknown;
  error?: string;
}

interface EndpointReport {
  url: string;
  publicGET: boolean;
  allowedVerbs: string[];
  authNeeded: boolean;
  notes: string[];
}

// ---------- Endpoint Visibility Checking ------------------------------------

async function safeVisibilityRequest(method: string, target: string): Promise<AxiosResponse | null> {
  try {
    return await axios.request({
      url: target,
      method: method as any,
      timeout: VIS_PROBE_TIMEOUT,
      httpsAgent: HTTPS_AGENT,
      maxRedirects: 5,
      validateStatus: () => true
    });
  } catch {
    return null;
  }
}

async function checkEndpoint(urlStr: string): Promise<EndpointReport> {
  const notes: string[] = [];
  const result: EndpointReport = {
    url: urlStr,
    publicGET: false,
    allowedVerbs: [],
    authNeeded: false,
    notes
  };

  /* Validate URL */
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    notes.push('Invalid URL');
    return result;
  }

  /* OPTIONS preflight to discover allowed verbs */
  const optRes = await safeVisibilityRequest('OPTIONS', urlStr);
  if (optRes) {
    const allow = (optRes.headers['allow'] as string | undefined)?.split(',');
    if (allow) {
      result.allowedVerbs = allow.map((v) => v.trim().toUpperCase()).filter(Boolean);
    }
  }

  /* Anonymous GET */
  const getRes = await safeVisibilityRequest('GET', urlStr);
  if (!getRes) {
    notes.push('GET request failed');
    return result;
  }
  result.publicGET = getRes.status === 200;

  /* Check auth headers and common tokens */
  if (getRes.status === 401 || getRes.status === 403) {
    result.authNeeded = true;
    return result;
  }
  const wwwAuth = getRes.headers['www-authenticate'];
  if (wwwAuth) {
    result.authNeeded = true;
    notes.push(`WWW-Authenticate: ${wwwAuth}`);
  }

  /* Test side‑effect verbs only if OPTIONS permitted them */
  for (const verb of VERBS.filter((v) => v !== 'GET')) {
    if (!result.allowedVerbs.includes(verb)) continue;
    const res = await safeVisibilityRequest(verb, urlStr);
    if (!res) continue;
    if (res.status < 400) {
      notes.push(`${verb} responded with status ${res.status}`);
    }
  }

  return result;
}

// ---------- Discovery Helpers -----------------------------------------------

const discovered = new Map<string, DiscoveredEndpoint>();
const webAssets = new Map<string, WebAsset>();

const getRandomUA = (): string =>
  USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const safeRequest = async (
  url: string,
  cfg: AxiosRequestConfig
): Promise<SafeResult> => {
  try {
    const res: AxiosResponse = await axios({ url, ...cfg });
    return { ok: true, status: res.status, data: res.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown network error';
    return { ok: false, error: message };
  }
};

const addEndpoint = (
  baseUrl: string,
  ep: Omit<DiscoveredEndpoint, 'url'>
): void => {
  if (discovered.has(ep.path)) return;
  const fullUrl = `${baseUrl}${ep.path}`;
  discovered.set(ep.path, { ...ep, url: fullUrl });
  log(`[endpointDiscovery] +${ep.source} ${ep.path} (${ep.statusCode ?? '-'})`);
};

const addWebAsset = (asset: WebAsset): void => {
  if (webAssets.has(asset.url)) return;
  webAssets.set(asset.url, asset);
  log(`[endpointDiscovery] +web_asset ${asset.type} ${asset.url} (${asset.size ?? '?'} bytes)`);
};

const getAssetType = (url: string, mimeType?: string): WebAsset['type'] => {
  if (url.endsWith('.js.map')) return 'sourcemap';
  if (url.endsWith('.js') || mimeType?.includes('javascript')) return 'javascript';
  if (url.endsWith('.css') || mimeType?.includes('css')) return 'css';
  if (url.endsWith('.json') || mimeType?.includes('json')) return 'json';
  if (url.endsWith('.html') || url.endsWith('.htm') || mimeType?.includes('html')) return 'html';
  return 'other';
};

// ---------- Passive Discovery ------------------------------------------------

const parseRobotsTxt = async (baseUrl: string): Promise<void> => {
  const res = await safeRequest(`${baseUrl}/robots.txt`, {
    timeout: REQUEST_TIMEOUT,
    headers: { 'User-Agent': getRandomUA() },
    validateStatus: () => true
  });
  if (!res.ok || typeof res.data !== 'string') return;

  for (const raw of res.data.split('\n')) {
    const [directiveRaw, pathRaw] = raw.split(':').map((p) => p.trim());
    if (!directiveRaw || !pathRaw) continue;

    const directive = directiveRaw.toLowerCase();
    if ((directive === 'disallow' || directive === 'allow') && pathRaw.startsWith('/')) {
      addEndpoint(baseUrl, {
        path: pathRaw,
        confidence: 'medium',
        source: 'robots.txt'
      });
    } else if (directive === 'sitemap') {
      await parseSitemap(new URL(pathRaw, baseUrl).toString(), baseUrl);
    }
  }
};

const parseSitemap = async (sitemapUrl: string, baseUrl: string): Promise<void> => {
  const res = await safeRequest(sitemapUrl, {
    timeout: REQUEST_TIMEOUT,
    headers: { 'User-Agent': getRandomUA() },
    validateStatus: () => true
  });
  if (!res.ok || typeof res.data !== 'string') return;

  const root = parse(res.data);
  const locElems = root.querySelectorAll('loc');
  for (const el of locElems) {
    try {
      const url = new URL(el.text);
      addEndpoint(baseUrl, {
        path: url.pathname,
        confidence: 'high',
        source: 'sitemap.xml'
      });
    } catch {
      /* ignore bad URL */
    }
  }
};

// ---------- Active Discovery -------------------------------------------------

const analyzeJsFile = async (jsUrl: string, baseUrl: string): Promise<void> => {
  const res = await safeRequest(jsUrl, {
    timeout: REQUEST_TIMEOUT,
    maxContentLength: MAX_JS_FILE_SIZE_BYTES,
    headers: { 'User-Agent': getRandomUA() },
    validateStatus: () => true
  });
  if (!res.ok || typeof res.data !== 'string') return;

  // Save the JavaScript file as a web asset for secret scanning
  addWebAsset({
    url: jsUrl,
    type: 'javascript',
    size: res.data.length,
    confidence: 'high',
    source: 'js_analysis',
    content: res.data.length > 50000 ? res.data.substring(0, 50000) + '...[truncated]' : res.data,
    mimeType: 'application/javascript'
  });

  // Hunt for corresponding source map
  await huntSourceMap(jsUrl, baseUrl);

  // Extract endpoint patterns (existing functionality)
  const re = /['"`](\/[a-zA-Z0-9\-._/]*(?:api|auth|v\d|graphql|jwt|token)[a-zA-Z0-9\-._/]*)['"`]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(res.data)) !== null) {
    addEndpoint(baseUrl, {
      path: m[1],
      confidence: 'medium',
      source: 'js_analysis'
    });
  }

  // Look for potential data endpoints that might contain secrets
  const dataEndpointRe = /fetch\s*\(['"`]([^'"`]+)['"`]\)|axios\.[get|post|put|delete]+\(['"`]([^'"`]+)['"`]\)|\$\.get\(['"`]([^'"`]+)['"`]\)/g;
  let dataMatch: RegExpExecArray | null;
  while ((dataMatch = dataEndpointRe.exec(res.data)) !== null) {
    const endpoint = dataMatch[1] || dataMatch[2] || dataMatch[3];
    if (endpoint && endpoint.startsWith('/')) {
      addEndpoint(baseUrl, {
        path: endpoint,
        confidence: 'high',
        source: 'js_analysis'
      });
    }
  }
};

// Hunt for source maps that might expose backend secrets
const huntSourceMap = async (jsUrl: string, baseUrl: string): Promise<void> => {
  try {
    const sourceMapUrl = jsUrl + '.map';
    const res = await safeRequest(sourceMapUrl, {
      timeout: REQUEST_TIMEOUT,
      maxContentLength: 10 * 1024 * 1024, // 10MB max for source maps
      headers: { 'User-Agent': getRandomUA() },
      validateStatus: () => true
    });
    
    if (res.ok && typeof res.data === 'string') {
      log(`[endpointDiscovery] Found source map: ${sourceMapUrl}`);
      addWebAsset({
        url: sourceMapUrl,
        type: 'sourcemap',
        size: res.data.length,
        confidence: 'high',
        source: 'sourcemap_hunt',
        content: res.data.length > 100000 ? res.data.substring(0, 100000) + '...[truncated]' : res.data,
        mimeType: 'application/json'
      });
    }
  } catch (error) {
    // Source map hunting is opportunistic - don't log errors
  }
};

const crawlPage = async (
  url: string,
  depth: number,
  baseUrl: string,
  seen: Set<string>
): Promise<void> => {
  if (depth > MAX_CRAWL_DEPTH || seen.has(url)) return;
  seen.add(url);

  const res = await safeRequest(url, {
    timeout: REQUEST_TIMEOUT,
    headers: { 'User-Agent': getRandomUA() },
    validateStatus: () => true
  });
  if (!res.ok || typeof res.data !== 'string') return;

  // Save HTML content as web asset for secret scanning
  const contentType = typeof res.data === 'object' && res.data && 'headers' in res.data ? 
    (res.data as any).headers?.['content-type'] || '' : '';
  addWebAsset({
    url,
    type: getAssetType(url, contentType),
    size: res.data.length,
    confidence: 'high',
    source: 'crawl',
    content: res.data.length > 100000 ? res.data.substring(0, 100000) + '...[truncated]' : res.data,
    mimeType: contentType
  });

  const root = parse(res.data);
  const pageLinks = new Set<string>();

  root.querySelectorAll('a[href]').forEach((a) => {
    try {
      const abs = new URL(a.getAttribute('href')!, baseUrl).toString();
      if (abs.startsWith(baseUrl)) {
        addEndpoint(baseUrl, {
          path: new URL(abs).pathname,
          confidence: 'low',
          source: 'crawl_link'
        });
        pageLinks.add(abs);
      }
    } catch {
      /* ignore */
    }
  });

  root.querySelectorAll('script[src]').forEach((s) => {
    try {
      const abs = new URL(s.getAttribute('src')!, baseUrl).toString();
      if (abs.startsWith(baseUrl)) void analyzeJsFile(abs, baseUrl);
    } catch {
      /* ignore */
    }
  });

  // Extract CSS files
  root.querySelectorAll('link[rel="stylesheet"][href]').forEach((link) => {
    try {
      const abs = new URL(link.getAttribute('href')!, baseUrl).toString();
      if (abs.startsWith(baseUrl)) {
        void analyzeCssFile(abs, baseUrl);
      }
    } catch {
      /* ignore */
    }
  });

  // Look for inline scripts with potential secrets
  root.querySelectorAll('script:not([src])').forEach((script, index) => {
    const content = script.innerHTML;
    if (content.length > 100) { // Only save substantial inline scripts
      addWebAsset({
        url: `${url}#inline-script-${index}`,
        type: 'javascript',
        size: content.length,
        confidence: 'high',
        source: 'crawl',
        content: content.length > 10000 ? content.substring(0, 10000) + '...[truncated]' : content,
        mimeType: 'application/javascript'
      });
    }
  });

  for (const link of pageLinks) {
    await crawlPage(link, depth + 1, baseUrl, seen);
  }
};

// Analyze CSS files for potential secrets (background URLs with tokens, etc.)
const analyzeCssFile = async (cssUrl: string, baseUrl: string): Promise<void> => {
  const res = await safeRequest(cssUrl, {
    timeout: REQUEST_TIMEOUT,
    maxContentLength: 2 * 1024 * 1024, // 2MB max for CSS
    headers: { 'User-Agent': getRandomUA() },
    validateStatus: () => true
  });
  if (!res.ok || typeof res.data !== 'string') return;

  addWebAsset({
    url: cssUrl,
    type: 'css',
    size: res.data.length,
    confidence: 'medium',
    source: 'crawl',
    content: res.data.length > 50000 ? res.data.substring(0, 50000) + '...[truncated]' : res.data,
    mimeType: 'text/css'
  });
};

// ---------- Brute-Force / Auth Probe -----------------------------------------

const bruteForce = async (baseUrl: string): Promise<void> => {
  const tasks = ENDPOINT_WORDLIST.flatMap((word) => {
    const path = `/${word}`;
    const uaHeader = { 'User-Agent': getRandomUA() };

    const basic = {
      promise: safeRequest(`${baseUrl}${path}`, {
        method: 'HEAD',
        timeout: REQUEST_TIMEOUT,
        headers: uaHeader,
        validateStatus: () => true
      }),
      path,
      source: 'wordlist_enum' as const
    };

    const auths = AUTH_PROBE_HEADERS.map((h) => ({
      promise: safeRequest(`${baseUrl}${path}`, {
        method: 'GET',
        timeout: REQUEST_TIMEOUT,
        headers: { ...uaHeader, ...h },
        validateStatus: () => true
      }),
      path,
      source: 'auth_probe' as const
    }));

    return [basic, ...auths];
  });

  for (let i = 0; i < tasks.length; i += MAX_CONCURRENT_REQUESTS) {
    const slice = tasks.slice(i, i + MAX_CONCURRENT_REQUESTS);
    const settled = await Promise.all(slice.map((t) => t.promise));

    settled.forEach((res, idx) => {
      if (!res.ok) return;
      const { path, source } = slice[idx];
      if (res.status !== undefined && (res.status < 400 || res.status === 401 || res.status === 403)) {
        addEndpoint(baseUrl, {
          path,
          confidence: 'low',
          source,
          statusCode: res.status
        });
      }
    });

    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_CHUNKS_MS));
  }
};

// ---------- Visibility Probe -------------------------------------------------

async function enrichVisibility(endpoints: DiscoveredEndpoint[]): Promise<void> {
  const worker = async (ep: DiscoveredEndpoint): Promise<void> => {
    try {
      const rep: EndpointReport = await checkEndpoint(ep.url);
      if (rep.authNeeded) {
        ep.visibility = 'auth_required';
      } else if (rep.allowedVerbs.some((v: string) => v !== 'GET')) {
        ep.visibility = 'state_changing';
      } else {
        ep.visibility = 'public_get';
      }
    } catch (err) {
      /* swallow errors – leave visibility undefined */
    }
  };

  // Process endpoints in chunks with controlled concurrency
  for (let i = 0; i < endpoints.length; i += VIS_PROBE_CONCURRENCY) {
    const chunk = endpoints.slice(i, i + VIS_PROBE_CONCURRENCY);
    const chunkTasks = chunk.map(worker);
    await Promise.allSettled(chunkTasks);
  }
}

// Target high-value paths that might contain secrets
const probeHighValuePaths = async (baseUrl: string): Promise<void> => {
  const highValuePaths = [
    '/.env',
    '/config.json',
    '/app.config.json',
    '/settings.json',
    '/manifest.json',
    '/.env.local',
    '/.env.production',
    '/api/config',
    '/api/settings',
    '/_next/static/chunks/webpack.js',
    '/static/js/main.js',
    '/assets/config.js',
    '/config.js',
    '/build/config.json'
  ];

  const tasks = highValuePaths.map(async (path) => {
    try {
      const fullUrl = `${baseUrl}${path}`;
      const res = await safeRequest(fullUrl, {
        timeout: 5000,
        maxContentLength: 5 * 1024 * 1024, // 5MB max
        headers: { 'User-Agent': getRandomUA() },
        validateStatus: () => true
      });
      
      if (res.ok && res.data) {
        const contentType = '';
        addWebAsset({
          url: fullUrl,
          type: getAssetType(fullUrl, contentType),
          size: typeof res.data === 'string' ? res.data.length : 0,
          confidence: 'high',
          source: 'targeted_probe',
          content: typeof res.data === 'string' ? 
            (res.data.length > 50000 ? res.data.substring(0, 50000) + '...[truncated]' : res.data) : 
            '[binary content]',
          mimeType: contentType
        });
        
        log(`[endpointDiscovery] Found high-value asset: ${fullUrl}`);
      }
    } catch (error) {
      // Expected for most paths - don't log
    }
  });

  await Promise.all(tasks);
};

// ---------- Main Export ------------------------------------------------------

export async function runEndpointDiscovery(job: { domain: string; scanId?: string }): Promise<number> {
  log(`[endpointDiscovery] ⇢ start ${job.domain}`);
  const baseUrl = `https://${job.domain}`;
  discovered.clear();
  webAssets.clear();

  // Existing discovery methods
  await parseRobotsTxt(baseUrl);
  await parseSitemap(`${baseUrl}/sitemap.xml`, baseUrl);
  await crawlPage(baseUrl, 1, baseUrl, new Set<string>());
  await bruteForce(baseUrl);
  
  // New: Probe high-value paths for secrets
  await probeHighValuePaths(baseUrl);

  const endpoints = [...discovered.values()];
  const assets = [...webAssets.values()];

  /* ------- Visibility enrichment (public/static vs. auth) ---------------- */
  await enrichVisibility(endpoints);

  // Save discovered endpoints
  if (endpoints.length) {
    await insertArtifact({
      type: 'discovered_endpoints',
      val_text: `Discovered ${endpoints.length} unique endpoints for ${job.domain}`,
      severity: 'INFO',
      meta: {
        scan_id: job.scanId,
        scan_module: 'endpointDiscovery',
        endpoints
      }
    });
  }

  // Save discovered web assets for secret scanning
  if (assets.length) {
    await insertArtifact({
      type: 'discovered_web_assets',
      val_text: `Discovered ${assets.length} web assets for secret scanning on ${job.domain}`,
      severity: 'INFO',
      meta: {
        scan_id: job.scanId,
        scan_module: 'endpointDiscovery',
        assets,
        asset_breakdown: {
          javascript: assets.filter(a => a.type === 'javascript').length,
          css: assets.filter(a => a.type === 'css').length,
          html: assets.filter(a => a.type === 'html').length,
          json: assets.filter(a => a.type === 'json').length,
          sourcemap: assets.filter(a => a.type === 'sourcemap').length,
          other: assets.filter(a => a.type === 'other').length
        }
      }
    });
  }

  log(`[endpointDiscovery] ⇢ done – ${endpoints.length} endpoints, ${assets.length} web assets`);
  // Return 0 as this module doesn't create findings, only artifacts
  return 0;
}
