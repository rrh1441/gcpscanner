import { config } from 'dotenv';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { UpstashQueue } from '../workers/core/queue.js';
import { nanoid } from 'nanoid';
import { pool } from '../workers/core/artifactStore.js';
import { normalizeDomain } from '../workers/util/domainNormalizer.js';
import axios from 'axios';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });
const queue = new UpstashQueue(process.env.REDIS_URL!);

// Queue monitoring constants
const WORKER_GROUP = 'scanner_worker';
const POLL_INTERVAL_MS = 15_000; // 15 seconds

function log(...args: any[]) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

// Queue-depth-driven worker auto-scaling
async function getQueueDepth(): Promise<number> {
  try {
    const depth = await queue.redis.llen('scan.jobs');
    return depth || 0;
  } catch (error) {
    log('[queue-monitor] Error getting queue depth:', (error as Error).message);
    return 0;
  }
}

async function getRunningWorkers(): Promise<number> {
  try {
    const token = process.env.FLY_API_TOKEN;
    if (!token) {
      log('[queue-monitor] FLY_API_TOKEN not set – cannot detect running workers');
      return 0;
    }

    const APP = process.env.FLY_APP_NAME ?? 'dealbrief-scanner';
    const GROUP = 'scanner_worker';
    
    const response = await fetch(`https://api.machines.dev/v1/apps/${APP}/machines`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      log('[queue-monitor] Failed to fetch machines:', response.status, await response.text());
      return 0;
    }
    
    const machines = await response.json();
    const runningWorkers = machines.filter((m: any) => 
      m.process_group === GROUP && m.state === 'started'
    );
    
    log(`[queue-monitor] Found ${runningWorkers.length} running workers`);
    return runningWorkers.length;
  } catch (error) {
    log('[queue-monitor] Error getting running workers:', (error as Error).message);
    return 0;
  }
}

async function spawnWorkers(backlog: number): Promise<void> {
  const token = process.env.FLY_API_TOKEN;
  if (!token) {
    log('[queue-monitor] FLY_API_TOKEN missing – skipping scale');
    return;
  }

  const APP = process.env.FLY_APP_NAME ?? 'dealbrief-scanner';
  const GROUP = 'scanner_worker';
  const REGION = 'sea';
  const MAX_PAR = 10;
  const BASE_URL = `https://api.machines.dev/v1/apps/${APP}/machines`;
  const HDRS = { Authorization: `Bearer ${token}` };
  // Use the exact image that's currently running (injected by Fly)
  const WORKER_IMAGE = process.env.FLY_IMAGE_REF || 'registry.fly.io/dealbrief-scanner:latest';

  log(`[queue-monitor] Scaling to handle ${backlog} jobs...`);

  try {
    // 1 — list existing Machines
    const res = await fetch(BASE_URL, { headers: HDRS });
    if (!res.ok) {
      log('[queue-monitor] list failed', res.status, await res.text());
      return;
    }
    const all = await res.json();

    const isWorker = (m: any) => m.process_group === GROUP;
    const running = all.filter((m: any) => isWorker(m) && m.state === 'started');
    const stopped = all.filter((m: any) => isWorker(m) && m.state === 'stopped');

    const want = Math.min(backlog, MAX_PAR);        // cap parallelism
    const need = want - running.length;
    
    log(`[queue-monitor] Current: ${running.length} running, ${stopped.length} stopped, want ${want}, need ${need}`);
    
    if (need <= 0) {
      log('[queue-monitor] Already have enough workers');
      return;                          // already enough
    }

    // 2 — start stopped Machines first
    const toStart = Math.min(need, stopped.length);
    for (let i = 0; i < toStart; i++) {
      const m = stopped[i];
      const r = await fetch(`${BASE_URL}/${m.id}/start`, {
        method: 'POST', 
        headers: HDRS 
      });
      log(`[queue-monitor] start ${m.id}`, r.ok ? '✔︎' : `${r.status} ${await r.text()}`);
    }

    // 3 — create new machines if still needed (no template required!)
    const stillNeed = need - toStart;
    for (let i = 0; i < stillNeed; i++) {
      const machineConfig = {
        name: `scanner_worker_${Date.now()}_${i}`,
        region: REGION,
        config: {
          image: WORKER_IMAGE,
          guest: { cpu_kind: 'performance', cpus: 2, memory_mb: 4096 },
          env: { 
            FLY_PROCESS_GROUP: GROUP,
            AXE_MAX_PAGES: '3',
            AXE_SKIP_IF_UNCHANGED: 'true',
            NODE_TLS_REJECT_UNAUTHORIZED: '0',
            NUCLEI_BASELINE_TIMEOUT_MS: '8000',
            NUCLEI_CONCURRENCY: '48',
            NUCLEI_RETRIES: '0',
            NUCLEI_RUN_HEADLESS: 'false',
            PRIMARY_REGION: 'sea',
            SERPER_MAX_DOWNLOAD_BYTES: '0'
          },
          processes: [
            { cmd: ['npx', 'tsx', 'apps/workers/worker.ts'] }
          ],
          services: [
            {
              autostop: true,
              autostart: true,
              min_machines_running: 0
            }
          ],
          restart: { policy: 'on-failure', max_retries: 10 }
        }
      };

      const r = await fetch(BASE_URL, {
        method: 'POST',
        headers: { ...HDRS, 'Content-Type': 'application/json' },
        body: JSON.stringify(machineConfig)
      });
      
      if (r.ok) {
        const newMachine = await r.json();
        log(`[queue-monitor] ✅ Created new worker ${newMachine.id}`);
      } else {
        log(`[queue-monitor] ❌ Failed to create worker: ${r.status} ${await r.text()}`);
      }
    }

  } catch (error) {
    log('[queue-monitor] Error scaling workers:', (error as Error).message);
  }
}

