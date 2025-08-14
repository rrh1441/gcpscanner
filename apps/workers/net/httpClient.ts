import * as dns from 'node:dns';

export type HttpMethod = 'GET' | 'POST' | 'HEAD' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

export interface HttpRequestOptions {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: string | Buffer | Uint8Array;
  totalTimeoutMs?: number;
  connectTimeoutMs?: number;
  firstByteTimeoutMs?: number;
  idleSocketTimeoutMs?: number;
  maxBodyBytes?: number;
}

export interface HttpResponse {
  url: string;
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: Uint8Array;
}

const DEFAULTS = {
  totalTimeoutMs: 10_000,
  connectTimeoutMs: 3_000,
  firstByteTimeoutMs: 5_000,
  idleSocketTimeoutMs: 5_000,
  maxBodyBytes: 2_000_000,
} as const;

function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((v, k) => { obj[k.toLowerCase()] = v; });
  return obj;
}

async function drainWithLimit(
  resp: Response,
  maxBodyBytes: number,
): Promise<Uint8Array> {
  if (!resp.body) return new Uint8Array();
  
  const reader = resp.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = value ?? new Uint8Array();
    received += chunk.byteLength;
    if (received > maxBodyBytes) {
      reader.cancel();
      throw new Error(`Response body too large (> ${maxBodyBytes} bytes)`);
    }
    chunks.push(chunk);
  }

  const out = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export async function httpRequest(opts: HttpRequestOptions): Promise<HttpResponse> {
  const {
    url,
    method = 'GET',
    headers = {},
    body,
    totalTimeoutMs = DEFAULTS.totalTimeoutMs,
    maxBodyBytes = DEFAULTS.maxBodyBytes,
  } = opts;

  // Use AbortSignal.timeout for total timeout control
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), totalTimeoutMs);

  try {
    const resp = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
      // Add redirect handling
      redirect: 'follow',
    });

    const data = await drainWithLimit(resp, maxBodyBytes);

    return {
      url: resp.url,
      status: resp.status,
      ok: resp.ok,
      headers: headersToObject(resp.headers),
      body: data,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timeout after ${totalTimeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function httpGetText(url: string, opt?: Omit<HttpRequestOptions, 'url' | 'method'>): Promise<string> {
  const r = await httpRequest({ url, method: 'GET', ...(opt ?? {}) });
  return new TextDecoder('utf-8').decode(r.body);
}