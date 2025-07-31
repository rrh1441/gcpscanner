import { config } from 'dotenv';
import { Firestore } from '@google-cloud/firestore';
import { insertArtifact as insertArtifactGCP } from './core/artifactStoreGCP.js';
import { runShodanScan } from './modules/shodan.js';
import { runDocumentExposure } from './modules/documentExposure.js';
import { runClientSecretScanner } from './modules/clientSecretScanner.js';
import { runDnsTwist } from './modules/dnsTwist.js';
import { runTlsScan } from './modules/tlsScan.js';
import { runNucleiLegacy as runNuclei } from './modules/nuclei.js';
import { runSpfDmarc } from './modules/spfDmarc.js';
import { runEndpointDiscovery } from './modules/endpointDiscovery.js';
import { runTechStackScan } from './modules/techStackScan.js';
import { runAbuseIntelScan } from './modules/abuseIntelScan.js';
import { runAccessibilityScan } from './modules/accessibilityScan.js';
import { runBreachDirectoryProbe } from './modules/breachDirectoryProbe.js';
import { runAssetCorrelator } from './modules/assetCorrelator.js';
import { runConfigExposureScanner } from './modules/configExposureScanner.js';
import { runBackendExposureScanner } from './modules/backendExposureScanner.js';

config();

// Initialize Firestore
const firestore = new Firestore();

function log(...args: any[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [worker]`, ...args);
}

// Use the GCP artifact store
const insertArtifact = insertArtifactGCP;

// Update scan status in Firestore
async function updateScanStatus(scanId: string, updates: any) {
  try {
    await firestore.collection('scans').doc(scanId).set({
      ...updates,
      updated_at: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    log(`Failed to update scan ${scanId}:`, error);
  }
}

interface ScanJob {
  scanId: string;
  companyName: string;
  domain: string;
  createdAt: string;
}

// Tier configuration
const TIER_1_MODULES = [
  'config_exposure',
  'dns_twist', 
  'document_exposure',
  'shodan',
  'breach_directory_probe',
  'endpoint_discovery',
  'tech_stack_scan',
  'abuse_intel_scan',
  'accessibility_scan',
  'nuclei',
  'tls_scan',
  'spf_dmarc',
  'client_secret_scanner',
  'backend_exposure_scanner'
];

export async function processScan(job: ScanJob) {
  const { scanId, companyName, domain } = job;
  
  log(`Processing scan ${scanId} for ${companyName} (${domain})`);
  
  try {
    // Update scan status
    await updateScanStatus(scanId, {
      status: 'processing',
      started_at: new Date().toISOString()
    });
    
    const activeModules = TIER_1_MODULES;
    let totalFindings = 0;
    
    // Run modules in parallel where possible
    const parallelModules: { [key: string]: Promise<number> } = {};
    
    // Independent modules
    if (activeModules.includes('breach_directory_probe')) {
      parallelModules.breach_directory_probe = runBreachDirectoryProbe({ domain, scanId });
    }
    if (activeModules.includes('shodan')) {
      parallelModules.shodan = runShodanScan({ domain, scanId, companyName });
    }
    if (activeModules.includes('dns_twist')) {
      parallelModules.dns_twist = runDnsTwist({ domain, scanId });
    }
    if (activeModules.includes('document_exposure')) {
      parallelModules.document_exposure = runDocumentExposure({ companyName, domain, scanId });
    }
    if (activeModules.includes('endpoint_discovery')) {
      parallelModules.endpoint_discovery = runEndpointDiscovery({ domain, scanId });
    }
    if (activeModules.includes('tls_scan')) {
      parallelModules.tls_scan = runTlsScan({ domain, scanId });
    }
    if (activeModules.includes('spf_dmarc')) {
      parallelModules.spf_dmarc = runSpfDmarc({ domain, scanId });
    }
    if (activeModules.includes('config_exposure')) {
      parallelModules.config_exposure = runConfigExposureScanner({ domain, scanId });
    }
    
    // Wait for endpoint discovery first
    let endpointResults = 0;
    if (parallelModules.endpoint_discovery) {
      endpointResults = await parallelModules.endpoint_discovery;
      log(`Endpoint discovery completed: ${endpointResults} findings`);
      delete parallelModules.endpoint_discovery;
      totalFindings += endpointResults;
    }
    
    // Then run dependent modules
    if (activeModules.includes('nuclei')) {
      parallelModules.nuclei = runNuclei({ domain, scanId });
    }
    if (activeModules.includes('tech_stack_scan')) {
      parallelModules.tech_stack_scan = runTechStackScan({ domain, scanId });
    }
    if (activeModules.includes('abuse_intel_scan')) {
      parallelModules.abuse_intel_scan = runAbuseIntelScan({ scanId });
    }
    if (activeModules.includes('client_secret_scanner')) {
      parallelModules.client_secret_scanner = runClientSecretScanner({ scanId });
    }
    if (activeModules.includes('backend_exposure_scanner')) {
      parallelModules.backend_exposure_scanner = runBackendExposureScanner({ scanId });
    }
    if (activeModules.includes('accessibility_scan')) {
      parallelModules.accessibility_scan = runAccessibilityScan({ domain, scanId });
    }
    
    // Wait for all modules
    for (const [moduleName, promise] of Object.entries(parallelModules)) {
      try {
        const results = await promise;
        log(`${moduleName} completed: ${results} findings`);
        totalFindings += results;
      } catch (error) {
        log(`${moduleName} failed:`, error);
        await insertArtifact({
          type: 'scan_error',
          val_text: `Module ${moduleName} failed: ${(error as Error).message}`,
          severity: 'MEDIUM',
          meta: { scan_id: scanId, module: moduleName }
        });
      }
    }
    
    // Run asset correlator
    try {
      await runAssetCorrelator({ scanId, domain, tier: 'tier1' });
      log('Asset correlation completed');
    } catch (error) {
      log('Asset correlation failed:', error);
    }
    
    // Update scan completion
    await updateScanStatus(scanId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      total_findings: totalFindings
    });
    
    log(`✅ Scan completed: ${totalFindings} total findings`);
    
  } catch (error) {
    log(`❌ Scan failed:`, error);
    
    await updateScanStatus(scanId, {
      status: 'failed',
      error: (error as Error).message,
      failed_at: new Date().toISOString()
    });
    
    await insertArtifact({
      type: 'scan_error',
      val_text: `Scan failed: ${(error as Error).message}`,
      severity: 'CRITICAL',
      meta: { scan_id: scanId }
    });
    
    throw error;
  }
}

// Export for use by worker-pubsub.ts
// The main entry point is now handled by worker-pubsub.ts which listens to Pub/Sub messages