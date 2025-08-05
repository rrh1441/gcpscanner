// Pub/Sub adapter for the existing worker
import { config } from 'dotenv';
import { PubSub } from '@google-cloud/pubsub';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import express from 'express';
import { processScan } from './worker.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

config();

// Only initialize if running in GCP
const isGCP = process.env.K_SERVICE || process.env.CLOUD_RUN_JOB;

if (!isGCP) {
  console.log('Not running in GCP, exiting Pub/Sub adapter');
  process.exit(0);
}

const app = initializeApp();
const db = getFirestore(app);
const pubsub = new PubSub();

// Structured logging for GCP
function log(severity: 'ERROR' | 'INFO', message: string, context: object = {}) {
  console.log(JSON.stringify({
    severity,
    message,
    timestamp: new Date().toISOString(),
    ...context
  }));
}

// Validate security tools at startup
async function validateSecurityTools() {
  const requiredTools = [
    { name: 'sslscan', command: 'sslscan --version' },
    { name: 'nuclei', command: 'nuclei --version' },
    { name: 'trufflehog', command: 'trufflehog --version' },
    { name: 'nmap', command: 'nmap --version' },
    { name: 'python3', command: 'python3 --version' }
  ];

  const missingTools: string[] = [];
  const availableTools: string[] = [];

  for (const tool of requiredTools) {
    try {
      await execAsync(tool.command);
      availableTools.push(tool.name);
      log('INFO', `Tool validation passed: ${tool.name}`);
    } catch (error) {
      missingTools.push(tool.name);
      log('ERROR', `Tool validation failed: ${tool.name}`, { 
        error: (error as Error).message 
      });
    }
  }

  log('INFO', 'Tool validation completed', {
    available: availableTools,
    missing: missingTools,
    total: requiredTools.length
  });

  // Continue even with missing tools for graceful degradation
  if (missingTools.length > 0) {
    log('INFO', `Starting with ${availableTools.length}/${requiredTools.length} tools available`);
  }
}

// Handle Pub/Sub messages
async function handleMessage(message: any) {
  let scanId: string | undefined;
  
  try {
    const data = JSON.parse(message.data.toString());
    scanId = data.scanId;
    
    // Validate required fields
    if (!scanId || !data.companyName || !data.domain) {
      log('ERROR', 'Invalid message format', { data });
      message.ack(); // Acknowledge to prevent redelivery of bad messages
      return;
    }
    
    log('INFO', 'Received Pub/Sub message', { 
      scanId,
      companyName: data.companyName,
      domain: data.domain 
    });
    
    // Update Firestore
    await db.collection('scans').doc(scanId).update({
      status: 'processing',
      updated_at: new Date(),
      worker_id: process.env.K_REVISION || 'unknown'
    });
    
    // Process using existing logic
    await processScan({
      scanId: data.scanId,
      companyName: data.companyName,
      domain: data.domain,
      createdAt: data.createdAt
    });
    
    // Update Firestore completion
    await db.collection('scans').doc(scanId).update({
      status: 'completed',
      completed_at: new Date(),
      total_findings: 0 // Will be updated by processScan
    });
    
    // Trigger report generation
    await pubsub.topic('report-generation').publishMessage({
      json: { 
        scanId,
        companyName: data.companyName,
        domain: data.domain 
      }
    });
    
    log('INFO', 'Successfully processed scan', { scanId });
    message.ack();
  } catch (error) {
    log('ERROR', 'Failed to process message', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      scanId
    });
    
    // Update Firestore with failure status if we have a scanId
    if (scanId) {
      try {
        await db.collection('scans').doc(scanId).update({
          status: 'failed',
          error: (error as Error).message,
          failed_at: new Date()
        });
      } catch (updateError) {
        log('ERROR', 'Failed to update scan status', { 
          scanId,
          error: (updateError as Error).message 
        });
      }
    }
    
    // Nack the message to retry later
    message.nack();
  }
}

// Start HTTP server for health checks
const server = express();
server.get('/health', (req, res) => res.json({ status: 'healthy' }));
server.listen(process.env.PORT || 8080);

// Configure subscription with proper acknowledgment deadline
const subscription = pubsub.subscription('scan-jobs-subscription', {
  flowControl: {
    maxMessages: 1, // Process one scan at a time
    allowExcessMessages: false
  }
});

// Note: Ack deadline is configured on the subscription itself in GCP Console
// or via gcloud: gcloud pubsub subscriptions update scan-jobs-subscription --ack-deadline=600

// Initialize worker
async function initializeWorker() {
  log('INFO', 'Initializing Pub/Sub worker');
  
  // Validate security tools
  await validateSecurityTools();
  
  // Set up subscription listeners
  subscription.on('message', handleMessage);
  subscription.on('error', (error) => {
    log('ERROR', 'Subscription error', { error: error.message });
  });

  log('INFO', 'Pub/Sub worker started', { 
    subscription: 'scan-jobs-subscription',
    ackDeadline: 600,
    maxMessages: 1
  });
}

// Start the worker
initializeWorker().catch((error) => {
  log('ERROR', 'Failed to initialize worker', { error: error.message });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  log('INFO', 'SIGTERM received, closing subscription');
  await subscription.close();
  process.exit(0);
});