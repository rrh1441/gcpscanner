import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

export interface ArtifactInput {
  type: string;
  val_text: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  src_url?: string;
  sha256?: string;
  mime?: string;
  meta?: Record<string, any>;
}

export interface Finding {
  artifact_id: number;
  finding_type: string;
  recommendation: string;
  description: string;
  repro_command?: string;
  remediation?: Record<string, any>;
  severity?: string;
  attack_type_code?: string;
  eal_low?: number;
  eal_ml?: number;
  eal_high?: number;
  eal_daily?: number;
}

// Insert artifact into Supabase and return ID
export async function insertArtifact(artifact: ArtifactInput): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('artifacts')
      .insert({
        type: artifact.type,
        val_text: artifact.val_text,
        severity: artifact.severity,
        src_url: artifact.src_url || null,
        sha256: artifact.sha256 || null,
        mime: artifact.mime || null,
        meta: artifact.meta || null
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('[artifactStore] Supabase insert artifact error:', error);
      throw error;
    }
    
    const artifactId = data.id;
    
    // Only log significant artifacts to reduce log spam
    if (['scan_error', 'scan_summary'].includes(artifact.type) || artifact.severity === 'CRITICAL') {
      console.log(`[artifactStore] Inserted ${artifact.type} artifact: ${artifact.val_text.slice(0, 60)}...`);
    }
    return artifactId;
  } catch (error) {
    console.error('[artifactStore] Insert artifact error:', error);
    throw error;
  }
}

// Insert finding linked to an artifact
export async function insertFinding(
  artifactId: number, 
  findingType: string, 
  recommendation: string, 
  description: string,
  reproCommand?: string,
  additionalFields?: Partial<Finding>
): Promise<number> {
  try {
    const findingData = {
      artifact_id: artifactId,
      finding_type: findingType,
      recommendation: recommendation,
      description: description,
      repro_command: reproCommand || null,
      severity: additionalFields?.severity || 'MEDIUM',
      attack_type_code: additionalFields?.attack_type_code || null,
      eal_low: additionalFields?.eal_low || null,
      eal_ml: additionalFields?.eal_ml || null,
      eal_high: additionalFields?.eal_high || null,
      eal_daily: additionalFields?.eal_daily || null,
      remediation: additionalFields?.remediation || null
    };

    const { data, error } = await supabase
      .from('findings')
      .insert(findingData)
      .select('id')
      .single();
    
    if (error) {
      console.error('[artifactStore] Supabase insert finding error:', error);
      throw error;
    }
    
    // Only log HIGH/CRITICAL findings to reduce log spam
    if (findingType.includes('CRITICAL') || findingType.includes('MALICIOUS') || findingType.includes('EXPOSED')) {
      console.log(`[artifactStore] Inserted finding ${findingType} for artifact ${artifactId}${reproCommand ? ' with repro command' : ''}`);
    }
    return data.id;
  } catch (error) {
    console.error('[artifactStore] Insert finding error:', error);
    throw error;
  }
}

// Update finding with remediation
export async function updateFindingRemediation(
  findingId: number,
  remediation: Record<string, any>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('findings')
      .update({ remediation })
      .eq('id', findingId);
    
    if (error) {
      console.error('[artifactStore] Update finding remediation error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[artifactStore] Update remediation error:', error);
    throw error;
  }
}

// Get findings for remediation
export async function getFindingsForRemediation(scanId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('findings')
      .select(`
        id,
        finding_type,
        description,
        recommendation,
        scan_id
      `)
      .eq('scan_id', scanId)
      .is('remediation', null);
    
    if (error) {
      console.error('[artifactStore] Get findings for remediation error:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('[artifactStore] Get findings error:', error);
    throw error;
  }
}

// Initialize scan in scan_status table
export async function initializeScan(scanId: string, companyName: string, domain: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('scan_status')
      .insert({
        scan_id: scanId,
        company_name: companyName,
        domain: domain,
        status: 'queued',
        progress: 0,
        total_modules: 0
      });
    
    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.error('[artifactStore] Initialize scan error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[artifactStore] Initialize scan error:', error);
    throw error;
  }
}

