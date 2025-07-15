/**
 * TypeScript wrapper for the Python WHOIS resolver (RDAP + Whoxy)
 * Provides 87% cost savings vs WhoisXML
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { log } from '../core/logger.js';

const exec = promisify(execFile);

interface WhoisRecord {
  domain: string;
  registrant_name?: string;
  registrant_org?: string;
  registrar?: string;
  creation_date?: string;
  source: 'rdap' | 'whoxy';
  fetched_at: string;
}

interface WhoisStats {
  rdap_calls: number;
  whoxy_calls: number;
  estimated_cost: number;
  saved_vs_whoisxml: number;
}

/**
 * Resolve WHOIS data for multiple domains using hybrid RDAP+Whoxy approach
 * Cost: ~$0.002/call (vs $0.015/call for WhoisXML) = 87% savings
 */
export async function resolveWhoisBatch(domains: string[]): Promise<{ records: WhoisRecord[]; stats: WhoisStats }> {
  if (!process.env.WHOXY_API_KEY) {
    log('[whoisWrapper] WHOXY_API_KEY not set - WHOIS resolution disabled');
    return { 
      records: domains.map(d => ({
        domain: d,
        source: 'rdap' as const,
        fetched_at: new Date().toISOString()
      })),
      stats: { rdap_calls: 0, whoxy_calls: 0, estimated_cost: 0, saved_vs_whoisxml: 0 }
    };
  }

  const tempFile = join('/tmp', `whois_domains_${Date.now()}.json`);
  
  try {
    // Write domains to temp file
    await writeFile(tempFile, JSON.stringify(domains));
    
    // Call Python resolver with domains as arguments
    const pythonScript = join(process.cwd(), 'apps/workers/modules/whoisResolver.py');
    const { stdout, stderr } = await exec('python3', [pythonScript, ...domains], { 
        timeout: 60_000,
        env: { 
          ...process.env, 
          WHOXY_API_KEY: process.env.WHOXY_API_KEY || ''
        }
      });

    if (stderr) {
      log('[whoisWrapper] Python stderr:', stderr);
    }

    // Parse line-by-line JSON output from Python script
    const lines = stdout.trim().split('\n').filter(line => line.trim());
    const records: WhoisRecord[] = [];
    
    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        records.push({
          domain: record.domain,
          registrant_name: record.registrant_name,
          registrant_org: record.registrant_org,
          registrar: record.registrar,
          creation_date: record.creation_date,
          source: record.source,
          fetched_at: record.fetched_at
        });
      } catch (parseError) {
        log('[whoisWrapper] Failed to parse WHOIS record line:', line);
      }
    }
    
    // Calculate stats
    const rdapCalls = records.filter(r => r.source === 'rdap').length;
    const whoxyCalls = records.filter(r => r.source === 'whoxy').length;
    const estimatedCost = whoxyCalls * 0.002;
    const savedVsWhoisxml = domains.length * 0.015 - estimatedCost;
    
    const result = {
      records,
      stats: {
        rdap_calls: rdapCalls,
        whoxy_calls: whoxyCalls,
        estimated_cost: estimatedCost,
        saved_vs_whoisxml: savedVsWhoisxml
      }
    };
    
    log(`[whoisWrapper] WHOIS resolution: ${rdapCalls} RDAP (free) + ${whoxyCalls} Whoxy (~$${estimatedCost.toFixed(3)})`);
    log(`[whoisWrapper] Saved $${savedVsWhoisxml.toFixed(3)} vs WhoisXML`);
    
    return result;
    
  } catch (error) {
    log('[whoisWrapper] Error resolving WHOIS data:', (error as Error).message);
    
    // Fallback to empty records
    return {
      records: domains.map(d => ({
        domain: d,
        source: 'rdap' as const,
        fetched_at: new Date().toISOString()
      })),
      stats: { rdap_calls: 0, whoxy_calls: 0, estimated_cost: 0, saved_vs_whoisxml: 0 }
    };
    
  } finally {
    // Cleanup temp file
    await unlink(tempFile).catch(() => {});
  }
}

/**
 * Legacy single domain resolver for backward compatibility
 */
export async function resolveWhoisSingle(domain: string): Promise<WhoisRecord | null> {
  const result = await resolveWhoisBatch([domain]);
  return result.records[0] || null;
}