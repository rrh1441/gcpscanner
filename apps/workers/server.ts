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

  if (!project || !url) {
    throw new Error('Missing GCP_PROJECT or TASKS_WORKER_URL');
  }

  const client = new CloudTasksClient();
  const parent = client.queuePath(project, location, queue);

  const payload = JSON.stringify(job);
  const body = Buffer.from(payload).toString('base64');

  await client.createTask({
    parent,
    task: {
      httpRequest: {
        httpMethod: 'POST',
        url,
        headers: { 'Content-Type': 'application/json' },
        body: Buffer.from(payload),
        // Optionally add OIDC token if the worker is authenticated-only:
        // oidcToken: { serviceAccountEmail: process.env.SCAN_WORKER_SA ?? '' },
      },
      scheduleTime: { seconds: Math.floor(Date.now() / 1000) }, // immediate
    },
  });
}

export function buildServer() {
  const app = Fastify({ logger: true });

  // Health — NO external calls
  app.get('/', async () => ({ status: 'ok', ts: Date.now() }));

  // --- Eventarc/PubSub push endpoint: FAST-ACK ---
  // Eventarc delivers a Pub/Sub-style envelope with { message: { data: base64(json) } }
  app.post<{ Body: PubSubMessage }>('/events', async (req, reply) => {
    const body = req.body;
    const msg = parseBase64Json<ScanJob>(body?.message?.data);
    if (!msg?.domain) {
      req.log.warn({ body }, 'Invalid event payload');
      return reply.code(204).send(); // ack anyway to avoid redelivery loop
    }

    // Ensure scan_id
    const scan_id = msg.scan_id && msg.scan_id.length > 0 ? msg.scan_id : crypto.randomUUID();
    const job: ScanJob = { scan_id, domain: msg.domain };

    // Enqueue to Cloud Tasks and ack immediately
    try {
      await enqueueScanTask(job);
      return reply.code(204).send(); // 2xx == ack
    } catch (err) {
      req.log.error({ err }, 'Failed to enqueue task');
      // Still 204 to avoid redelivery loops; alternatively 500 if you prefer redelivery
      return reply.code(204).send();
    }
  });

  // --- Cloud Tasks worker endpoint ---
  app.post<{ Body: ScanJob }>('/tasks/scan', async (req, reply) => {
    const body = req.body as ScanJob;
    const { scan_id, domain } = body ?? {};
    if (!scan_id || !domain) {
      return reply.code(400).send({ error: 'scan_id and domain are required' });
    }

    req.log.info({ scan_id, domain }, '[worker] starting');
    const result = await executeScan({ scan_id, domain });
    req.log.info({ scan_id }, '[worker] done');

    // TODO: persist result to Firestore/DB here
    return reply.code(200).send(result);
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

if (require.main === module) {
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