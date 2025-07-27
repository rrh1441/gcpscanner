import { config } from 'dotenv';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';

// Import your existing scan modules
import { runShodanScan } from './modules/shodan.js';
import { runDocumentExposure } from './modules/documentExposure.js';
import { runDnsTwist } from './modules/dnsTwist.js';
import { runTlsScan } from './modules/tlsScan.js';
import { runNucleiLegacy as runNuclei } from './modules/nuclei.js';
import { runSpfDmarc } from './modules/spfDmarc.js';
import { runEndpointDiscovery } from './modules/endpointDiscovery.js';
import { runTechStackScan } from './modules/techStackScan.js';
import { runAbuseIntelScan } from './modules/abuseIntelScan.js';
import { runAccessibilityScan } from './modules/accessibilityScan.js';
import { runBreachDirectoryProbe } from './modules/breachDirectoryProbe.js';
import { runConfigExposureScanner } from './modules/configExposureScanner.js';
import { runBackendExposureScanner } from './modules/backendExposureScanner.js';
import { runClientSecretScanner } from './modules/clientSecretScanner.js';

config();

// Initialize Firebase and GCS
const app = initializeApp();
const db = getFirestore(app);
const storage = new Storage();
const artifactsBucket = storage.bucket(process.env.GCS_ARTIFACTS_BUCKET || 'dealbrief-artifacts');

function log(...args: any[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [worker]`, ...args);
}

interface ScanJob {
  scanId: string;
  companyName: string;
  domain: string;
  originalDomain: string;
  tags: string[];
  createdAt: string;
}

// Cost attribution mapping
const COST_MAP = {
  'exposed_api_key': { base: 25000, multiplier: 1.2 },
  'sql_injection': { base: 50000, multiplier: 1.5 },
  'xss_vulnerability': { base: 15000, multiplier: 1.1 },
  'exposed_admin_panel': { base: 30000, multiplier: 1.3 },
  'weak_ssl_config': { base: 8000, multiplier: 1.0 },
  'subdomain_takeover': { base: 40000, multiplier: 1.4 },
  'directory_listing': { base: 5000, multiplier: 0.8 },
  'default': { base: 10000, multiplier: 1.0 }
};

function calculateEAL(findingType: string, severity: string): number {
  const costInfo = COST_MAP[findingType] || COST_MAP.default;
  let severityMultiplier = 1.0;
  
  switch (severity) {
    case 'CRITICAL': severityMultiplier = 2.0; break;
    case 'HIGH': severityMultiplier = 1.5; break;
    case 'MEDIUM': severityMultiplier = 1.0; break;
    case 'LOW': severityMultiplier = 0.5; break;
  }
  
  return Math.round(costInfo.base * costInfo.multiplier * severityMultiplier);
}

// Enhanced artifact storage with GCS integration
async function storeArtifact(params: {
  type: string;
  content: string;
  severity: string;
  scanId: string;
  srcUrl?: string;
  metadata?: any;
}): Promise<string> {
  const { type, content, severity, scanId, srcUrl, metadata } = params;
  
  // Store in GCS if content is large
  let gcsUrl = null;
  if (content.length > 1000) {
    const fileName = `scans/${scanId}/artifacts/${Date.now()}_${type}.txt`;
    const file = artifactsBucket.file(fileName);
    await file.save(content, { metadata: { contentType: 'text/plain' } });
    gcsUrl = `gs://${artifactsBucket.name}/${fileName}`;
  }
  
  // Store metadata in Firestore
  const artifactDoc = {
    type,
    content: gcsUrl ? null : content, // Store in Firestore only if small
    gcs_url: gcsUrl,
    severity,
    src_url: srcUrl,
    metadata: metadata || {},
    created_at: new Date()
  };
  
  const docRef = await db
    .collection('scans')
    .doc(scanId)
    .collection('artifacts')
    .add(artifactDoc);
    
  return docRef.id;
}

