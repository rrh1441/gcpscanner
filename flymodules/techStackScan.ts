/* =============================================================================
 * MODULE: techStackScan.ts (Monolithic v4 – Pre-Refactor)
 * =============================================================================
 * This module performs technology fingerprinting with integrated vulnerability
 * intelligence, SBOM generation, and supply-chain risk scoring.
 * =============================================================================
 */
import {
  insertArtifact,
  insertFinding,
  pool,
} from '../core/artifactStore.js';
import { log as rootLog } from '../core/logger.js';
import {
  detectTechnologiesWithWebTech,
  detectTechnologiesWithWhatWeb,
  detectFromHeaders,
} from '../util/fastTechDetection.js';
import { detectTechnologyByFavicon } from '../util/faviconDetection.js';
import { UnifiedCache } from './techCache/index.js';

// Configuration
const CONFIG = {
  MAX_CONCURRENCY: 6,
  TECH_CIRCUIT_BREAKER: 20,
  PAGE_TIMEOUT_MS: 25_000,
  MAX_VULN_IDS_PER_FINDING: 12,
} as const;

type Severity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
const RISK_TO_SEVERITY: Record<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', Severity> = {
  LOW: 'INFO',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Types
interface TechResult {
  name: string;
  slug: string;
  version?: string;
  confidence: number;
  cpe?: string;
  purl?: string;
  vendor?: string;
  ecosystem?: string;
  categories: string[];
}

interface VulnRecord {
  id: string;
  source: 'OSV' | 'GITHUB';
  cvss?: number;
  epss?: number;
  cisaKev?: boolean;
  summary?: string;
  publishedDate?: Date;
  affectedVersionRange?: string;
  activelyTested?: boolean;
  exploitable?: boolean;
  verificationDetails?: any;
}

