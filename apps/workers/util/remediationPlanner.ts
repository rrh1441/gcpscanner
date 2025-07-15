import pLimit from 'p-limit';
import { OpenAI } from 'openai';
import { log } from '../core/logger.js';
import { pool } from '../core/artifactStore.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = 'o4-mini-2025-04-16';  // Exact model name as specified
const MAX_FINDINGS_PER_SCAN = 200;   // Soft cap to prevent runaway costs
const CONCURRENCY = 4;               // Prevents CPU starvation

export interface RemediationJson {
  summary: string;
  steps: string[];
  code_example?: { language: string; code: string };
  verification_command?: string;
}

interface Finding {
  id: string;
  artifact_id: string;
  type: string;
  severity: string;
  description: string;
  src_url?: string;
  meta?: any;
  remediation?: RemediationJson;
}

export async function enrichFindingsWithRemediation(scanId: string): Promise<number> {
  const limit = pLimit(CONCURRENCY);

  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    log('[remediationPlanner] OPENAI_API_KEY not configured, skipping remediation enrichment');
    return 0;
  }

  // Get findings that need remediation (all except INFO)
  const result = await pool.query(`
    SELECT 
      f.id,
      f.artifact_id,
      f.finding_type as type,
      a.severity,
      f.description,
      a.src_url,
      a.meta
    FROM findings f
    INNER JOIN artifacts a ON f.artifact_id = a.id
    WHERE a.meta->>'scan_id' = $1
      AND a.severity != 'INFO'
      AND f.remediation IS NULL
  `, [scanId]);

  const findings = result.rows;

  if (!findings?.length) {
    log(`[remediationPlanner] No findings requiring remediation for scan ${scanId}`);
    return 0;
  }

  log(`[remediationPlanner] Processing ${Math.min(findings.length, MAX_FINDINGS_PER_SCAN)} findings for scan ${scanId}`);

  let processed = 0;
  const updates: { id: string; remediation: RemediationJson }[] = [];

  await Promise.all(findings.slice(0, MAX_FINDINGS_PER_SCAN).map((f: any) => limit(async () => {
    try {
      const enrichedFinding: Finding = {
        id: f.id,
        artifact_id: f.artifact_id,
        type: f.type,
        severity: f.severity,
        description: f.description,
        src_url: f.src_url,
        meta: f.meta
      };

      const prompt = buildPrompt(enrichedFinding);
      
      const res = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      });

      const remediation = JSON.parse(res.choices[0].message.content ?? '{}') as RemediationJson;
      updates.push({ id: f.id, remediation });
      processed++;
      
    } catch (e) {
      log(`[remediationPlanner] GPT call failed for finding ${f.id}:`, (e as Error).message);
    }
  })));

  // Batch update findings with remediation
  if (updates.length > 0) {
    for (const update of updates) {
      await pool.query(
        'UPDATE findings SET remediation = $1 WHERE id = $2',
        [JSON.stringify(update.remediation), update.id]
      );
    }
  }

  log(`[remediationPlanner] Completed: ${updates.length}/${findings.length} findings enriched with remediation`);
  return updates.length;
}

function buildPrompt(f: Finding): string {
  const enrichedContext = {
    vulnerability: {
      type: f.type,
      severity: f.severity,
      description: f.description,
      cve_id: f.meta?.cve_id,
      cvss_score: f.meta?.cvss_score || f.meta?.cvss_base,
      epss_score: f.meta?.epss,
      cisa_kev: f.meta?.cisaKev,
      actively_verified: f.meta?.verified_cve,
      exploitable: f.meta?.exploitable,
      template_id: f.meta?.template_id
    },
    target: {
      url: f.src_url,
      technology: f.meta?.technology || f.meta?.vulnerability_family || f.meta?.alert_name,
      version: f.meta?.version,
      host: f.meta?.host,
      port: f.meta?.port
    },
    context: {
      request: f.meta?.request,
      response: f.meta?.response,
      affected_versions: f.meta?.affectedVersionRange,
      nuclei_type: f.meta?.nuclei_type,
      scan_module: f.meta?.scan_module
    }
  };

  // Keep context under 2k tokens
  const contextJson = JSON.stringify(enrichedContext, null, 2).slice(0, 1800);

  return `You are a senior DevSecOps engineer. Provide specific, actionable remediation for this verified vulnerability.

${contextJson}

Respond in exactly this JSON schema:
{
  "summary": "Brief actionable summary (1-2 sentences)",
  "steps": ["Specific step 1", "Specific step 2", "Specific step 3"],
  "code_example": { "language": "bash", "code": "actual commands to run" },
  "verification_command": "command to verify the fix worked"
}

Requirements:
- Be specific to the vulnerability type and affected technology
- Include actual commands, not placeholders
- Focus on immediate remediation steps
- If CVE-specific, reference the CVE ID in steps`;
} 