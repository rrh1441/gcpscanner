import { config } from 'dotenv';
import { UpstashQueue } from './core/queue.js';
import { initializeDatabase, insertArtifact } from './core/artifactStore.js';
import { runShodanScan } from './modules/shodan.js';
import { runSpiderFoot } from './modules/spiderFoot.js';
import { runDocumentExposure } from './modules/documentExposure.js';
import { runTrufflehog } from './modules/trufflehog.js';
import { runClientSecretScanner } from './modules/clientSecretScanner.js';
import { runRateLimitScan } from './modules/rateLimitScan.js';
import { runDnsTwist } from './modules/dnsTwist.js';
import { runTlsScan } from './modules/tlsScan.js';
import { runNucleiLegacy as runNuclei } from './modules/nuclei.js';
import { runDbPortScan } from './modules/dbPortScan.js';
import { runSpfDmarc } from './modules/spfDmarc.js';
import { runEndpointDiscovery } from './modules/endpointDiscovery.js';
import { runTechStackScan } from './modules/techStackScan.js';
import { runAbuseIntelScan } from './modules/abuseIntelScan.js';
import { runAdversarialMediaScan } from './modules/adversarialMediaScan.js';
import { runAccessibilityScan } from './modules/accessibilityScan.js';
import { runDenialWalletScan } from './modules/denialWalletScan.js';
import { runBreachDirectoryProbe } from './modules/breachDirectoryProbe.js';
import { runRdpVpnTemplates } from './modules/rdpVpnTemplates.js';
import { runEmailBruteforceSurface } from './modules/emailBruteforceSurface.js';
import { runCensysScan } from './modules/censysPlatformScan.js';
// import { runOpenVASScan } from './modules/openvasScan.js';  // Available but disabled until needed
import { runZAPScan } from './modules/zapScan.js';
import { runAssetCorrelator } from './modules/assetCorrelator.js';
import { enrichFindingsWithRemediation } from './util/remediationPlanner.js';
import { pool } from './core/artifactStore.js';

config();

const queue = new UpstashQueue(process.env.REDIS_URL!);

