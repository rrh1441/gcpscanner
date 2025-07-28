import { config } from 'dotenv';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';
import { PubSub } from '@google-cloud/pubsub';
import express from 'express';

// Simplified scan modules - we'll implement basic versions that work
// TODO: Import actual modules once dependencies are resolved

config();

// Initialize Firebase, GCS, and Pub/Sub
const app = initializeApp();
const db = getFirestore(app);
const storage = new Storage();
const pubsub = new PubSub();
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
const COST_MAP: Record<string, { base: number; multiplier: number }> = {
  'exposed_api_key': { base: 25000, multiplier: 1.2 },
  'sql_injection': { base: 50000, multiplier: 1.5 },
  'xss_vulnerability': { base: 15000, multiplier: 1.1 },
  'exposed_admin_panel': { base: 30000, multiplier: 1.3 },
  'weak_ssl_config': { base: 8000, multiplier: 1.0 },
  'subdomain_takeover': { base: 40000, multiplier: 1.4 },
  'directory_listing': { base: 5000, multiplier: 0.8 },
  'http_error': { base: 2000, multiplier: 0.5 },
  'missing_security_header': { base: 5000, multiplier: 0.8 },
  'connectivity_issue': { base: 15000, multiplier: 1.2 },
  'scan_error': { base: 1000, multiplier: 0.3 },
  'default': { base: 10000, multiplier: 1.0 }
};

function calculateEAL(findingType: string, severity: string): number {
  const costInfo = COST_MAP[findingType] || COST_MAP['default'];
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
  const typeMap: Record<string, string> = {
    'exposed_api_key': 'SITE_HACK',
    'sql_injection': 'SITE_HACK', 
    'xss_vulnerability': 'SITE_HACK',
    'phishing_risk': 'PHISHING_BEC',
    'malware_detected': 'MALWARE',
    'accessibility_violation': 'ADA_COMPLIANCE',
    'ddos_vulnerability': 'DENIAL_OF_WALLET',
    'http_error': 'SITE_HACK',
    'missing_security_header': 'SITE_HACK',
    'connectivity_issue': 'SITE_HACK',
    'scan_error': 'SITE_HACK'
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

// Simplified demo scan modules (replace with real ones later)
async function runBasicDomainScan({ domain, scanId }: { domain: string; scanId: string }): Promise<number> {
  let findingsCount = 0;
  
  try {
    log(`🔍 Running basic scan for ${domain}`);
    
    // Demo finding 1: Basic HTTP check
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`https://${domain}`, { 
        method: 'HEAD', 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        await storeFinding({
          scanId,
          type: 'http_error',
          description: `HTTP request to ${domain} returned status ${response.status}`,
          recommendation: 'Investigate server configuration and ensure proper HTTP responses',
          severity: 'LOW'
        });
        findingsCount++;
      }
      
      // Check for security headers
      const securityHeaders = ['strict-transport-security', 'x-frame-options', 'x-content-type-options'];
      for (const header of securityHeaders) {
        if (!response.headers.get(header)) {
          await storeFinding({
            scanId,
            type: 'missing_security_header',
            description: `Missing security header: ${header}`,
            recommendation: `Add ${header} header to improve security`,
            severity: 'MEDIUM'
          });
          findingsCount++;
        }
      }
      
    } catch (error) {
      await storeFinding({
        scanId,
        type: 'connectivity_issue',
        description: `Unable to connect to ${domain}: ${(error as Error).message}`,
        recommendation: 'Verify domain is accessible and properly configured',
        severity: 'HIGH'
      });
      findingsCount++;
    }
    
    log(`✅ Basic scan completed for ${domain}: ${findingsCount} findings`);
    
  } catch (error) {
    log(`❌ Scan error for ${domain}:`, error);
    await storeFinding({
      scanId,
      type: 'scan_error',
      description: `Scan failed: ${(error as Error).message}`,
      recommendation: 'Review scan configuration and retry',
      severity: 'MEDIUM'
    });
    findingsCount++;
  }
  
  return findingsCount;
}

// Simplified module configuration for initial deployment
const AVAILABLE_MODULES = [
  'basic_domain_scan'
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
    
    const totalModules = AVAILABLE_MODULES.length;
    let completedModules = 0;
    let totalFindings = 0;
    let maxSeverity = 'LOW';
    
    // Run simplified scan modules
    await updateScanStatus(scanId, {
      current_module: 'basic_domain_scan',
      progress: 10
    });
    
    const basicScanFindings = await runBasicDomainScan({ domain, scanId });
    totalFindings += basicScanFindings;
    completedModules++;
    
    log(`✅ Basic domain scan completed: ${basicScanFindings} findings`);
    
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
    
    // Trigger report generation
    await triggerReportGeneration(scanId);
    
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

// Trigger report generation via Pub/Sub
async function triggerReportGeneration(scanId: string): Promise<void> {
  try {
    const reportTopic = pubsub.topic('report-generation');
    const message = {
      scanId,
      timestamp: new Date().toISOString()
    };
    
    await reportTopic.publishMessage({ 
      json: message 
    });
    
    log(`📋 Report generation triggered for scan ${scanId}`);
  } catch (error) {
    log(`❌ Failed to trigger report generation for ${scanId}:`, error);
  }
}

// Pub/Sub message handler for scan jobs
async function handleScanMessage(message: any): Promise<void> {
  try {
    const jobData = JSON.parse(message.data.toString()) as ScanJob;
    log(`📨 Received scan job: ${jobData.scanId}`);
    
    await processScan(jobData);
    message.ack();
    
    log(`✅ Scan job ${jobData.scanId} completed and acknowledged`);
    
  } catch (error) {
    log(`❌ Failed to process scan message:`, error);
    message.nack();
  }
}

// Main worker entry point - listens to Pub/Sub for scan jobs
async function main() {
  try {
    log('🚀 Scanner worker starting...');
    
    // Start HTTP server for Cloud Run health checks
    const app = express();
    const port = process.env.PORT || 8080;
    
    app.get('/', (req, res) => {
      res.json({ status: 'Scanner worker is running', timestamp: new Date().toISOString() });
    });
    
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy' });
    });
    
    const server = app.listen(port, () => {
      log(`🌐 HTTP server listening on port ${port}`);
    });
    
    const subscription = pubsub.subscription('scan-jobs-subscription');
    
    // Configure subscription options - remove problematic options for now
    // subscription.setOptions({});
    
    // Set up message handler
    subscription.on('message', handleScanMessage);
    subscription.on('error', (error) => {
      log('❌ Subscription error:', error);
    });
    
    log('👂 Listening for scan jobs on scan-jobs-subscription...');
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      log('🛑 Received SIGINT, closing subscription...');
      await subscription.close();
      server.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      log('🛑 Received SIGTERM, closing subscription...');
      await subscription.close();
      server.close();
      process.exit(0);
    });
    
  } catch (error) {
    log('💥 Worker startup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processScan, storeArtifact, storeFinding };