async function shutdownWorkers(count: number): Promise<void> {
  // Let Fly handle worker shutdown automatically when idle
  // No need to manually stop workers - they'll auto-stop when no jobs
  log(`[queue-monitor] Letting Fly auto-shutdown ${count} idle workers...`);
}

// Queue monitoring cron job - runs every minute
async function queueMonitorCron(): Promise<void> {
  try {
    const queueDepth = await getQueueDepth();
    const runningWorkers = await getRunningWorkers();
    const neededWorkers = Math.min(queueDepth, 10); // Test limit: 10 workers

    log(`[queue-monitor] Queue: ${queueDepth} jobs, Workers: ${runningWorkers} running, ${neededWorkers} needed`);

    if (neededWorkers > runningWorkers) {
      await spawnWorkers(neededWorkers - runningWorkers);
    }

  } catch (error) {
    log('[queue-monitor] Error in monitoring:', (error as Error).message);
  }
}

// Legacy function - now handled by queue monitor
async function ensureScannerWorkerRunning(): Promise<void> {
  if (!process.env.FLY_API_TOKEN) {
    log('[api] FLY_API_TOKEN not set - cannot start workers, relying on auto-scaling');
    return;
  }
  
  const APP = process.env.FLY_APP_NAME || 'dealbrief-scanner';
  const BASE_URL = `https://api.machines.dev/v1/apps/${APP}/machines`;
  const HDRS = { Authorization: `Bearer ${process.env.FLY_API_TOKEN}` };
  
  try {
    // Get all scanner worker machines
    const response = await fetch(BASE_URL, { headers: HDRS });
    if (!response.ok) {
      log('[api] Failed to fetch machines for worker startup');
      return;
    }
    
    const machines = await response.json();
    const scannerWorkers = machines.filter((m: { process_group: string; state: string }) => 
      m.process_group === 'scanner_worker'
    );
    
    const running = scannerWorkers.filter((m: { state: string }) => m.state === 'started');
    const stopped = scannerWorkers.filter((m: { state: string }) => m.state === 'stopped');
    
    if (running.length > 0) {
      log(`[api] Scanner worker already running (${running.length} active)`);
      return;
    }
    
    if (stopped.length === 0) {
      log('[api] No scanner worker machines found - relying on Fly auto-scaling');
      return;
    }
    
    // Start the first stopped worker
    const workerToStart = stopped[0];
    log(`[api] Starting stopped scanner worker: ${workerToStart.id}`);
    
    const startResponse = await fetch(`${BASE_URL}/${workerToStart.id}/start`, {
      method: 'POST',
      headers: HDRS,
    });
    
    if (startResponse.ok) {
      log(`[api] ✅ Successfully started scanner worker ${workerToStart.id}`);
    } else {
      log(`[api] ❌ Failed to start scanner worker: ${startResponse.status} ${await startResponse.text()}`);
    }
    
  } catch (error) {
    log('[api] Error starting scanner worker:', (error as Error).message);
  }
}

