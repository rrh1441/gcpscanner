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

// Logging levels
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

const LOG_LEVEL = LogLevel.INFO; // Only show important info and errors

function log(level: LogLevel, ...args: any[]) {
  if (level <= LOG_LEVEL) {
    const timestamp = new Date().toISOString();
    const prefix = level === LogLevel.ERROR ? '❌' : level === LogLevel.WARN ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] [worker] ${prefix}`, ...args);
  }
}

function logError(...args: any[]) { log(LogLevel.ERROR, ...args); }
function logWarn(...args: any[]) { log(LogLevel.WARN, ...args); }
function logInfo(...args: any[]) { log(LogLevel.INFO, ...args); }
function logDebug(...args: any[]) { log(LogLevel.DEBUG, ...args); }

// Module completion summary
function logModuleCompletion(moduleName: string, findings: Array<{severity: string}>) {
  if (findings.length === 0) {
    logInfo(`✅ ${moduleName}: 0 findings`);
    return;
  }
  
  const severityCounts = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const summary = Object.entries(severityCounts)
    .map(([severity, count]) => `${count} ${severity.toLowerCase()}`)
    .join(', ');
    
  logInfo(`✅ ${moduleName}: ${findings.length} findings (${summary})`);
}

interface ScanJob {
  scanId: string;
  companyName: string;
  domain: string;
  originalDomain: string;
  tags: string[];
  createdAt: string;
}

// EAL calculation system based on financial methodology
interface EALData {
  finding_type: string;
  category: string;
  base_cost_low: number;
  base_cost_ml: number;
  base_cost_high: number;
  daily_cost: number;
  prevalence: number;
  calculation_method: 'STANDARD' | 'DAILY' | 'FIXED';
  notes: string;
}

// Load EAL data from methodology - this should be populated from CSV files
const EAL_DATABASE: { [key: string]: EALData } = {
  'ACCESSIBILITY_VIOLATION': {
    finding_type: 'ACCESSIBILITY_VIOLATION',
    category: 'Compliance',
    base_cost_low: 6000,
    base_cost_ml: 15000,
    base_cost_high: 30000,
    daily_cost: 0,
    prevalence: 0.02,
    calculation_method: 'FIXED',
    notes: 'Minor WCAG issues'
  },
  'API_KEY_EXPOSURE': {
    finding_type: 'API_KEY_EXPOSURE',
    category: 'Credential Exposure',
    base_cost_low: 40000,
    base_cost_ml: 100000,
    base_cost_high: 200000,
    daily_cost: 0,
    prevalence: 0.24,
    calculation_method: 'STANDARD',
    notes: 'API token leak'
  },
  'CLIENT_SECRET_EXPOSURE': {
    finding_type: 'CLIENT_SECRET_EXPOSURE',
    category: 'Credential Exposure',
    base_cost_low: 60000,
    base_cost_ml: 150000,
    base_cost_high: 300000,
    daily_cost: 0,
    prevalence: 0.24,
    calculation_method: 'STANDARD',
    notes: 'Server-side secrets'
  },
  'CLIENT_SIDE_SECRET_EXPOSURE': {
    finding_type: 'CLIENT_SIDE_SECRET_EXPOSURE',
    category: 'Credential Exposure',
    base_cost_low: 30000,
    base_cost_ml: 75000,
    base_cost_high: 150000,
    daily_cost: 0,
    prevalence: 0.24,
    calculation_method: 'STANDARD',
    notes: 'Secrets in JS'
  },
  'DATA_BREACH_EXPOSURE': {
    finding_type: 'DATA_BREACH_EXPOSURE', 
    category: 'Data Exposure',
    base_cost_low: 100000,
    base_cost_ml: 250000,
    base_cost_high: 500000,
    daily_cost: 0,
    prevalence: 0.40,
    calculation_method: 'STANDARD',
    notes: 'Customer data leak'
  },
  'DENIAL_OF_WALLET': {
    finding_type: 'DENIAL_OF_WALLET',
    category: 'Financial Risk',
    base_cost_low: 0,
    base_cost_ml: 0,
    base_cost_high: 0,
    daily_cost: 10000,
    prevalence: 0.35,
    calculation_method: 'DAILY',
    notes: 'Cloud resource abuse'
  },
  'EMAIL_SECURITY_GAP': {
    finding_type: 'EMAIL_SECURITY_GAP',
    category: 'Email Security',
    base_cost_low: 20000,
    base_cost_ml: 50000,
    base_cost_high: 100000,
    daily_cost: 0,
    prevalence: 0.15,
    calculation_method: 'STANDARD',
    notes: 'No DMARC / SPF'
  },
  'EXPOSED_SERVICE': {
    finding_type: 'EXPOSED_SERVICE',
    category: 'Infrastructure',
    base_cost_low: 6000,
    base_cost_ml: 15000,
    base_cost_high: 30000,
    daily_cost: 0,
    prevalence: 0.25,
    calculation_method: 'STANDARD',
    notes: 'Unneeded port open'
  },
  'MALICIOUS_TYPOSQUAT': {
    finding_type: 'MALICIOUS_TYROSQUAT',
    category: 'Brand Protection',
    base_cost_low: 60000,
    base_cost_ml: 125000,
    base_cost_high: 250000,
    daily_cost: 0,
    prevalence: 0.10,
    calculation_method: 'STANDARD',
    notes: 'Phishing/BEC staging'
  },
  'MISSING_TLS_CERTIFICATE': {
    finding_type: 'MISSING_TLS_CERTIFICATE',
    category: 'Configuration',
    base_cost_low: 8000,
    base_cost_ml: 20000,
    base_cost_high: 40000,
    daily_cost: 0,
    prevalence: 0.25,
    calculation_method: 'STANDARD',
    notes: 'No HTTPS'
  },
  'SUBDOMAIN_TAKEOVER': {
    finding_type: 'SUBDOMAIN_TAKEOVER',
    category: 'Infrastructure', 
    base_cost_low: 30000,
    base_cost_ml: 75000,
    base_cost_high: 150000,
    daily_cost: 0,
    prevalence: 0.25,
    calculation_method: 'STANDARD',
    notes: 'CNAME dangling'
  },
  'TLS_CONFIGURATION_ISSUE': {
    finding_type: 'TLS_CONFIGURATION_ISSUE',
    category: 'Configuration',
    base_cost_low: 5000,
    base_cost_ml: 12500,
    base_cost_high: 25000,
    daily_cost: 0,
    prevalence: 0.20,
    calculation_method: 'STANDARD',
    notes: 'Weak cipher'
  },
  'VERIFIED_CVE': {
    finding_type: 'VERIFIED_CVE',
    category: 'Vulnerability',
    base_cost_low: 24000,
    base_cost_ml: 60000,
    base_cost_high: 120000,
    daily_cost: 0,
    prevalence: 0.30,
    calculation_method: 'STANDARD', 
    notes: 'Exploitable CVE'
  }
};

// Severity multipliers from methodology
const SEVERITY_MULTIPLIERS: { [key: string]: number } = {
  'CRITICAL': 2.0,
  'HIGH': 1.5,
  'MEDIUM': 1.0,
  'LOW': 0.5,
  'INFO': 0.1
};

function calculateEAL(findingType: string, severity: string): number {
  // Map common scanner finding types to EAL database types
  const typeMapping: { [key: string]: string } = {
    'exposed_api_key': 'API_KEY_EXPOSURE',
    'weak_ssl_config': 'TLS_CONFIGURATION_ISSUE',
    'subdomain_takeover': 'SUBDOMAIN_TAKEOVER',
    'directory_listing': 'EXPOSED_SERVICE',
    'http_error': 'EXPOSED_SERVICE',
    'missing_security_header': 'TLS_CONFIGURATION_ISSUE',
    'connectivity_issue': 'EXPOSED_SERVICE',
    'scan_error': 'EXPOSED_SERVICE',
    'no_tls': 'MISSING_TLS_CERTIFICATE',
    'sql_injection': 'DATA_BREACH_EXPOSURE',
    'xss_vulnerability': 'DATA_BREACH_EXPOSURE',
    'exposed_admin_panel': 'EXPOSED_SERVICE'
  };

  const mappedType = typeMapping[findingType] || findingType.toUpperCase();
  const ealData = EAL_DATABASE[mappedType];
  
  if (!ealData) {
    // Fallback for unmapped types - use conservative estimate
    console.warn(`Unknown finding type for EAL calculation: ${findingType}`);
    return Math.round(15000 * (SEVERITY_MULTIPLIERS[severity] || 1.0));
  }

  const severityMultiplier = SEVERITY_MULTIPLIERS[severity] || 1.0;

  if (ealData.calculation_method === 'DAILY') {
    // For Denial of Wallet - return daily cost (they'd catch it quickly)
    const dailyCost = ealData.daily_cost * severityMultiplier;
    return Math.round(dailyCost);
  } else if (ealData.calculation_method === 'FIXED') {
    // For compliance issues - fixed costs with severity adjustment
    return Math.round(ealData.base_cost_ml * severityMultiplier);
  } else {
    // STANDARD calculation: base_cost_ml × prevalence × severity_multiplier
    return Math.round(ealData.base_cost_ml * ealData.prevalence * severityMultiplier);
  }
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
    
  logDebug(`Finding stored: ${type} (EAL: $${ealEstimate.toLocaleString()})`);
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
    logError(`Failed to update scan ${scanId}:`, (error as Error).message);
  }
}

// Simplified demo scan modules (replace with real ones later)
async function runBasicDomainScan({ domain, scanId }: { domain: string; scanId: string }): Promise<number> {
  let findingsCount = 0;
  
  try {
    logDebug(`Running basic scan for ${domain}`);
    
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
    
    // Module completion summary will be handled separately
    
  } catch (error) {
    logError(`Scan error for ${domain}:`, error);
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
  
  logInfo(`🎯 Processing scan ${scanId} for ${companyName} (${domain})`);
  
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
    
    // Scan completion logged by module
    
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
    
    logInfo(`✅ Scan ${scanId} completed: ${totalFindings} findings, max severity: ${maxSeverity}`);
    
    // Trigger report generation
    await triggerReportGeneration(scanId);
    
  } catch (error) {
    logError(`Scan ${scanId} failed:`, error);
    
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
    
    logInfo(`📋 Report generation triggered for scan ${scanId}`);
  } catch (error) {
    logError(`Failed to trigger report generation for ${scanId}:`, error);
  }
}

// Pub/Sub message handler for scan jobs
async function handleScanMessage(message: any): Promise<void> {
  try {
    const jobData = JSON.parse(message.data.toString()) as ScanJob;
    logInfo(`📨 Received scan job: ${jobData.scanId}`);
    
    await processScan(jobData);
    message.ack();
    
    logDebug(`Scan job ${jobData.scanId} completed and acknowledged`);
    
  } catch (error) {
    logError(`Failed to process scan message:`, error);
    message.nack();
  }
}

// Main worker entry point - listens to Pub/Sub for scan jobs
async function main() {
  try {
    logInfo('🚀 Scanner worker starting...');
    
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
      logInfo(`🌐 HTTP server listening on port ${port}`);
    });
    
    const subscription = pubsub.subscription('scan-jobs-subscription');
    
    // Configure subscription options - remove problematic options for now
    // subscription.setOptions({});
    
    // Set up message handler
    subscription.on('message', handleScanMessage);
    subscription.on('error', (error) => {
      logError('Subscription error:', error);
    });
    
    logInfo('👂 Listening for scan jobs on scan-jobs-subscription...');
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      logInfo('🛑 Received SIGINT, closing subscription...');
      await subscription.close();
      server.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logInfo('🛑 Received SIGTERM, closing subscription...');
      await subscription.close();
      server.close();
      process.exit(0);
    });
    
  } catch (error) {
    logError('💥 Worker startup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processScan, storeArtifact, storeFinding };