function log(...args: any[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [worker]`, ...args);
}

// Sync worker now runs continuously - no need to trigger manually

interface ScanJob {
  id: string;
  companyName: string;
  domain: string;
  createdAt: string;
}

// Tier-based module configuration
type ScanTier = 'TIER_1' | 'TIER_2';

// Tier 1: Safe, automated modules - no active probing beyond standard discovery
const TIER_1_MODULES = [
  // 'spiderfoot',       // REMOVED: 90% redundant with dedicated modules, saves 2m 47s
  'dns_twist', 
  'document_exposure',
  'shodan',
  // 'censys',           // REMOVED: per user request
  'breach_directory_probe',
  'endpoint_discovery',
  'tech_stack_scan',
  'abuse_intel_scan',
  'accessibility_scan',  // Limited to 3 pages in Tier 1
  'nuclei',              // Baseline vulnerability scan with 8s timeout
  'tls_scan',
  'spf_dmarc',
  'trufflehog',
  'client_secret_scanner'
];

// Tier 2: Deep scanning modules requiring authorization - includes active probing
const TIER_2_MODULES = [
  ...TIER_1_MODULES,  // Include all Tier 1 modules
  'rdp_vpn_templates',
  'email_bruteforce_surface', 
  'db_port_scan',
  'denial_wallet_scan',
  'zap_scan',     // ZAP only runs in Tier 2
  'nuclei',       // Full Nuclei scan in Tier 2
  'rate_limit_scan'
];

// Function to get active modules based on tier
function getActiveModules(tier: ScanTier): string[] {
  return tier === 'TIER_1' ? TIER_1_MODULES : TIER_2_MODULES;
}

// Determine scan tier - for now default to TIER_1 for performance
function determineScanTier(domain: string): ScanTier {
  // Default to Tier 1 for improved performance
  // TODO: Add logic for authorized Tier 2 scans
  return 'TIER_1';
}

interface ScanMasterUpdate {
  status?: string;
  progress?: number;
  current_module?: string;
  total_modules?: number;
  error_message?: string;
  total_findings_count?: number;
  max_severity?: string;
  completed_at?: Date;
  total_artifacts_count?: number;
}

// Helper function to update scans_master table
async function updateScanMasterStatus(scanId: string, updates: ScanMasterUpdate): Promise<void> {
  try {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [scanId, ...Object.values(updates)];
    
    // Only update updated_at for meaningful changes:
    // - Status changes (including completion)
    // - Error messages
    // - Final completion with findings/artifacts counts
    const shouldUpdateTimestamp = updates.status || updates.error_message || updates.completed_at || updates.total_findings_count !== undefined;
    
    const timestampClause = shouldUpdateTimestamp ? ', updated_at = NOW()' : '';
    
    const result = await pool.query(
      `UPDATE scans_master SET ${setClause}${timestampClause} WHERE scan_id = $1 AND status != 'completed'`,
      values
    );
    
    log(`[updateScanMasterStatus] Updated scan ${scanId} with:`, Object.keys(updates).join(', '));
    
    if (result.rowCount === 0) {
      log(`[updateScanMasterStatus] WARNING: No rows updated for scan ${scanId}, may not exist in scans_master table`);
    }
  } catch (error) {
    log(`[updateScanMasterStatus] ERROR: Failed to update scan ${scanId}:`, (error as Error).message);
    // Don't throw the error to avoid breaking the scan process
  }
}

// Initialize scans_master table
async function initializeScansMasterTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scans_master (
      scan_id VARCHAR(255) PRIMARY KEY,
      company_name VARCHAR(255) NOT NULL,
      domain VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'queued',
      progress INTEGER DEFAULT 0,
      current_module VARCHAR(100),
      total_modules INTEGER DEFAULT 0,
      error_message TEXT,
      total_findings_count INTEGER DEFAULT 0,
      max_severity VARCHAR(20),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE,
      total_artifacts_count INTEGER DEFAULT 0
    );
    
    CREATE INDEX IF NOT EXISTS idx_scans_master_updated_at ON scans_master(updated_at);
    CREATE INDEX IF NOT EXISTS idx_scans_master_status ON scans_master(status);

    CREATE TABLE IF NOT EXISTS worker_instances (
      instance_id VARCHAR(255) PRIMARY KEY,
      started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_worker_instances_heartbeat ON worker_instances(last_heartbeat);
  `);
}

// Clean up incomplete scans from previous worker instances
async function cleanupIncompleteScans(): Promise<void> {
  try {
    const result = await pool.query(`
      UPDATE scans_master 
      SET 
        status = 'failed',
        error_message = 'Worker restart - scan interrupted',
        completed_at = NOW(),
        updated_at = NOW()
      WHERE status IN ('queued', 'processing', 'module_failed')
      AND updated_at < NOW() - INTERVAL '5 minutes'
      RETURNING scan_id, company_name, status
    `);
    
    if (result.rows.length > 0) {
      log(`Cleaned up ${result.rows.length} incomplete scans from previous worker sessions:`, 
          result.rows.map(r => `${r.company_name} (${r.scan_id})`));
      
      // Also update the queue status for these jobs
      for (const scan of result.rows) {
        try {
          await queue.updateStatus(scan.scan_id, 'failed', 'Worker restart - scan interrupted');
        } catch (queueError) {
          log(`Warning: Could not update queue status for ${scan.scan_id}:`, (queueError as Error).message);
        }
      }
    } else {
      log('No incomplete scans found to clean up');
    }
  } catch (error) {
    log('Warning: Failed to cleanup incomplete scans:', (error as Error).message);
    // Don't fail startup if cleanup fails
  }
}