// Register CORS for frontend access
fastify.register(fastifyCors, {
  origin: [
    'https://dealbriefadmin.vercel.app',
    'https://lfbi.vercel.app',
    /^https:\/\/.*\.lfbi\.vercel\.app$/, // Allow all subdomains of lfbi.vercel.app
    /^https:\/\/.*\.vercel\.app$/, // Allow preview deployments
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Register static file serving for the public directory
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'public'),
  prefix: '/', // serve files from root
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Create a new scan (main endpoint)
fastify.post('/scan', async (request, reply) => {
  try {
    const { companyName, domain: rawDomain, tags } = request.body as { companyName: string; domain: string; tags?: string[] };
    
    if (!companyName || !rawDomain) {
      log('[api] Scan creation failed: Missing required fields - companyName or domain');
      reply.status(400);
      return { error: 'Company name and domain are required' };
    }

    // Normalize and validate domain
    const validation = normalizeDomain(rawDomain);
    
    if (!validation.isValid) {
      log(`[api] Domain validation failed for ${rawDomain}: ${validation.validationErrors.join(', ')}`);
      reply.status(400);
      return { 
        error: 'Invalid domain format', 
        details: validation.validationErrors,
        suggestion: `Provided: "${rawDomain}", Expected format: "example.com"`
      };
    }

    const normalizedDomain = validation.normalizedDomain;
    const scanId = nanoid(11);
    
    // Validate scanId is a non-empty string
    if (!scanId || typeof scanId !== 'string' || scanId.trim().length === 0) {
      log('[api] CRITICAL: Failed to generate valid scanId');
      reply.status(500);
      return { error: 'Failed to generate scan ID', details: 'Internal server error during scan ID generation' };
    }
    
    const job = {
      id: scanId,
      companyName,
      domain: normalizedDomain,
      originalDomain: rawDomain,
      tags: tags || [],
      createdAt: new Date().toISOString()
    };

    log(`[api] Attempting to create scan job ${scanId} for ${companyName} (${normalizedDomain}) [original: ${rawDomain}]`);
    
    try {
      await queue.addJob(scanId, job);
      log(`[api] ✅ Successfully created scan job ${scanId} for ${companyName}`);
      
      // Ensure scanner worker is running to process the job
      await ensureScannerWorkerRunning();
    } catch (queueError) {
      log('[api] CRITICAL: Failed to add job to queue:', (queueError as Error).message);
      reply.status(500);
      return { 
        error: 'Failed to queue scan job', 
        details: `Queue operation failed: ${(queueError as Error).message}`,
        scanId: null
      };
    }

    return {
      scanId,
      status: 'queued',
      companyName,
      domain: normalizedDomain,
      originalDomain: rawDomain,
      message: 'Scan started successfully'
    };

  } catch (error) {
    log('[api] CRITICAL: Unexpected error in POST /scan:', (error as Error).message);
    log('[api] Error stack:', (error as Error).stack);
    reply.status(500);
    return { 
      error: 'Internal server error during scan creation', 
      details: (error as Error).message,
      scanId: null
    };
  }
});

// Create a new scan (alias for frontend compatibility)
fastify.post('/scans', async (request, reply) => {
  try {
    const { companyName, domain: rawDomain, tags } = request.body as { companyName: string; domain: string; tags?: string[] };
    
    if (!companyName || !rawDomain) {
      log('[api] Scan creation failed: Missing required fields - companyName or domain');
      reply.status(400);
      return { error: 'Company name and domain are required' };
    }

    // Normalize and validate domain
    const validation = normalizeDomain(rawDomain);
    
    if (!validation.isValid) {
      log(`[api] Domain validation failed for ${rawDomain}: ${validation.validationErrors.join(', ')}`);
      reply.status(400);
      return { 
        error: 'Invalid domain format', 
        details: validation.validationErrors,
        suggestion: `Provided: "${rawDomain}", Expected format: "example.com"`
      };
    }

    const normalizedDomain = validation.normalizedDomain;

    const scanId = nanoid(11);
    
    // Validate scanId is a non-empty string
    if (!scanId || typeof scanId !== 'string' || scanId.trim().length === 0) {
      log('[api] CRITICAL: Failed to generate valid scanId');
      reply.status(500);
      return { error: 'Failed to generate scan ID', details: 'Internal server error during scan ID generation' };
    }
    
    const job = {
      id: scanId,
      companyName,
      domain: normalizedDomain,
      originalDomain: rawDomain,
      tags: tags || [],
      createdAt: new Date().toISOString()
    };

    log(`[api] Attempting to create scan job ${scanId} for ${companyName} (${normalizedDomain}) [original: ${rawDomain}]`);
    
    try {
      await queue.addJob(scanId, job);
      log(`[api] ✅ Successfully created scan job ${scanId} for ${companyName}`);
      
      // Ensure scanner worker is running to process the job
      await ensureScannerWorkerRunning();
    } catch (queueError) {
      log('[api] CRITICAL: Failed to add job to queue:', (queueError as Error).message);
      reply.status(500);
      return { 
        error: 'Failed to queue scan job', 
        details: `Queue operation failed: ${(queueError as Error).message}`,
        scanId: null
      };
    }

    return {
      scanId,
      status: 'queued',
      companyName,
      domain: normalizedDomain,
      originalDomain: rawDomain,
      message: 'Scan started successfully'
    };

  } catch (error) {
    log('[api] CRITICAL: Unexpected error in POST /scans:', (error as Error).message);
    log('[api] Error stack:', (error as Error).stack);
    reply.status(500);
    return { 
      error: 'Internal server error during scan creation', 
      details: (error as Error).message,
      scanId: null
    };
  }
});

// Get scan status
fastify.get('/scan/:scanId/status', async (request, reply) => {
  const { scanId } = request.params as { scanId: string };
  
  const status = await queue.getStatus(scanId);
  
  if (!status) {
    reply.status(404);
    return { error: 'Scan not found' };
  }

  return {
    scanId,
    ...status
  };
});

// Get raw artifacts from scan
fastify.get('/scan/:scanId/artifacts', async (request, reply) => {
  const { scanId } = request.params as { scanId: string };
  
  try {
    log(`[api] Retrieving artifacts for scan: ${scanId}`);
    
    const artifactsResult = await pool.query(`
      SELECT id, type, val_text, severity, src_url, sha256, mime, created_at, meta
      FROM artifacts 
      WHERE meta->>'scan_id' = $1
      ORDER BY severity DESC, created_at DESC
    `, [scanId]);
    
    log(`[api] Found ${artifactsResult.rows.length} artifacts for scan ${scanId}`);
    
    if (artifactsResult.rows.length === 0) {
      reply.status(404);
      return { error: 'No artifacts found for this scan' };
    }

    return {
      scanId,
      artifacts: artifactsResult.rows,
      count: artifactsResult.rows.length,
      retrievedAt: new Date().toISOString()
    };
  } catch (error) {
    log('[api] Error retrieving artifacts:', (error as Error).message);
    reply.status(500);
    return { error: 'Failed to retrieve artifacts', details: (error as Error).message };
  }
});

// Get findings from scan
fastify.get('/scan/:scanId/findings', async (request, reply) => {
  const { scanId } = request.params as { scanId: string };
  
  try {
    log(`[api] Retrieving findings for scan: ${scanId}`);
    
    const findingsResult = await pool.query(`
      SELECT f.id, f.finding_type, f.description, f.recommendation, f.created_at,
             a.type as artifact_type, a.val_text, a.severity, a.src_url
      FROM findings f
      JOIN artifacts a ON f.artifact_id = a.id
      WHERE a.meta->>'scan_id' = $1
      ORDER BY a.severity DESC, f.created_at DESC
    `, [scanId]);
    
    log(`[api] Found ${findingsResult.rows.length} findings for scan ${scanId}`);
    
    if (findingsResult.rows.length === 0) {
      reply.status(404);
      return { error: 'No findings found for this scan' };
    }

    return {
      scanId,
      findings: findingsResult.rows,
      count: findingsResult.rows.length,
      retrievedAt: new Date().toISOString()
    };
  } catch (error) {
    log('[api] Error retrieving findings:', (error as Error).message);
    reply.status(500);
    return { error: 'Failed to retrieve findings', details: (error as Error).message };
  }
});

// Bulk scan endpoint for JSON arrays
fastify.post('/scan/bulk', async (request, reply) => {
  try {
    const { companies } = request.body as { companies: Array<{ companyName: string; domain: string; tags?: string[] }> };
    
    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      log('[api] Bulk scan failed: Missing or empty companies array');
      reply.status(400);
      return { error: 'Companies array is required and must not be empty' };
    }

    const results = [];
    const errors = [];

    for (const company of companies) {
      try {
        const { companyName, domain: rawDomain } = company;
        
        if (!companyName || !rawDomain) {
          errors.push({ 
            company, 
            error: 'Company name and domain are required',
            scanId: null 
          });
          continue;
        }

        // Normalize and validate domain
        const validation = normalizeDomain(rawDomain);
        
        if (!validation.isValid) {
          errors.push({ 
            company, 
            error: 'Invalid domain format',
            details: validation.validationErrors,
            scanId: null 
          });
          continue;
        }

        const normalizedDomain = validation.normalizedDomain;
        const scanId = nanoid(11);
        
        if (!scanId || typeof scanId !== 'string' || scanId.trim().length === 0) {
          errors.push({ 
            company, 
            error: 'Failed to generate scan ID',
            scanId: null 
          });
          continue;
        }
        
        const job = {
          id: scanId,
          companyName,
          domain: normalizedDomain,
          originalDomain: rawDomain,
          tags: company.tags || [],
          createdAt: new Date().toISOString()
        };

        await queue.addJob(scanId, job);
        
        results.push({
          scanId,
          status: 'queued',
          companyName,
          domain: normalizedDomain,
          originalDomain: rawDomain,
          message: 'Scan started successfully'
        });
        
        log(`[api] ✅ Successfully created bulk scan job ${scanId} for ${companyName}`);
        
      } catch (error) {
        errors.push({ 
          company, 
          error: 'Failed to create scan',
          details: (error as Error).message,
          scanId: null 
        });
      }
    }

    // Queue monitor will automatically scale workers based on queue depth

    return {
      total: companies.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    };

  } catch (error) {
    log('[api] Error in bulk scan:', (error as Error).message);
    reply.status(500);
    return { error: 'Failed to process bulk scan', details: (error as Error).message };
  }
});

// CSV upload endpoint
fastify.register(async function (fastify) {
  await fastify.register(import('@fastify/multipart'));
  
  fastify.post('/scan/csv', async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        reply.status(400);
        return { error: 'No file uploaded' };
      }
      
      if (!data.filename?.endsWith('.csv')) {
        reply.status(400);
        return { error: 'Only CSV files are allowed' };
      }
      
      const buffer = await data.toBuffer();
      const csvContent = buffer.toString('utf-8');
      
      // Enhanced CSV parsing (supports Company,Domain,Tags header)
      const lines = csvContent.split('\n').filter(line => line.trim());
      const companies = [];
      
      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',').map(part => part.trim().replace(/^"(.*)"$/, '$1'));
        if (parts.length >= 2) {
          const company: { companyName: string; domain: string; tags?: string[] } = {
            companyName: parts[0],
            domain: parts[1].replace(/^https?:\/\//, '').replace(/\/$/, '')
          };
          
          // Parse tags if provided (3rd column)
          if (parts.length >= 3 && parts[2].trim()) {
            company.tags = parts[2].split(';').map(tag => tag.trim()).filter(tag => tag);
          }
          
          companies.push(company);
        }
      }
      
      if (companies.length === 0) {
        reply.status(400);
        return { error: 'No valid companies found in CSV file' };
      }
      
      // Process the companies using the same logic as bulk endpoint
      const results = [];
      const errors = [];

      for (const company of companies) {
        try {
          const { companyName, domain: rawDomain } = company;
          
          if (!companyName || !rawDomain) {
            errors.push({ 
              company, 
              error: 'Company name and domain are required',
              scanId: null 
            });
            continue;
          }

          // Normalize and validate domain
          const validation = normalizeDomain(rawDomain);
          
          if (!validation.isValid) {
            errors.push({ 
              company, 
              error: 'Invalid domain format',
              details: validation.validationErrors,
              scanId: null 
            });
            continue;
          }

          const normalizedDomain = validation.normalizedDomain;
          const scanId = nanoid(11);
          
          if (!scanId || typeof scanId !== 'string' || scanId.trim().length === 0) {
            errors.push({ 
              company, 
              error: 'Failed to generate scan ID',
              scanId: null 
            });
            continue;
          }
          
          const job = {
            id: scanId,
            companyName,
            domain: normalizedDomain,
            originalDomain: rawDomain,
            tags: company.tags || [],
            createdAt: new Date().toISOString()
          };

          await queue.addJob(scanId, job);
          
          results.push({
            scanId,
            status: 'queued',
            companyName,
            domain: normalizedDomain,
            originalDomain: rawDomain,
            message: 'Scan started successfully'
          });
          
          log(`[api] ✅ Successfully created CSV scan job ${scanId} for ${companyName}`);
          
        } catch (error) {
          errors.push({ 
            company, 
            error: 'Failed to create scan',
            details: (error as Error).message,
            scanId: null 
          });
        }
      }

      // Queue monitor will automatically scale workers based on queue depth

      return {
        filename: data.filename,
        total: companies.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      };
      
    } catch (error) {
      log('[api] Error in CSV upload:', (error as Error).message);
      reply.status(500);
      return { error: 'Failed to process CSV file', details: (error as Error).message };
    }
  });
});

