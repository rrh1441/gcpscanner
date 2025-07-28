import { config } from 'dotenv';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { PubSub } from '@google-cloud/pubsub';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';

config();

const fastify = Fastify({ logger: true });

// Global service states
let app;
let db;
let pubsub;
let scanJobsTopic;
let servicesReady = false;

// Async initialization (non-blocking)
const initializeServices = async () => {
  try {
    log('🔄 Starting service initialization...');
    
    // Initialize Firebase Admin
    if (!app) {
      app = initializeApp();
      db = getFirestore(app);
      log('✅ Firebase initialized successfully');
    }

    // Initialize Pub/Sub
    if (!pubsub) {
      pubsub = new PubSub();
      scanJobsTopic = pubsub.topic('scan-jobs');
      log('✅ Pub/Sub initialized successfully');
    }

    servicesReady = true;
    log('🎉 All services initialized and ready');
    
  } catch (error) {
    log('❌ Service initialization failed:', error);
    // Retry after 5 seconds
    setTimeout(initializeServices, 5000);
  }
};

// Start initialization immediately but don't block server startup
initializeServices();

function log(...args: any[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

// Simple domain validation function
function normalizeDomain(rawDomain: string) {
  // Remove protocol and trailing slash
  const cleaned = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Basic validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return {
    isValid: domainRegex.test(cleaned),
    normalizedDomain: cleaned,
    validationErrors: domainRegex.test(cleaned) ? [] : ['Invalid domain format']
  };
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
    service: 'dealbrief-api-gcp',
    servicesReady,
    firebase: !!db,
    pubsub: !!scanJobsTopic
  };
});

// Readiness check
fastify.get('/ready', async (request, reply) => {
  if (servicesReady) {
    return { 
      status: 'ready', 
      timestamp: new Date().toISOString(),
      services: {
        firebase: !!db,
        pubsub: !!scanJobsTopic
      }
    };
  } else {
    reply.status(503);
    return { 
      status: 'not_ready', 
      timestamp: new Date().toISOString(),
      services: {
        firebase: !!db,
        pubsub: !!scanJobsTopic
      }
    };
  }
});

// Create scan endpoint
fastify.post('/scan', async (request, reply) => {
  try {
    if (!servicesReady || !db || !scanJobsTopic) {
      reply.status(503);
      return { 
        error: 'Service not ready - database or messaging not initialized',
        servicesReady,
        firebase: !!db,
        pubsub: !!scanJobsTopic
      };
    }

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