async function processScan(job: ScanJob): Promise<void> {
  const { id: scanId, companyName, domain } = job;
  
  log(`✅ JOB PICKED UP: Processing scan job ${scanId} for ${companyName} (${domain})`);
  log(`Processing comprehensive security scan for ${companyName} (${domain})`);
  
  try {
    // === SCAN INITIALIZATION ===
    const scanTier = determineScanTier(domain);
    const activeModules = getActiveModules(scanTier);
    const TOTAL_MODULES = activeModules.length;
    
    log(`[${scanId}] 🎯 Using ${scanTier} tier with ${TOTAL_MODULES} modules: ${activeModules.join(', ')}`);
    
    // Insert or update scan record
    await pool.query(
      `INSERT INTO scans_master (scan_id, company_name, domain, status, progress, total_modules, created_at, updated_at)
       VALUES ($1, $2, $3, 'queued', 0, $4, NOW(), NOW())
       ON CONFLICT (scan_id) DO UPDATE SET 
         status = 'queued', 
         progress = 0,
         current_module = NULL,
         total_modules = $4,
         company_name = EXCLUDED.company_name,
         domain = EXCLUDED.domain,
         updated_at = NOW(),
         completed_at = NULL,
         error_message = NULL`,
      [scanId, companyName, domain, TOTAL_MODULES]
    );
    
    await queue.updateStatus(scanId, 'processing', 'Comprehensive security discovery in progress...');
    
    let totalModuleResults = 0; // Count of module results (mix of artifacts/findings)
    let modulesCompleted = 0;
    
    // === MODULE EXECUTION ===
    // Start ALL independent modules immediately in parallel
    const immediateParallelPromises: { [key: string]: Promise<number> } = {};
    
    // Independent modules - start immediately
    if (activeModules.includes('breach_directory_probe')) {
      log(`[${scanId}] STARTING Breach Directory intelligence probe for ${domain} (immediate parallel)`);
      immediateParallelPromises.breach_directory_probe = runBreachDirectoryProbe({ domain, scanId });
    }
    
    if (activeModules.includes('shodan')) {
      log(`[${scanId}] STARTING Shodan intelligence scan for ${domain} (immediate parallel)`);
      immediateParallelPromises.shodan = runShodanScan({ domain, scanId, companyName });
    }
    
    if (activeModules.includes('dns_twist')) {
      log(`[${scanId}] STARTING DNS Twist scan for ${domain} (immediate parallel)`);
      immediateParallelPromises.dns_twist = runDnsTwist({ domain, scanId });
    }
    
    if (activeModules.includes('document_exposure')) {
      log(`[${scanId}] STARTING document exposure scan for ${companyName} (immediate parallel)`);
      immediateParallelPromises.document_exposure = runDocumentExposure({ companyName, domain, scanId });
    }
    
    if (activeModules.includes('endpoint_discovery')) {
      log(`[${scanId}] STARTING endpoint discovery for ${domain} (immediate parallel)`);
      immediateParallelPromises.endpoint_discovery = runEndpointDiscovery({ domain, scanId });
    }
    
    if (activeModules.includes('tls_scan')) {
      log(`[${scanId}] STARTING TLS security scan for ${domain} (immediate parallel)`);
      immediateParallelPromises.tls_scan = runTlsScan({ domain, scanId });
    }
    
    if (activeModules.includes('spf_dmarc')) {
      log(`[${scanId}] STARTING SPF/DMARC email security scan for ${domain} (immediate parallel)`);
      immediateParallelPromises.spf_dmarc = runSpfDmarc({ domain, scanId });
    }
    
    // Note: TruffleHog moved to phase 3 to run after endpointDiscovery completes
    // This ensures web assets are discovered before TruffleHog scans them
    
    if (activeModules.includes('accessibility_scan')) {
      log(`[${scanId}] STARTING accessibility compliance scan for ${domain} (immediate parallel)`);
      immediateParallelPromises.accessibility_scan = runAccessibilityScan({ domain, scanId });
    }

    // Wait for endpoint_discovery to complete before starting dependent modules
    let endpointResults = 0;
    if (immediateParallelPromises.endpoint_discovery) {
      log(`[${scanId}] WAITING for endpoint discovery to complete for dependent modules...`);
      endpointResults = await immediateParallelPromises.endpoint_discovery;
      log(`[${scanId}] COMPLETED endpoint discovery: ${endpointResults} endpoint collections found`);
      delete immediateParallelPromises.endpoint_discovery; // Remove from remaining promises
      totalModuleResults += endpointResults;
      modulesCompleted += 1;
    }

    // Start endpoint-dependent modules after endpoint_discovery completes
    const dependentParallelPromises: { [key: string]: Promise<number> } = {};
    
    if (activeModules.includes('nuclei')) {
      log(`[${scanId}] STARTING Nuclei vulnerability scan for ${domain} (parallel after endpoint discovery)`);
      dependentParallelPromises.nuclei = runNuclei({ domain, scanId });
    }
    
    if (activeModules.includes('tech_stack_scan')) {
      log(`[${scanId}] STARTING tech stack scan for ${domain} (parallel after endpoint discovery)`);
      dependentParallelPromises.tech_stack_scan = runTechStackScan({ domain, scanId });
    }
    
    if (activeModules.includes('abuse_intel_scan')) {
      log(`[${scanId}] STARTING AbuseIPDB intelligence scan for IPs (parallel after endpoint discovery)`);
      dependentParallelPromises.abuse_intel_scan = runAbuseIntelScan({ scanId });
    }

    // Wait for all immediate parallel modules to complete
    for (const [moduleName, promise] of Object.entries(immediateParallelPromises)) {
      try {
        log(`[${scanId}] WAITING for ${moduleName} scan to complete...`);
        const results = await promise;
        log(`[${scanId}] COMPLETED ${moduleName} scan: ${results} findings found`);
        totalModuleResults += results;
        modulesCompleted += 1;
      } catch (error) {
        log(`[${scanId}] ${moduleName} scan failed:`, error);
      }
    }
    
    // Wait for all dependent parallel modules to complete
    for (const [moduleName, promise] of Object.entries(dependentParallelPromises)) {
      try {
        log(`[${scanId}] WAITING for ${moduleName} scan to complete...`);
        const results = await promise;
        log(`[${scanId}] COMPLETED ${moduleName} scan: ${results} findings found`);
        totalModuleResults += results;
        modulesCompleted += 1;
      } catch (error) {
        log(`[${scanId}] ${moduleName} scan failed:`, error);
      }
    }

    // Phase 3: Sequential modules that cannot run in parallel
    const phase3Modules = activeModules.filter(m => 
      !immediateParallelPromises.hasOwnProperty(m) && 
      !dependentParallelPromises.hasOwnProperty(m) &&
      m !== 'endpoint_discovery' // Already completed
    );
    
    for (const moduleName of phase3Modules) {
      const progress = Math.floor((modulesCompleted / TOTAL_MODULES) * 100);
      
      // Update status before running module
      await updateScanMasterStatus(scanId, {
        status: 'processing',
        current_module: moduleName,
        progress: progress
      });
      
      log(`=== Running module: ${moduleName} (${modulesCompleted + 1}/${TOTAL_MODULES}) ===`);
      
      try {
        let moduleFindings = 0;
        
        switch (moduleName) {
          case 'rdp_vpn_templates':
            log(`[${scanId}] STARTING RDP/VPN template scan for ${domain}`);
            moduleFindings = await runRdpVpnTemplates({ domain, scanId });
            log(`[${scanId}] COMPLETED RDP/VPN scan: ${moduleFindings} services found`);
            break;
            
          case 'email_bruteforce_surface':
            log(`[${scanId}] STARTING email bruteforce surface scan for ${domain}`);
            moduleFindings = await runEmailBruteforceSurface({ domain, scanId });
            log(`[${scanId}] COMPLETED email surface scan: ${moduleFindings} exposures found`);
            break;
            
          case 'nuclei':
            log(`[${scanId}] STARTING Nuclei vulnerability scan for ${domain}`);
            moduleFindings = await runNuclei({ domain, scanId });
            log(`[${scanId}] COMPLETED Nuclei scan: ${moduleFindings} vulnerabilities found`);
            break;
            
          case 'zap_scan':
            log(`[${scanId}] STARTING OWASP ZAP web application security scan for ${domain}`);
            moduleFindings = await runZAPScan({ domain, scanId });
            log(`[${scanId}] COMPLETED ZAP scan: ${moduleFindings} web application vulnerabilities found`);
            break;
            
          case 'db_port_scan':
            log(`[${scanId}] STARTING database port scan for ${domain}`);
            moduleFindings = await runDbPortScan({ domain, scanId });
            log(`[${scanId}] COMPLETED database scan: ${moduleFindings} database issues found`);
            break;

          case 'denial_wallet_scan':
            log(`[${scanId}] STARTING denial-of-wallet vulnerability scan for ${domain}`);
            moduleFindings = await runDenialWalletScan({ domain, scanId });
            log(`[${scanId}] COMPLETED denial-of-wallet scan: ${moduleFindings} cost amplification vulnerabilities found`);
            break;
          
          case 'tls_scan':
            log(`[${scanId}] STARTING TLS security scan for ${domain}`);
            moduleFindings = await runTlsScan({ domain, scanId });
            log(`[${scanId}] COMPLETED TLS scan: ${moduleFindings} TLS issues found`);
            break;
            
          case 'rate_limit_scan':
            log(`[${scanId}] STARTING rate limit analysis for ${domain}`);
            moduleFindings = await runRateLimitScan({ domain, scanId });
            log(`[${scanId}] COMPLETED rate limit scan: ${moduleFindings} rate limit issues found`);
            break;
            
            
          case 'spf_dmarc':
            log(`[${scanId}] STARTING SPF/DMARC email security scan for ${domain}`);
            moduleFindings = await runSpfDmarc({ domain, scanId });
            log(`[${scanId}] COMPLETED email security scan: ${moduleFindings} email issues found`);
            break;
            
          case 'trufflehog':
            log(`[${scanId}] STARTING TruffleHog secret detection for ${domain}`);
            moduleFindings = await runTrufflehog({ domain, scanId });
            log(`[${scanId}] COMPLETED secret detection: ${moduleFindings} secrets found`);
            break;
            
          case 'client_secret_scanner':
            log(`[${scanId}] STARTING client-side secret scanner for ${domain}`);
            moduleFindings = await runClientSecretScanner({ scanId });
            log(`[${scanId}] COMPLETED client secret scan: ${moduleFindings} secrets found`);
            break;
            
          default:
            log(`Unknown module: ${moduleName}, skipping`);
            break;
        }
        
        totalModuleResults += moduleFindings;
        modulesCompleted += 1;
        
      } catch (error) {
        log(`[${scanId}] Module ${moduleName} failed:`, error);
        await insertArtifact({
          type: 'scan_error',
          val_text: `Module ${moduleName} failed: ${(error as Error).message}`,
          severity: 'MEDIUM',
          meta: { scan_id: scanId, module: moduleName }
        });
      }
    }

    // === ASSET CORRELATION ===
    log(`[${scanId}] === Starting Asset Correlation ===`);
    try {
      await runAssetCorrelator({ scanId, domain, tier: scanTier === 'TIER_2' ? 'tier2' : 'tier1' });
      log(`[${scanId}] Asset correlation completed successfully`);
    } catch (error) {
      log(`[${scanId}] Asset correlation failed (non-critical):`, error);
      // Don't fail the entire scan if correlation fails
      await insertArtifact({
        type: 'scan_warning',
        val_text: `Asset correlation skipped due to error: ${(error as Error).message}`,
        severity: 'LOW',
        meta: { scan_id: scanId, module: 'assetCorrelator' }
      });
    }

    // === REMEDIATION ENRICHMENT ===
    log(`[${scanId}] === Starting Remediation Enrichment ===`);
    try {
      const enrichedCount = await enrichFindingsWithRemediation(scanId);
      log(`[${scanId}] Remediation enrichment completed: ${enrichedCount} findings enhanced`);
    } catch (error) {
      log(`[${scanId}] Remediation enrichment failed (non-critical):`, error);
      // Don't fail the entire scan if remediation fails
      await insertArtifact({
        type: 'scan_warning',
        val_text: `Remediation enrichment skipped due to error: ${(error as Error).message}`,
        severity: 'LOW',
        meta: { scan_id: scanId, module: 'remediationPlanner' }
      });
    }

    // === SCAN COMPLETION ===
    const finalProgress = 100;
    await updateScanMasterStatus(scanId, {
      status: 'completed',
      progress: finalProgress,
      current_module: undefined,
      completed_at: new Date(),
      total_findings_count: totalModuleResults
    });
    
    log(`[${scanId}] ✅ SCAN COMPLETE: ${totalModuleResults} total findings across ${TOTAL_MODULES} modules`);
    
    // Mark job as completed in queue (removes from processing list)
    await queue.completeJob(scanId);
    
  } catch (error: any) {
    log(`[${scanId}] ❌ SCAN FAILED:`, error);
    
    await updateScanMasterStatus(scanId, {
      status: 'failed',
      error_message: error.message || 'Unknown scan error',
      completed_at: new Date()
    });
    
    await insertArtifact({
      type: 'scan_error',
      val_text: `Scan failed: ${error.message}`,
      severity: 'CRITICAL',
      meta: { scan_id: scanId, error_details: error.stack }
    });
    
    // Mark job as failed in queue (removes from processing list)
    await queue.failJob(scanId, error.message || 'Unknown scan error');
  }
}