// API endpoint alias for frontend compatibility (/api/scans)
fastify.post('/api/scans', async (request, reply) => {
  try {
    const { companyName, domain: rawDomain, tags } = request.body as { companyName: string; domain: string; tags?: string[] };
    
    if (!companyName || !rawDomain) {
      log('[api] Scan creation failed: Missing required fields - companyName or domain');
      reply.status(400);
      return { error: 'Company name and domain are required' };
    }

    // Normalize and validate domain
    const validation = normalizeDomain(rawDomain);
    
    if (!validation.isValid) {
      log(`[api] Domain validation failed for ${rawDomain}: ${validation.validationErrors.join(', ')}`);
      reply.status(400);
      return { 
        error: 'Invalid domain format', 
        details: validation.validationErrors,
        suggestion: `Provided: "${rawDomain}", Expected format: "example.com"`
      };
    }

    const normalizedDomain = validation.normalizedDomain;

    const scanId = nanoid(11);
    
    if (!scanId || typeof scanId !== 'string' || scanId.trim().length === 0) {
      log('[api] CRITICAL: Failed to generate valid scanId');
      reply.status(500);
      return { error: 'Failed to generate scan ID', details: 'Internal server error during scan ID generation' };
    }
    
    const job = {
      id: scanId,
      companyName,
      domain: normalizedDomain,
      originalDomain: rawDomain,
      tags: tags || [],
      createdAt: new Date().toISOString()
    };

    log(`[api] Attempting to create scan job ${scanId} for ${companyName} (${normalizedDomain}) [original: ${rawDomain}] via /api/scans`);
    
    try {
      await queue.addJob(scanId, job);
      log(`[api] ✅ Successfully created scan job ${scanId} for ${companyName} via /api/scans`);
    } catch (queueError) {
      log('[api] CRITICAL: Failed to add job to queue:', (queueError as Error).message);
      reply.status(500);
      return { 
        error: 'Failed to queue scan job', 
        details: `Queue operation failed: ${(queueError as Error).message}`,
        scanId: null
      };
    }

    return {
      scanId,
      status: 'queued',
      companyName,
      domain: normalizedDomain,
      originalDomain: rawDomain,
      message: 'Scan started successfully'
    };

  } catch (error) {
    log('[api] CRITICAL: Unexpected error in POST /api/scans:', (error as Error).message);
    log('[api] Error stack:', (error as Error).stack);
    reply.status(500);
    return { 
      error: 'Internal server error during scan creation', 
      details: (error as Error).message,
      scanId: null
    };
  }
});