// Enhanced finding storage with EAL calculation
async function storeFinding(params: {
  scanId: string;
  type: string;
  description: string;
  recommendation: string;
  severity: string;
  srcUrl?: string;
  artifactId?: string;
  metadata?: any;
}): Promise<string> {
  const { scanId, type, description, recommendation, severity, srcUrl, artifactId, metadata } = params;
  
  // Calculate Expected Annual Loss
  const ealEstimate = calculateEAL(type, severity);
  
  const findingDoc = {
    finding_type: type,
    description,
    recommendation,
    severity,
    src_url: srcUrl,
    artifact_id: artifactId,
    eal_estimate: ealEstimate,
    attack_type_code: mapToAttackType(type),
    metadata: metadata || {},
    created_at: new Date()
  };
  
  const docRef = await db
    .collection('scans')
    .doc(scanId)
    .collection('findings')
    .add(findingDoc);
    
  log(`💰 Finding stored: ${type} (EAL: $${ealEstimate.toLocaleString()})`);
  return docRef.id;
}

function mapToAttackType(findingType: string): string {
  const typeMap = {
    'exposed_api_key': 'SITE_HACK',
    'sql_injection': 'SITE_HACK', 
    'xss_vulnerability': 'SITE_HACK',
    'phishing_risk': 'PHISHING_BEC',
    'malware_detected': 'MALWARE',
    'accessibility_violation': 'ADA_COMPLIANCE',
    'ddos_vulnerability': 'DENIAL_OF_WALLET'
  };
  
  return typeMap[findingType] || 'SITE_HACK';
}

// Update scan status in Firestore
async function updateScanStatus(scanId: string, updates: {
  status?: string;
  progress?: number;
  current_module?: string;
  error_message?: string;
  total_findings?: number;
  max_severity?: string;
}): Promise<void> {
  try {
    const updateData: any = {
      ...updates,
      updated_at: new Date()
    };
    
    if (updates.status === 'completed') {
      updateData.completed_at = new Date();
    }
    
    await db.collection('scans').doc(scanId).update(updateData);
  } catch (error) {
    log(`❌ Failed to update scan ${scanId}:`, (error as Error).message);
  }
}

// Adapted module wrapper for Firestore
function createModuleWrapper(originalModule: Function) {
  return async ({ domain, scanId, companyName }: { domain: string; scanId: string; companyName?: string }) => {
    let findingsCount = 0;
    
    // Create adapter functions for the existing modules
    const firestoreAdapter = {
      async insertArtifact(artifact: any) {
        await storeArtifact({
          type: artifact.type,
          content: artifact.val_text || JSON.stringify(artifact),
          severity: artifact.severity,
          scanId,
          srcUrl: artifact.src_url,
          metadata: artifact.meta
        });
      },
      
      async insertFinding(finding: any) {
        await storeFinding({
          scanId,
          type: finding.finding_type,
          description: finding.description,
          recommendation: finding.recommendation,
          severity: finding.severity || 'MEDIUM',
          srcUrl: finding.src_url,
          metadata: finding.meta
        });
        findingsCount++;
      }
    };
    
    // Call original module with adapter
    try {
      await originalModule({ domain, scanId, companyName }, firestoreAdapter);
    } catch (error) {
      log(`Module error for ${domain}:`, error);
      await storeFinding({
        scanId,
        type: 'scan_error',
        description: `Module execution failed: ${(error as Error).message}`,
        recommendation: 'Review module configuration and retry scan',
        severity: 'MEDIUM'
      });
    }
    
    return findingsCount;
  };
}

// Tier-based module configuration
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