async function startWorker() {
  // Log worker startup with instance identifier
  const workerInstanceId = process.env.FLY_MACHINE_ID || `worker-${Date.now()}`;
  log(`Starting security scanning worker [${workerInstanceId}]`);
  
  // Validate required environment
  if (!process.env.SHODAN_API_KEY) {
    log('ERROR: SHODAN_API_KEY not configured - cannot run real scans');
    process.exit(1);
  }
  
  // Initialize database
  try {
    await initializeDatabase();
    await initializeScansMasterTable();
    log('Database and scans_master table initialized successfully');
    
    // Clean up any incomplete scans from previous worker instances
    await cleanupIncompleteScans();
    
    // Run stale job cleanup on startup
    await queue.cleanupStaleJobs();
    
    // Mark this worker instance as active
    await pool.query(`
      INSERT INTO worker_instances (instance_id, started_at, last_heartbeat) 
      VALUES ($1, NOW(), NOW())
      ON CONFLICT (instance_id) DO UPDATE SET 
        started_at = NOW(), 
        last_heartbeat = NOW()
    `, [workerInstanceId]);
    
  } catch (error) {
    log('Database initialization failed:', (error as Error).message);
    process.exit(1);
  }

  // Schedule periodic stale job cleanup (every 10 minutes)
  setInterval(async () => {
    try {
      await queue.cleanupStaleJobs();
    } catch (error) {
      log('Error during scheduled cleanup:', error);
    }
  }, 10 * 60 * 1000);

  // Main processing loop
  while (!isShuttingDown) {
    try {
      const job = await queue.getNextJob();
      
      if (job && !isShuttingDown) {
        log('Processing scan job:', job.id);
        await processScan(job);
      } else {
        // No jobs available, wait shorter interval for faster pickup
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      if (!isShuttingDown) {
        log('Worker error:', (error as Error).message);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }
  
  log('Worker loop exited due to shutdown signal');
}

// Graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    log(`Already shutting down, ignoring ${signal}`);
    return;
  }
  
  isShuttingDown = true;
  log(`Received ${signal}, initiating graceful shutdown...`);
  
  try {
    // Mark any currently processing scans as interrupted
    const workerInstanceId = process.env.FLY_MACHINE_ID || `worker-${Date.now()}`;
    
    const interruptedScans = await pool.query(`
      UPDATE scans_master 
      SET 
        status = 'failed',
        error_message = 'Worker shutdown - scan interrupted',
        completed_at = NOW(),
        updated_at = NOW()
      WHERE status IN ('processing', 'queued')
      RETURNING scan_id, company_name
    `);
    
    if (interruptedScans.rows.length > 0) {
      log(`Marked ${interruptedScans.rows.length} scans as interrupted due to shutdown`);
      
      // Update queue status for interrupted scans
      for (const scan of interruptedScans.rows) {
        try {
          await queue.updateStatus(scan.scan_id, 'failed', 'Worker shutdown - scan interrupted');
        } catch (queueError) {
          log(`Warning: Could not update queue status for ${scan.scan_id}:`, (queueError as Error).message);
        }
      }
    }
    
    // Remove worker instance record
    await pool.query('DELETE FROM worker_instances WHERE instance_id = $1', [workerInstanceId]);
    
    // Close database connections
    await pool.end();
    
    log('Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    log('Error during graceful shutdown:', (error as Error).message);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startWorker().catch(error => {
  log('CRITICAL: Failed to start worker:', (error as Error).message);
  process.exit(1);
});