// API endpoint for getting scan status (/api/scans/{scanId})
fastify.get('/api/scans/:scanId', async (request, reply) => {
  const { scanId } = request.params as { scanId: string };
  
  try {
    const status = await queue.getStatus(scanId);
    
    if (!status) {
      reply.status(404);
      return { error: 'Scan not found' };
    }

    return {
      scanId,
      ...status
    };
  } catch (error) {
    log('[api] Error retrieving scan status via /api/scans:', (error as Error).message);
    reply.status(500);
    return { error: 'Failed to retrieve scan status', details: (error as Error).message };
  }
});

// Manual sync trigger endpoint (for troubleshooting)
fastify.post('/admin/sync', async (request, reply) => {
  try {
    // This endpoint can be used to manually trigger sync worker restart
    return {
      message: 'Sync trigger endpoint - restart sync worker manually via fly machine restart',
      timestamp: new Date().toISOString(),
      instructions: 'Use: fly machine restart 148e212fe19238'
    };
  } catch (error) {
    log('[api] Error in /admin/sync:', (error as Error).message);
    reply.status(500);
    return { error: 'Failed to trigger sync', details: (error as Error).message };
  }
});

// Debug endpoint to manually trigger queue monitor
fastify.post('/admin/debug-queue', async (request, reply) => {
  try {
    log('[api] Manual queue monitor trigger requested');
    
    const queueDepth = await getQueueDepth();
    const runningWorkers = await getRunningWorkers();
    const neededWorkers = Math.min(queueDepth, 10);
    
    log(`[api] DEBUG - Queue: ${queueDepth} jobs, Workers: ${runningWorkers} running, ${neededWorkers} needed`);
    
    let result = {
      queueDepth,
      runningWorkers,
      neededWorkers,
      action: 'none',
      error: null as string | null
    };
    
    if (neededWorkers > runningWorkers) {
      result.action = `spawn ${neededWorkers - runningWorkers} workers`;
      try {
        await spawnWorkers(neededWorkers - runningWorkers);
        log('[api] DEBUG - Successfully spawned workers');
      } catch (error) {
        result.error = (error as Error).message;
        log('[api] DEBUG - Error spawning workers:', (error as Error).message);
      }
    }
    
    return result;
  } catch (error) {
    log('[api] Error in debug queue trigger:', (error as Error).message);
    reply.status(500);
    return { error: 'Failed to debug queue', details: (error as Error).message };
  }
});