// Update scan status
export async function updateScanStatus(
  scanId: string, 
  updates: {
    status?: string;
    progress?: number;
    current_module?: string;
    total_modules?: number;
    error_message?: string;
    total_findings_count?: number;
    total_artifacts_count?: number;
    max_severity?: string;
    completed_at?: string;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('scan_status')
      .update({
        ...updates,
        last_updated: new Date().toISOString()
      })
      .eq('scan_id', scanId);
    
    if (error) {
      console.error('[artifactStore] Update scan status error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[artifactStore] Update scan error:', error);
    throw error;
  }
}

// Get scan counts for summary
export async function getScanCounts(scanId: string): Promise<{
  totalFindings: number;
  totalArtifacts: number;
  maxSeverity: string | null;
}> {
  try {
    // Get artifact count
    const { count: artifactCount, error: artifactError } = await supabase
      .from('artifacts')
      .select('*', { count: 'exact', head: true })
      .eq('meta->scan_id', scanId);
    
    if (artifactError) throw artifactError;
    
    // Get findings count and max severity
    const { data: findings, error: findingsError } = await supabase
      .from('findings')
      .select('severity')
      .eq('scan_id', scanId);
    
    if (findingsError) throw findingsError;
    
    const totalFindings = findings?.length || 0;
    
    // Calculate max severity
    const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
    let maxSeverity = null;
    
    if (findings && findings.length > 0) {
      const severities = findings.map(f => f.severity).filter(Boolean);
      for (const sev of severityOrder) {
        if (severities.includes(sev)) {
          maxSeverity = sev;
          break;
        }
      }
    }
    
    return {
      totalFindings,
      totalArtifacts: artifactCount || 0,
      maxSeverity
    };
  } catch (error) {
    console.error('[artifactStore] Get scan counts error:', error);
    return { totalFindings: 0, totalArtifacts: 0, maxSeverity: null };
  }
}

// Export a compatible pool object for backward compatibility
export const pool = {
  query: async (text: string, params?: any[]): Promise<any> => {
    try {
      const trimmedQuery = text.trim();
      const upperQuery = trimmedQuery.toUpperCase();
      
      // Handle SELECT queries
      if (upperQuery.startsWith('SELECT')) {
        // Extract table name
        const tableMatch = trimmedQuery.match(/FROM\s+(\w+)/i);
        if (!tableMatch) {
          console.error('[artifactStore] Could not parse table from query:', trimmedQuery);
          return { rows: [], rowCount: 0 };
        }
        const table = tableMatch[1].toLowerCase();
        
        // Handle DISTINCT modifier
        const isDistinct = upperQuery.includes('DISTINCT');
        
        // Extract column selection
        const selectMatch = trimmedQuery.match(/SELECT\s+(DISTINCT\s+)?(.+?)\s+FROM/i);
        const selectedColumns = selectMatch?.[2] || '*';
        
        // Check for JOIN clause
        const joinMatch = trimmedQuery.match(/JOIN\s+(\w+)\s+(\w+)?\s*ON\s+([^WHERE]+)/i);
        let isJoinQuery = false;
        
        // Build Supabase query
        let supabaseQuery: any;
        
        if (joinMatch && table === 'findings') {
          // Handle findings joined with artifacts
          isJoinQuery = true;
          supabaseQuery = supabase.from('findings').select(`
            id,
            finding_type,
            description,
            recommendation,
            created_at,
            scan_id,
            artifact_id,
            severity,
            artifacts!inner(
              type,
              val_text,
              severity,
              src_url,
              meta
            )
          `);
        } else {
          supabaseQuery = supabase.from(table).select('*');
        }
        
        // Handle WHERE clauses with parameters
        if (trimmedQuery.includes("meta->>'scan_id'") && params?.[0]) {
          if (isJoinQuery && table === 'findings') {
            // For findings joined with artifacts, use the findings.scan_id column directly
            supabaseQuery = supabaseQuery.eq('scan_id', params[0]);
          } else {
            supabaseQuery = supabaseQuery.eq('meta->>scan_id', params[0]);
          }
        }
        
        // Handle scan_id for findings table
        if (table === 'findings' && trimmedQuery.includes("scan_id") && params?.[0] && !isJoinQuery) {
          supabaseQuery = supabaseQuery.eq('scan_id', params[0]);
        }
        
        // Handle type = 'value' pattern
        const typeEqMatch = trimmedQuery.match(/type\s*=\s*'([^']+)'/i);
        if (typeEqMatch) {
          supabaseQuery = supabaseQuery.eq('type', typeEqMatch[1]);
        }
        
        // Handle type IN ('val1', 'val2') pattern  
        const typeInMatch = trimmedQuery.match(/type\s+IN\s*\(([^)]+)\)/i);
        if (typeInMatch) {
          const types = typeInMatch[1].split(',').map(t => t.trim().replace(/'/g, ''));
          supabaseQuery = supabaseQuery.in('type', types);
        }
        
        // Handle type = $1 pattern with parameter
        if (trimmedQuery.match(/type\s*=\s*\$\d+/i) && params?.[0]) {
          supabaseQuery = supabaseQuery.eq('type', params[0]);
        }
        
        // Handle AND conditions
        const andConditions = trimmedQuery.match(/AND\s+(\w+)\s*=\s*\$(\d+)/gi);
        if (andConditions) {
          andConditions.forEach(condition => {
            const match = condition.match(/AND\s+(\w+)\s*=\s*\$(\d+)/i);
            if (match) {
              const field = match[1].toLowerCase();
              const paramIndex = parseInt(match[2]) - 1;
              if (params?.[paramIndex] !== undefined) {
                supabaseQuery = supabaseQuery.eq(field, params[paramIndex]);
              }
            }
          });
        }
        
        // Handle LIMIT with parameter ($2 usually)
        const limitParamMatch = trimmedQuery.match(/LIMIT\s+\$(\d+)/i);
        if (limitParamMatch) {
          const paramIndex = parseInt(limitParamMatch[1]) - 1;
          if (params?.[paramIndex]) {
            supabaseQuery = supabaseQuery.limit(params[paramIndex]);
          }
        }
        
        // Handle LIMIT with literal value
        const limitMatch = trimmedQuery.match(/LIMIT\s+(\d+)/i);
        if (limitMatch && !limitParamMatch) {
          supabaseQuery = supabaseQuery.limit(parseInt(limitMatch[1]));
        }
        
        // Handle ORDER BY
        const orderMatch = trimmedQuery.match(/ORDER\s+BY\s+(\w+)\s*(DESC|ASC)?/i);
        if (orderMatch) {
          supabaseQuery = supabaseQuery.order(orderMatch[1], { ascending: orderMatch[2]?.toUpperCase() !== 'DESC' });
        }
        
        // Execute query
        console.log('[artifactStore] Executing query:', {
          table,
          isJoinQuery,
          params,
          query: trimmedQuery.substring(0, 100)
        });
        
        const { data, error } = await supabaseQuery;
        
        if (error) {
          console.error('[artifactStore] Supabase query error:', error);
          console.error('[artifactStore] Original query:', trimmedQuery);
          console.error('[artifactStore] Parameters:', params);
          return { rows: [], rowCount: 0 };
        }
        
        console.log(`[artifactStore] Query returned ${data?.length || 0} rows`);
        
        let rows = data || [];
        
        // Handle joined query results
        if (isJoinQuery && table === 'findings') {
          rows = rows.map((row: any) => ({
            id: row.id,
            finding_type: row.finding_type,
            description: row.description,
            recommendation: row.recommendation,
            created_at: row.created_at,
            artifact_type: row.artifacts?.type,
            val_text: row.artifacts?.val_text,
            severity: row.artifacts?.severity,
            src_url: row.artifacts?.src_url
          }));
        }
        
        // Handle column selection for specific fields
        if (selectedColumns !== '*' && !selectedColumns.includes('jsonb_path_query_array') && !isJoinQuery) {
          const columns = selectedColumns.split(',').map(c => c.trim());
          rows = rows.map((row: any) => {
            const selectedRow: any = {};
            columns.forEach(col => {
              if (row.hasOwnProperty(col)) {
                selectedRow[col] = row[col];
              }
            });
            return selectedRow;
          });
        }
        
        // Handle DISTINCT
        if (isDistinct && rows.length > 0) {
          const seen = new Set();
          rows = rows.filter((row: any) => {
            const key = selectedColumns === '*' ? JSON.stringify(row) : row[Object.keys(row)[0]];
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
        
        // Handle jsonb_path_query_array for endpoints
        if (trimmedQuery.includes('jsonb_path_query_array')) {
          rows = rows.map((row: any) => ({
            urls: row.meta?.endpoints?.map((e: any) => e.url) || []
          }));
        }
        
        return {
          rows,
          rowCount: rows.length,
          command: 'SELECT',
          oid: 0,
          fields: []
        };
      }
      
      // Handle UPDATE queries  
      if (upperQuery.startsWith('UPDATE')) {
        console.log('[artifactStore] UPDATE queries should use updateScanStatus function');
        return { rows: [], rowCount: 0 };
      }
      
      // Handle INSERT queries
      if (upperQuery.startsWith('INSERT')) {
        console.log('[artifactStore] INSERT queries should use insertArtifact/insertFinding functions');
        return { rows: [], rowCount: 0 };
      }
      
      // Handle DELETE queries
      if (upperQuery.startsWith('DELETE')) {
        console.log('[artifactStore] DELETE query - skipping for safety');
        return { rows: [], rowCount: 0 };
      }
      
      console.warn('[artifactStore] Unhandled query type:', trimmedQuery.substring(0, 50));
      return { rows: [], rowCount: 0 };
      
    } catch (error) {
      console.error('[artifactStore] Pool query error:', error);
      console.error('[artifactStore] Query:', text);
      console.error('[artifactStore] Params:', params);
      return { rows: [], rowCount: 0 };
    }
  },
  end: async (): Promise<void> => {
    console.log('[artifactStore] Connection pool end called (no-op for Supabase)');
  }
};

// No need for initializeDatabase as Supabase tables are created via migration
export async function initializeDatabase(): Promise<void> {
  console.log('[artifactStore] Using Supabase - database initialization handled via migrations');
}