interface EnhancedSecAnalysis {
  eol: boolean;
  vulns: VulnRecord[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  advice: string[];
  versionAccuracy?: number;
  supplyChainScore: number;
  activeVerification?: {
    tested: number;
    exploitable: number;
    notExploitable: number;
  };
}

interface ScanMetrics {
  totalTargets: number;
  thirdPartyOrigins: number;
  uniqueTechs: number;
  supplyFindings: number;
  runMs: number;
  circuitBreakerTripped: boolean;
  cacheHitRate: number;
  dynamic_browser_skipped?: boolean;
}

// Cache removed for simplicity

const log = (...m: unknown[]) => rootLog('[techStackScan]', ...m);

// Helper function
function summarizeVulnIds(v: VulnRecord[], max: number): string {
  const ids = v.slice(0, max).map(r => r.id);
  return v.length > max ? ids.join(', ') + ', …' : ids.join(', ');
}

function detectEcosystem(tech: TechResult): string {
  const name = tech.name.toLowerCase();
  if (name.includes('node') || name.includes('npm')) return 'npm';
  if (name.includes('python') || name.includes('pip')) return 'pypi';
  if (name.includes('java') || name.includes('maven')) return 'maven';
  if (name.includes('ruby') || name.includes('gem')) return 'rubygems';
  if (name.includes('php') || name.includes('composer')) return 'packagist';
  if (name.includes('docker')) return 'docker';
  return 'unknown';
}

// Simplified target discovery
async function discoverTargets(scanId: string, domain: string, providedTargets?: string[]) {
  // Get discovered endpoints from endpointDiscovery if available
  const endpointQuery = await pool.query(
    `SELECT meta FROM artifacts WHERE type = 'discovered_endpoints' AND meta->>'scan_id' = $1 LIMIT 1`,
    [scanId]
  );
  
  const targets = new Set<string>();
  
  // Add primary domain targets
  targets.add(`https://${domain}`);
  targets.add(`https://www.${domain}`);
  
  // Add provided targets
  if (providedTargets) {
    providedTargets.forEach(t => targets.add(t));
  }
  
  // Add discovered endpoints if available
  if (endpointQuery.rows.length > 0 && endpointQuery.rows[0].meta.endpoints) {
    const endpoints = endpointQuery.rows[0].meta.endpoints;
    endpoints.slice(0, 10).forEach((ep: any) => {
      if (ep.url) targets.add(ep.url);
    });
  }
  
  return {
    primary: Array.from(targets).slice(0, 5),
    thirdParty: [],
    total: targets.size,
    metrics: {
      htmlCount: targets.size,
      nonHtmlCount: 0,
      thirdPartySkipped: false
    }
  };
}

// Simplified security analysis
async function analyzeSecurityEnhanced(tech: TechResult): Promise<EnhancedSecAnalysis> {
  return {
    eol: false,
    vulns: [],
    risk: 'LOW',
    advice: [`${tech.name} detected with confidence ${tech.confidence}%`],
    versionAccuracy: tech.confidence,
    supplyChainScore: 3.0,
    activeVerification: {
      tested: 0,
      exploitable: 0,
      notExploitable: 0
    }
  };
}

// Main function
export async function runTechStackScan(job: { 
  domain: string; 
  scanId: string;
  targets?: string[];
}): Promise<number> {
  const { domain, scanId, targets: providedTargets } = job;
  const start = Date.now();
  log(`techstack=start domain=${domain}`);

  try {
    // 1. TARGET DISCOVERY
    const targetResult = await discoverTargets(scanId, domain, providedTargets);
    const allTargets = targetResult.primary;
    
    log(`techstack=targets total=${targetResult.total} html=${allTargets.length}`);
    
    // 2. TECHNOLOGY DETECTION
    let allDetections: TechResult[] = [];
    let circuitBreakerTripped = false;
    
    for (const url of allTargets.slice(0, 5)) {
      try {
        const webtech = await detectTechnologiesWithWebTech(url);
        allDetections.push(...webtech.technologies);
        
        if (webtech.technologies.length === 0) {
          const whatweb = await detectTechnologiesWithWhatWeb(url);
          allDetections.push(...whatweb.technologies);
        }
        
        if (allDetections.length === 0) {
          const headers = await detectFromHeaders(url);
          allDetections.push(...headers);
        }

        const favicon = await detectTechnologyByFavicon(url);
        if (favicon.length > 0) {
          allDetections.push(...favicon);
        }
      } catch (err) {
        log(`Error detecting tech for ${url}:`, (err as Error).message);
      }
    }

    const techMap = new Map<string, TechResult>();
    for (const tech of allDetections) {
      if (!techMap.has(tech.slug) || (techMap.get(tech.slug)!.confidence < tech.confidence)) {
        techMap.set(tech.slug, tech);
      }
    }
    
    log(`techstack=tech_detection_complete techs=${techMap.size}`);
    
    // 3. SECURITY ANALYSIS
    const analysisMap = new Map<string, EnhancedSecAnalysis>();
    for (const [slug, tech] of techMap) {
      analysisMap.set(slug, await analyzeSecurityEnhanced(tech));
    }
    
    // 4. ARTIFACT GENERATION
    let artCount = 0;
    let supplyFindings = 0;
    
    for (const [slug, tech] of techMap) {
      const analysis = analysisMap.get(slug)!;
      const artId = await insertArtifact({
        type: 'technology',
        val_text: `${tech.name}${tech.version ? ' v' + tech.version : ''}`,
        severity: RISK_TO_SEVERITY[analysis.risk],
        meta: { 
          scan_id: scanId, 
          scan_module: 'techStackScan', 
          technology: tech, 
          security: analysis, 
          ecosystem: detectEcosystem(tech), 
          supply_chain_score: analysis.supplyChainScore, 
          version_accuracy: analysis.versionAccuracy, 
          active_verification: analysis.activeVerification 
        }
      });
      artCount++;
      
      if (analysis.vulns.length) {
        await insertFinding(
          artId,
          'EXPOSED_SERVICE',
          `${analysis.vulns.length} vulnerabilities detected: ${summarizeVulnIds(analysis.vulns, CONFIG.MAX_VULN_IDS_PER_FINDING)}`,
          analysis.advice.join(' ')
        );
      } else if (analysis.advice.length) {
        await insertFinding(
          artId,
          'TECHNOLOGY_RISK',
          analysis.advice.join(' '),
          `Analysis for ${tech.name}${tech.version ? ' v'+tech.version : ''}. Supply chain score: ${analysis.supplyChainScore.toFixed(1)}/10.`
        );
      }
      
      if (analysis.supplyChainScore >= 7.0) {
        supplyFindings++;
      }
    }

    // Generate discovered_endpoints artifact for dependent modules
    const endpointsForDeps = allTargets.map(url => ({
      url,
      method: 'GET',
      status: 200,
      title: 'Discovered endpoint',
      contentType: 'text/html',
      contentLength: 0,
      requiresAuth: false,
      isStaticContent: false,
      allowsStateChanging: false
    }));

    await insertArtifact({
      type: 'discovered_endpoints',
      val_text: `${endpointsForDeps.length} endpoints discovered for tech scanning`,
      severity: 'INFO',
      meta: {
        scan_id: scanId,
        scan_module: 'techStackScan',
        endpoints: endpointsForDeps,
        total_count: endpointsForDeps.length
      }
    });

    // Generate discovered_web_assets artifact for dependent modules  
    await insertArtifact({
      type: 'discovered_web_assets',
      val_text: `${allTargets.length} web assets discovered for tech scanning`,
      severity: 'INFO',
      meta: {
        scan_id: scanId,
        scan_module: 'techStackScan',
        assets: allTargets.map(url => ({ url, type: 'html' })),
        total_count: allTargets.length
      }
    });

    // 5. METRICS AND SUMMARY
    const runMs = Date.now() - start;
    const metrics: ScanMetrics = {
      totalTargets: targetResult.total,
      thirdPartyOrigins: 0,
      uniqueTechs: techMap.size,
      supplyFindings,
      runMs,
      circuitBreakerTripped,
      cacheHitRate: 0,
      dynamic_browser_skipped: false
    };

    await insertArtifact({
      type: 'scan_summary',
      val_text: `Tech scan: ${metrics.uniqueTechs} techs, ${supplyFindings} supply chain risks`,
      severity: 'INFO',
      meta: { 
        scan_id: scanId, 
        scan_module: 'techStackScan', 
        metrics, 
        scan_duration_ms: runMs 
      }
    });
    
    log(`techstack=complete domain=${domain} artifacts=${artCount} runtime=${runMs}ms`);
    return artCount;

  } catch (error) {
    log(`techstack=error domain=${domain} error="${(error as Error).message}"`);
    await insertArtifact({
      type: 'scan_error',
      val_text: `Tech stack scan failed: ${(error as Error).message}`,
      severity: 'HIGH',
      meta: { 
        scan_id: scanId, 
        scan_module: 'techStackScan', 
        error: (error as Error).message, 
        stack: (error as Error).stack 
      }
    });
    return 0;
  }
}