// Debug endpoint to see actual machine data
fastify.get('/admin/debug-machines', async (request, reply) => {
  try {
    const token = process.env.FLY_API_TOKEN;
    if (!token) {
      return { error: 'No FLY_API_TOKEN' };
    }

    const APP = process.env.FLY_APP_NAME ?? 'dealbrief-scanner';
    const response = await fetch(`https://api.machines.dev/v1/apps/${APP}/machines`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      return { error: 'Failed to fetch machines', status: response.status };
    }
    
    const machines = await response.json();
    
    // Return the first scanner_worker machine data for debugging
    const scannerMachine = machines.find((m: any) => m.id === '286565eb5406d8');
    
    return {
      total_machines: machines.length,
      scanner_machine: scannerMachine ? {
        id: scannerMachine.id,
        state: scannerMachine.state,
        config_processes: scannerMachine.config?.processes,
        config_metadata: scannerMachine.config?.metadata,
        config_env: scannerMachine.config?.env,
        full_config: scannerMachine.config
      } : 'not found'
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
});

// Webhook callback endpoint (for future use)
fastify.post('/scan/:id/callback', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    log('[api] Received callback for scan', id);
    return { received: true };
  } catch (error) {
    log('[api] Error handling callback:', (error as Error).message);
    return reply.status(500).send({ error: 'Callback failed' });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    log('[api] Server listening on port 3000');
    
    // Start queue monitoring in the API process
    log('[api] Starting queue monitoring every 15 seconds');
    setInterval(queueMonitorCron, POLL_INTERVAL_MS);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
