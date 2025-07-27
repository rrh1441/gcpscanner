import { config } from 'dotenv';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { PubSub } from '@google-cloud/pubsub';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';
import { normalizeDomain } from '../workers/util/domainNormalizer.js';

config();

const fastify = Fastify({ logger: true });

// Initialize Firebase Admin (uses Application Default Credentials in GCP)
const app = initializeApp();
const db = getFirestore(app);

// Initialize Pub/Sub
const pubsub = new PubSub();
const scanJobsTopic = pubsub.topic('scan-jobs');

function log(...args: any[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

// CORS configuration
fastify.register(fastifyCors, {
  origin: [
    'https://dealbriefadmin.vercel.app',
    'https://lfbi.vercel.app',
    /^https:\/\/.*\.lfbi\.vercel\.app$/,
    /^https:\/\/.*\.vercel\.app$/,
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'dealbrief-api-gcp'
  };
});

// Create scan endpoint
fastify.post('/scan', async (request, reply) => {
  try {
    const { companyName, domain: rawDomain, tags } = request.body as { 
      companyName: string; 
      domain: string; 
      tags?: string[] 
    };
    
    if (!companyName || !rawDomain) {
      reply.status(400);
      return { error: 'Company name and domain are required' };
    }

    // Validate domain
    const validation = normalizeDomain(rawDomain);
    if (!validation.isValid) {
      reply.status(400);
      return { 
        error: 'Invalid domain format', 
        details: validation.validationErrors
      };
    }

    const scanId = nanoid(11);
    const normalizedDomain = validation.normalizedDomain;
    
    // Create scan document in Firestore
    const scanDoc = {
      scan_id: scanId,
      company_name: companyName,
      domain: normalizedDomain,
      original_domain: rawDomain,
      status: 'queued',
      progress: 0,
      tags: tags || [],
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('scans').doc(scanId).set(scanDoc);
    
    // Publish job to Pub/Sub
    const jobPayload = {
      scanId,
      companyName,
      domain: normalizedDomain,
      originalDomain: rawDomain,
      tags: tags || [],
      createdAt: new Date().toISOString()
    };

    const messageBuffer = Buffer.from(JSON.stringify(jobPayload));
    await scanJobsTopic.publishMessage({ data: messageBuffer });
    
    log(`✅ Scan ${scanId} queued for ${companyName} (${normalizedDomain})`);

    return {
      scanId,
      status: 'queued',
      companyName,
      domain: normalizedDomain,
      message: 'Scan started successfully'
    };

  } catch (error) {
    log('❌ Error creating scan:', (error as Error).message);
    reply.status(500);
    return { 
      error: 'Internal server error', 
      details: (error as Error).message 
    };
  }
});

// Get scan status
fastify.get('/scan/:scanId/status', async (request, reply) => {
  try {
    const { scanId } = request.params as { scanId: string };
    
    const scanDoc = await db.collection('scans').doc(scanId).get();
    
    if (!scanDoc.exists) {
      reply.status(404);
      return { error: 'Scan not found' };
    }

    return {
      scanId,
      ...scanDoc.data()
    };
  } catch (error) {
    reply.status(500);
    return { error: 'Failed to retrieve scan status' };
  }
});

// Get scan findings
fastify.get('/scan/:scanId/findings', async (request, reply) => {
  try {
    const { scanId } = request.params as { scanId: string };
    
    const findingsSnapshot = await db
      .collection('scans')
      .doc(scanId)
      .collection('findings')
      .orderBy('created_at', 'desc')
      .get();
    
    if (findingsSnapshot.empty) {
      reply.status(404);
      return { error: 'No findings found for this scan' };
    }

    const findings = findingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      scanId,
      findings,
      count: findings.length
    };
  } catch (error) {
    reply.status(500);
    return { error: 'Failed to retrieve findings' };
  }
});

// Bulk scan endpoint
fastify.post('/scan/bulk', async (request, reply) => {
  try {
    const { companies } = request.body as { 
      companies: Array<{ companyName: string; domain: string; tags?: string[] }> 
    };
    
    if (!companies || !Array.isArray(companies)) {
      reply.status(400);
      return { error: 'Companies array is required' };
    }

    const results = [];
    const errors = [];

    // Process in batch
    for (const company of companies) {
      try {
        const { companyName, domain: rawDomain } = company;
        
        if (!companyName || !rawDomain) {
          errors.push({ company, error: 'Missing required fields' });
          continue;
        }

        const validation = normalizeDomain(rawDomain);
        if (!validation.isValid) {
          errors.push({ company, error: 'Invalid domain format' });
          continue;
        }

        const scanId = nanoid(11);
        const normalizedDomain = validation.normalizedDomain;
        
        // Create Firestore document
        const scanDoc = {
          scan_id: scanId,
          company_name: companyName,
          domain: normalizedDomain,
          original_domain: rawDomain,
          status: 'queued',
          progress: 0,
          tags: company.tags || [],
          created_at: new Date(),
          updated_at: new Date()
        };

        await db.collection('scans').doc(scanId).set(scanDoc);
        
        // Publish to Pub/Sub
        const jobPayload = {
          scanId,
          companyName,
          domain: normalizedDomain,
          originalDomain: rawDomain,
          tags: company.tags || [],
          createdAt: new Date().toISOString()
        };

        const messageBuffer = Buffer.from(JSON.stringify(jobPayload));
        await scanJobsTopic.publishMessage({ data: messageBuffer });
        
        results.push({
          scanId,
          status: 'queued',
          companyName,
          domain: normalizedDomain
        });
        
      } catch (error) {
        errors.push({ 
          company, 
          error: 'Failed to create scan',
          details: (error as Error).message
        });
      }
    }

    return {
      total: companies.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    };

  } catch (error) {
    reply.status(500);
    return { error: 'Failed to process bulk scan' };
  }
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '8080');
    await fastify.listen({ port, host: '0.0.0.0' });
    log(`🚀 API Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();