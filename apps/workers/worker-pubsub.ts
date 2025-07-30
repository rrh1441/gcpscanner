// Pub/Sub adapter for the existing worker
import { config } from 'dotenv';
import { PubSub } from '@google-cloud/pubsub';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import express from 'express';
import { processScan } from './worker.js';

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

// Handle Pub/Sub messages
async function handleMessage(message: any) {
  try {
    const data = JSON.parse(message.data.toString());
    
    log('INFO', 'Received Pub/Sub message', { scanId: data.scanId });
    
    // Update Firestore
    await db.collection('scans').doc(data.scanId).update({
      status: 'processing',
      updated_at: new Date()
    });
    
    // Process using existing logic
    await processScan({
      id: data.scanId,
      companyName: data.companyName,
      domain: data.domain,
      createdAt: data.createdAt
    });
    
    // Update Firestore completion
    await db.collection('scans').doc(data.scanId).update({
      status: 'completed',
      completed_at: new Date()
    });
    
    // Trigger report generation
    await pubsub.topic('report-generation').publishMessage({
      json: { scanId: data.scanId }
    });
    
    message.ack();
  } catch (error) {
    log('ERROR', 'Failed to process message', { 
      error: (error as Error).message 
    });
    message.nack();
  }
}

// Start HTTP server for health checks
const server = express();
server.get('/health', (req, res) => res.json({ status: 'healthy' }));
server.listen(process.env.PORT || 8080);

// Subscribe to Pub/Sub
const subscription = pubsub.subscription('scan-jobs-subscription');
subscription.on('message', handleMessage);

log('INFO', 'Pub/Sub worker started', { 
  subscription: 'scan-jobs-subscription' 
});