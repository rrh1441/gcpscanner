import Fastify from 'fastify';
import { executeScan, ScanJob } from './scan/executeScan.js';
import { CloudTasksClient } from '@google-cloud/tasks';
import * as crypto from 'node:crypto';

type PubSubMessage = {
  message?: { data?: string };
  subscription?: string;
};

function parseBase64Json<T>(b64?: string): T | null {
  if (!b64) return null;
  try {
    const decoded = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

async function enqueueScanTask(job: ScanJob): Promise<void> {
  const project = process.env.GCP_PROJECT ?? '';
  const location = process.env.GCP_LOCATION ?? 'us-central1';
  const queue = process.env.TASKS_QUEUE ?? 'scan-queue';
  const url = process.env.TASKS_WORKER_URL ?? ''; // e.g., https://<service-url>/tasks/scan
  const serviceAccount = process.env.SCAN_WORKER_SA ?? '';

  if (!project || !url) {
    throw new Error('Missing GCP_PROJECT or TASKS_WORKER_URL');
  }

  const client = new CloudTasksClient();
  const parent = client.queuePath(project, location, queue);

  const payload = JSON.stringify(job);

  // Create idempotent task name using scan_id
  const taskName = `${parent}/tasks/${job.scan_id}-${Date.now()}`;

  const task = {
    name: taskName,
    httpRequest: {
      httpMethod: 'POST' as const,
      url,
      headers: { 'Content-Type': 'application/json' },
      body: Buffer.from(payload),
      // Add OIDC token for authentication
      ...(serviceAccount && {
        oidcToken: { 
          serviceAccountEmail: serviceAccount,
          audience: url.split('/').slice(0, 3).join('/')  // Extract base URL as audience
        }
      }),
    },
    scheduleTime: { seconds: Math.floor(Date.now() / 1000) }, // immediate
  };

  try {
    await client.createTask({
      parent,
      task,
    });
  } catch (err: any) {
    // If task already exists (idempotency), that's OK
    if (err.code === 6) { // ALREADY_EXISTS
      console.log(`Task ${taskName} already exists, skipping`);
    } else {
      throw err;
    }
  }
}

export function buildServer() {
  const app = Fastify({ 
    logger: {
      level: 'info'
    }
  });

  // Health — NO external calls
  app.get('/', async () => ({ status: 'ok', ts: Date.now() }));

  // Debug endpoint to test IPv6 hypothesis
  app.get('/debug/network-test', async (request, reply) => {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const domain = (request.query as any)?.domain || 'openai.com';
    
    const curlTest = async (ipVersion: string) => {
      try {
        const { stdout, stderr } = await execAsync(
          `curl -${ipVersion} --connect-timeout 5 -s -o /dev/null -w '%{http_code} | %{time_total}s | %{remote_ip}' https://${domain}`,
          { timeout: 6000 }
        );
        return { success: true, result: stdout, stderr };
      } catch (error: any) {
        return { success: false, error: error.message, stderr: error.stderr };
      }
    };

    const [ipv4, ipv6] = await Promise.all([curlTest('4'), curlTest('6')]);
    
    return { 
      domain,
      ipv4_result: ipv4, 
      ipv6_result: ipv6,
      timestamp: new Date().toISOString()
    };
  });

  // --- Eventarc/PubSub push endpoint: FAST-ACK ---
  // Eventarc delivers a Pub/Sub-style envelope with { message: { data: base64(json) } }
  app.post<{ Body: PubSubMessage }>('/events', async (req, reply) => {
    const body = req.body;
    
    // Validate Pub/Sub message structure
    if (!body || typeof body !== 'object' || !body.message) {
      console.warn('Invalid Pub/Sub envelope structure:', body);
      return reply.code(204).send(); // ack to avoid redelivery
    }
    
    // Parse the base64-encoded message data
    const msg = parseBase64Json<ScanJob>(body.message.data);
    
    // Validate the scan job payload
    if (!msg || typeof msg !== 'object' || !msg.domain || typeof msg.domain !== 'string') {
      console.warn('Invalid scan job payload:', {
        subscription: body.subscription,
        messageData: body.message.data,
        parsed: msg 
      });
      return reply.code(204).send(); // ack to avoid redelivery loop
    }
    
    // Validate domain format (basic check)
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainRegex.test(msg.domain)) {
      console.warn('Invalid domain format:', msg.domain);
      return reply.code(204).send();
    }

    // Ensure scan_id is valid
    const scan_id = msg.scan_id && msg.scan_id.length > 0 ? msg.scan_id : crypto.randomUUID();
    const job: ScanJob = { 
      scan_id, 
      domain: msg.domain.toLowerCase(), // normalize domain
      companyName: msg.companyName 
    };

    // Log the incoming event
    console.log('[events] Received Pub/Sub event:', {
      scan_id: job.scan_id,
      domain: job.domain,
      subscription: body.subscription,
      messageId: (body.message as any)?.messageId
    });

    // Enqueue to Cloud Tasks and ack immediately
    try {
      await enqueueScanTask(job);
      console.log('[events] Successfully enqueued scan task:', job.scan_id);
      return reply.code(204).send(); // 2xx == ack
    } catch (err) {
      console.error('[events] Failed to enqueue task:', {
        error: err, 
        scan_id: job.scan_id,
        domain: job.domain 
      });
      // Still 204 to avoid redelivery loops; alternatively 500 if you prefer redelivery
      return reply.code(204).send();
    }
  });

  // --- Cloud Tasks worker endpoint ---
  app.post<{ Body: ScanJob }>('/tasks/scan', async (req, reply) => {
    console.log('🔥 /tasks/scan HANDLER REACHED! Headers:', req.headers);
    const startTime = Date.now();
    const body = req.body as ScanJob;
    const { scan_id, domain } = body ?? {};
    
    console.log('📦 Body received:', body);
    
    if (!scan_id || !domain) {
      console.error('❌ Missing required fields:', { scan_id, domain });
      return reply.code(400).send({ error: 'scan_id and domain are required' });
    }

    // Verify OIDC token if configured
    const authHeader = req.headers.authorization;
    const requireAuth = process.env.REQUIRE_AUTH === 'true';
    console.log('🔐 Auth check:', { requireAuth, hasAuthHeader: !!authHeader });
    
    if (requireAuth && !authHeader?.startsWith('Bearer ')) {
      console.warn('[worker] Missing or invalid authorization header for scan:', scan_id);
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    console.log('[worker] starting scan:', {
      scan_id, 
      domain,
      task_queue_name: req.headers['x-cloudtasks-queuename'],
      task_retry_count: req.headers['x-cloudtasks-taskretrycount'],
      task_execution_count: req.headers['x-cloudtasks-taskexecutioncount']
    });
    
    try {
      const result = await executeScan({ scan_id, domain });
      
      const duration = Date.now() - startTime;
      console.log('[worker] scan completed successfully:', {
        scan_id,
        duration_ms: duration,
        modules_completed: Object.keys(result.results).length
      });

      // TODO: persist result to Firestore/DB here
      // await persistToFirestore(result);
      
      return reply.code(200).send(result);
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error('[worker] scan failed:', {
        scan_id,
        domain,
        duration_ms: duration,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      
      // Return 500 to trigger Cloud Tasks retry
      return reply.code(500).send({ 
        error: 'Scan failed', 
        message: err instanceof Error ? err.message : String(err) 
      });
    }
  });

  // --- Optional: synchronous test route (for manual validation only) ---
  app.post<{ Body: { domain: string } }>('/debug/test-endpoints', async (req, reply) => {
    const domain = req.body?.domain;
    if (!domain) return reply.code(400).send({ error: 'domain required' });
    const result = await executeScan({ scan_id: crypto.randomUUID(), domain });
    return reply.code(200).send(result);
  });

  return app;
}

// Start server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = buildServer();
  const port = Number(process.env.PORT ?? 8080);
  app
    .listen({ port, host: '0.0.0.0' })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exit(1);
    });
}