// Main scan processing function
async function processScan(job: ScanJob): Promise<void> {
  const { scanId, companyName, domain } = job;
  
  log(`🎯 Processing scan ${scanId} for ${companyName} (${domain})`);
  
  try {
    // Initialize scan
    await updateScanStatus(scanId, {
      status: 'processing',
      progress: 0,
      current_module: 'initialization'
    });
    
    const totalModules = TIER_1_MODULES.length;
    let completedModules = 0;
    let totalFindings = 0;
    let maxSeverity = 'LOW';
    
    // Run modules in parallel batches
    const modulePromises = [];
    
    if (TIER_1_MODULES.includes('shodan')) {
      modulePromises.push(
        createModuleWrapper(runShodanScan)({ domain, scanId, companyName })
      );
    }
    
    if (TIER_1_MODULES.includes('dns_twist')) {
      modulePromises.push(
        createModuleWrapper(runDnsTwist)({ domain, scanId })
      );
    }
    
    if (TIER_1_MODULES.includes('document_exposure')) {
      modulePromises.push(
        createModuleWrapper(runDocumentExposure)({ domain, scanId, companyName })
      );
    }
    
    if (TIER_1_MODULES.includes('endpoint_discovery')) {
      modulePromises.push(
        createModuleWrapper(runEndpointDiscovery)({ domain, scanId })
      );
    }
    
    if (TIER_1_MODULES.includes('tls_scan')) {
      modulePromises.push(
        createModuleWrapper(runTlsScan)({ domain, scanId })
      );
    }
    
    if (TIER_1_MODULES.includes('config_exposure')) {
      modulePromises.push(
        createModuleWrapper(runConfigExposureScanner)({ domain, scanId })
      );
    }
    
    // Execute all parallel modules
    const results = await Promise.allSettled(modulePromises);
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        totalFindings += result.value;
        completedModules++;
      } else {
        log(`❌ Module ${index} failed:`, result.reason);
      }
    });
    
    // Sequential modules that depend on previous results
    const sequentialModules = [
      { name: 'nuclei', fn: createModuleWrapper(runNuclei) },
      { name: 'tech_stack_scan', fn: createModuleWrapper(runTechStackScan) },
      { name: 'client_secret_scanner', fn: createModuleWrapper(runClientSecretScanner) }
    ];
    
    for (const module of sequentialModules) {
      if (TIER_1_MODULES.includes(module.name)) {
        await updateScanStatus(scanId, {
          current_module: module.name,
          progress: Math.floor((completedModules / totalModules) * 100)
        });
        
        try {
          const moduleFindings = await module.fn({ domain, scanId, companyName });
          totalFindings += moduleFindings;
          completedModules++;
          log(`✅ ${module.name} completed: ${moduleFindings} findings`);
        } catch (error) {
          log(`❌ ${module.name} failed:`, error);
        }
      }
    }
    
    // Determine max severity from findings
    const findingsSnapshot = await db
      .collection('scans')
      .doc(scanId)
      .collection('findings')
      .get();
      
    findingsSnapshot.docs.forEach(doc => {
      const severity = doc.data().severity;
      if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].indexOf(severity) > ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].indexOf(maxSeverity)) {
        maxSeverity = severity;
      }
    });
    
    // Mark scan as completed
    await updateScanStatus(scanId, {
      status: 'completed',
      progress: 100,
      current_module: undefined,
      total_findings: totalFindings,
      max_severity: maxSeverity
    });
    
    log(`✅ Scan ${scanId} completed: ${totalFindings} findings, max severity: ${maxSeverity}`);
    
  } catch (error) {
    log(`❌ Scan ${scanId} failed:`, error);
    
    await updateScanStatus(scanId, {
      status: 'failed',
      error_message: (error as Error).message
    });
    
    await storeFinding({
      scanId,
      type: 'scan_error',
      description: `Scan failed: ${(error as Error).message}`,
      recommendation: 'Review scan configuration and retry',
      severity: 'CRITICAL'
    });
  }
}

// Main worker entry point (for Cloud Run Jobs triggered by Pub/Sub)
async function main() {
  try {
    // Parse job from environment (Cloud Run Jobs get this from Pub/Sub trigger)
    const jobData = JSON.parse(process.env.JOB_DATA || '{}') as ScanJob;
    
    if (!jobData.scanId) {
      throw new Error('No scan job data provided');
    }
    
    log(`🚀 Worker starting for scan ${jobData.scanId}`);
    await processScan(jobData);
    log(`🏁 Worker completed for scan ${jobData.scanId}`);
    
  } catch (error) {
    log('💥 Worker failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processScan, storeArtifact, storeFinding };