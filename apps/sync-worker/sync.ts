import { Pool } from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config(); // Load from environment variables

const FLY_POSTGRES_CONNECTION_STRING = process.env.DATABASE_URL || process.env.DB_URL;
const SUPABASE_URL = process.env.SUPABASE_URL; // From Vercel, will be NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to set this as a secret in Fly.io for this worker

if (!FLY_POSTGRES_CONNECTION_STRING || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SyncWorker: Missing critical environment variables (DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Exiting.');
    process.exit(1);
}

// Environment loaded - minimal logging

const flyPostgresPool = new Pool({ connectionString: FLY_POSTGRES_CONNECTION_STRING });
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYNC_INTERVAL_MS = 60 * 1000; // Sync every 1 minute
let lastSuccessfulScanSync = new Date(0);
let lastSuccessfulFindingSync = new Date(0);
let lastSuccessfulCredentialsSync = new Date(0);
let lastSuccessfulTotalsSync = new Date(0);

// Declare global type for lastFindingsLogTime
declare global {
    var lastFindingsLogTime: number | undefined;
}

function logDebug(message: string, data?: any) {
    // Reduced logging - only log meaningful progress updates
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SyncWorker] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

function logProgress(message: string, data?: any) {
    // For important progress updates only
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SyncWorker] ✅ ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

function logError(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [SyncWorker] ERROR: ${message}`, error ? error.message || error : '');
    if (error?.stack) {
        console.error(error.stack);
    }
}

async function testSupabaseConnection(): Promise<boolean> {
    try {
        const { data, error } = await supabase.from('scan_status').select('count').limit(1);
        
        if (error) {
            logError('Supabase connection test failed', error);
            return false;
        }
        
        return true;
    } catch (error) {
        logError('Supabase connection test exception', error);
        return false;
    }
}

async function testFlyPostgresConnection(): Promise<boolean> {
    try {
        await flyPostgresPool.query('SELECT 1');
        return true;
    } catch (error) {
        logError('Fly Postgres connection test failed', error);
        return false;
    }
}

async function syncScansMasterTable() {
    try {
        const { rows } = await flyPostgresPool.query(
            `SELECT 
                scan_id, 
                company_name, 
                domain, 
                status, 
                progress,
                current_module,
                total_modules,
                created_at, 
                updated_at, 
                completed_at,
                error_message,
                total_findings_count,
                max_severity,
                total_artifacts_count
             FROM scans_master 
             WHERE updated_at > $1 
             AND (status NOT IN ('completed', 'failed') OR updated_at > NOW() - INTERVAL '1 hour')
             ORDER BY updated_at ASC
             LIMIT 100`, // Batching
            [lastSuccessfulScanSync]
        );

        if (rows.length > 0) {
            const recordsToUpsert = rows.map(pgScan => ({
                scan_id: pgScan.scan_id,
                company_name: pgScan.company_name,
                domain: pgScan.domain,
                status: pgScan.status,
                progress: parseInt(pgScan.progress, 10),
                current_module: pgScan.current_module,
                total_modules: parseInt(pgScan.total_modules, 10),
                started_at: pgScan.created_at,
                last_updated: pgScan.updated_at,
                completed_at: pgScan.completed_at,
                error_message: pgScan.error_message,
                total_findings_count: pgScan.total_findings_count,
                max_severity: pgScan.max_severity,
                total_artifacts_count: pgScan.total_artifacts_count || 0,
            }));
            
            const { data, error } = await supabase
                .from('scan_status')
                .upsert(recordsToUpsert, { onConflict: 'scan_id', ignoreDuplicates: false });

            if (error) {
                logError('Error upserting scans to Supabase', error);
                return; // Don't update timestamp on error
            }
            
            // Only log when there are meaningful progress updates
            // Avoid logging old completed scans from previous sessions
            const recentCompletions = recordsToUpsert.filter(scan => 
                (scan.status === 'completed' || scan.status === 'failed') &&
                new Date(scan.last_updated).getTime() > Date.now() - (30 * 60 * 1000) && // Within last 30 minutes
                new Date(scan.last_updated).getTime() > Date.now() - (10 * 60 * 1000) // And after startup window
            );
            
            const activeProgress = recordsToUpsert.filter(scan => 
                scan.status === 'processing' &&
                scan.current_module && 
                scan.progress % 20 === 0 && // Only log every 20% progress
                new Date(scan.last_updated).getTime() > Date.now() - (10 * 60 * 1000) // And recent
            );
            
            if (recentCompletions.length > 0) {
                logProgress(`Recently completed scans: ${recentCompletions.length}`, {
                    completed: recentCompletions.map(s => `${s.company_name}: ${s.status}`)
                });
            }
            
            if (activeProgress.length > 0) {
                logProgress(`Active scans progress: ${activeProgress.length}`, {
                    progress: activeProgress.map(s => `${s.company_name}: ${s.current_module} (${s.progress}%)`)
                });
            }
            
            lastSuccessfulScanSync = new Date(rows[rows.length - 1].updated_at);
        }
    } catch (error) {
        logError('Error in syncScansMasterTable', error);
    }
}

async function syncFindingsTable() {
    try {
        // Check if findings table has scan_id column directly
        const findingsStructure = await flyPostgresPool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'findings'
            ORDER BY ordinal_position
        `);
        
        const hasScanIdColumn = findingsStructure.rows.some(row => row.column_name === 'scan_id');
        
        let query: string;
        if (hasScanIdColumn) {
            // If findings table has scan_id directly
            query = `
                SELECT 
                    id as original_finding_id,
                    scan_id,
                    finding_type,
                    description,
                    recommendation,
                    severity,
                    created_at
                FROM findings
                WHERE created_at > $1
                ORDER BY created_at ASC
                LIMIT 200`;
        } else {
            // If we need to join with artifacts
            query = `
                SELECT 
                    f.id as original_finding_id,
                    a.meta->>'scan_id' as scan_id,
                    f.finding_type,
                    f.description,
                    f.recommendation,
                    a.severity as severity,
                    f.created_at
                FROM findings f
                JOIN artifacts a ON f.artifact_id = a.id
                WHERE f.created_at > $1
                ORDER BY f.created_at ASC
                LIMIT 200`;
        }
        
        const { rows } = await flyPostgresPool.query(query, [lastSuccessfulFindingSync]);

        if (rows.length > 0) {
            const recordsToUpsert = rows
                .filter(f => f.scan_id) // Only sync findings with scan_id
                .map(f => ({
                    id: f.original_finding_id, 
                    scan_id: f.scan_id,
                    type: f.finding_type,
                    description: f.description,
                    recommendation: f.recommendation,
                    severity: f.severity,
                    created_at: f.created_at,
                }));
            
            if (recordsToUpsert.length > 0) {
                // Check what findings already exist in Supabase to avoid logging duplicates
                const existingIds = recordsToUpsert.map(f => f.id);
                const { data: existingFindings } = await supabase
                    .from('findings')
                    .select('id')
                    .in('id', existingIds);
                
                const existingIdSet = new Set(existingFindings?.map(f => f.id) || []);
                const newFindings = recordsToUpsert.filter(f => !existingIdSet.has(f.id));
                
                const { data, error } = await supabase
                    .from('findings')
                    .upsert(recordsToUpsert, { onConflict: 'id', ignoreDuplicates: true });

                if (error) {
                    logError('Error upserting findings to Supabase', error);
                    return; // Don't update timestamp on error
                }
                
                // Only log when there are actually NEW findings
                if (newFindings.length > 0) {
                    const findingsByType = newFindings.reduce((acc, f) => {
                        acc[f.type] = (acc[f.type] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);
                    
                    logProgress(`New findings synced: ${newFindings.length}`, findingsByType);
                }
            }
            
            // Always update timestamp to prevent re-processing same batch
            lastSuccessfulFindingSync = new Date(rows[rows.length - 1].created_at);
        }
    } catch (error) {
        logError('Error in syncFindingsTable', error);
    }
}

async function syncCompromisedCredentialsTable() {
    try {
        // Query for breach_directory_summary artifacts created after last successful sync
        const query = `
            SELECT id, meta, created_at 
            FROM artifacts 
            WHERE type = 'breach_directory_summary' 
            AND created_at > $1
            AND meta->'breach_analysis'->'leakcheck_results' IS NOT NULL
            ORDER BY created_at ASC
            LIMIT 50`;
        
        const { rows } = await flyPostgresPool.query(query, [lastSuccessfulCredentialsSync]);

        if (rows.length > 0) {
            const credentialsToInsert = [];
            
            for (const artifact of rows) {
                const breachAnalysis = artifact.meta?.breach_analysis;
                const scanId = artifact.meta?.scan_id;
                const domain = breachAnalysis?.domain;
                
                if (breachAnalysis?.leakcheck_results && scanId) {
                    for (const credential of breachAnalysis.leakcheck_results) {
                        // Calculate risk level
                        let riskLevel = 'MEDIUM_EMAIL_EXPOSED';
                        if (credential.has_cookies || credential.has_autofill || credential.has_browser_data ||
                            (credential.source?.name && (
                                credential.source.name.toLowerCase().includes('stealer') ||
                                credential.source.name.toLowerCase().includes('redline') ||
                                credential.source.name.toLowerCase().includes('raccoon') ||
                                credential.source.name.toLowerCase().includes('vidar')
                            ))) {
                            riskLevel = 'CRITICAL_INFOSTEALER';
                        } else if (credential.has_password) {
                            riskLevel = 'HIGH_PASSWORD_EXPOSED';
                        }
                        
                        // Determine email type
                        let emailType = 'PERSONAL_EMAIL';
                        if (credential.email && domain && credential.email.includes('@' + domain)) {
                            emailType = 'CORPORATE_EMAIL';
                        }
                        
                        // Parse breach date properly (handle "2019-01" format)
                        let parsedBreachDate = null;
                        if (credential.source?.breach_date) {
                            const dateStr = credential.source.breach_date;
                            if (dateStr.match(/^\d{4}-\d{2}$/)) {
                                // Handle "YYYY-MM" format -> "YYYY-MM-01"
                                parsedBreachDate = dateStr + '-01';
                            } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                // Already full date
                                parsedBreachDate = dateStr;
                            } else if (dateStr.match(/^\d{4}$/)) {
                                // Handle "YYYY" format -> "YYYY-01-01"
                                parsedBreachDate = dateStr + '-01-01';
                            }
                        }

                        credentialsToInsert.push({
                            scan_id: scanId,
                            company_domain: domain,
                            username: credential.username,
                            email: credential.email,
                            breach_source: credential.source?.name || 'Unknown',
                            breach_date: parsedBreachDate,
                            has_password: credential.has_password || false,
                            has_cookies: credential.has_cookies || false,
                            has_autofill: credential.has_autofill || false,
                            has_browser_data: credential.has_browser_data || false,
                            field_count: credential.field_count || 0,
                            risk_level: riskLevel,
                            email_type: emailType,
                            first_name: credential.first_name,
                            last_name: credential.last_name,
                            created_at: artifact.created_at
                        });
                    }
                }
            }
            
            if (credentialsToInsert.length > 0) {
                // Check for existing records to avoid duplicates
                const scanIds = [...new Set(credentialsToInsert.map(c => c.scan_id))];
                const { data: existingCredentials } = await supabase
                    .from('compromised_credentials')
                    .select('scan_id, email, username')
                    .in('scan_id', scanIds);
                
                const existingSet = new Set(existingCredentials?.map(c => `${c.scan_id}-${c.email}-${c.username}`) || []);
                const newCredentials = credentialsToInsert.filter(c => 
                    !existingSet.has(`${c.scan_id}-${c.email}-${c.username}`)
                );
                
                if (newCredentials.length > 0) {
                    const { data, error } = await supabase
                        .from('compromised_credentials')
                        .insert(newCredentials);

                    if (error) {
                        logError('Error inserting compromised credentials to Supabase', error);
                        return; // Don't update timestamp on error
                    }
                    
                    // Log summary by risk level
                    const credentialsByRisk = newCredentials.reduce((acc, c) => {
                        acc[c.risk_level] = (acc[c.risk_level] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);
                    
                    logProgress(`New compromised credentials synced: ${newCredentials.length}`, credentialsByRisk);
                }
            }
            
            // Update timestamp to prevent re-processing
            lastSuccessfulCredentialsSync = new Date(rows[rows.length - 1].created_at);
        }
    } catch (error) {
        logError('Error in syncCompromisedCredentialsTable', error);
    }
}

async function syncScanTotalsAutomated() {
    try {
        // Query Supabase for completed scans that need totals calculated
        const { data: scans, error: scanError } = await supabase
            .from('scan_status')
            .select('scan_id, domain, completed_at')
            .eq('status', 'completed')
            .gt('completed_at', lastSuccessfulTotalsSync.toISOString())
            .not('scan_id', 'in', 
                `(SELECT scan_id FROM scan_totals_automated)`
            )
            .order('completed_at', { ascending: true })
            .limit(20);
            
        if (scanError) {
            logError('Error querying completed scans from Supabase', scanError);
            return;
        }

        if (scans && scans.length > 0) {
            for (const scan of scans) {
                // Get all findings for this scan with EAL values
                const findingsQuery = `
                    SELECT 
                        attack_type_code,
                        COUNT(*) as finding_count,
                        SUM(eal_low) as total_eal_low,
                        SUM(eal_ml) as total_eal_ml,
                        SUM(eal_high) as total_eal_high,
                        SUM(eal_daily) as total_eal_daily
                    FROM findings 
                    WHERE scan_id = $1 
                    AND attack_type_code IS NOT NULL
                    AND (eal_low > 0 OR eal_ml > 0 OR eal_high > 0 OR eal_daily > 0)
                    GROUP BY attack_type_code`;
                
                const { rows: findingTotals } = await flyPostgresPool.query(findingsQuery, [scan.scan_id]);
                
                // Initialize totals object
                const totals = {
                    scan_id: scan.scan_id,
                    company_domain: scan.domain,
                    
                    // Individual cyber incident types
                    phishing_bec_low: 0,
                    phishing_bec_ml: 0,
                    phishing_bec_high: 0,
                    
                    site_hack_low: 0,
                    site_hack_ml: 0,
                    site_hack_high: 0,
                    
                    malware_low: 0,
                    malware_ml: 0,
                    malware_high: 0,
                    
                    // Cyber totals (calculated after)
                    cyber_total_low: 0,
                    cyber_total_ml: 0,
                    cyber_total_high: 0,
                    
                    // ADA compliance
                    ada_compliance_low: 0,
                    ada_compliance_ml: 0,
                    ada_compliance_high: 0,
                    
                    // DoW daily losses
                    dow_daily_low: 0,
                    dow_daily_ml: 0,
                    dow_daily_high: 0,
                    
                    total_findings: 0,
                    verified_findings: 0
                };
                
                // Process findings by attack type
                findingTotals.forEach(finding => {
                    const attackType = finding.attack_type_code;
                    const low = Number(finding.total_eal_low) || 0;
                    const ml = Number(finding.total_eal_ml) || 0;
                    const high = Number(finding.total_eal_high) || 0;
                    const daily = Number(finding.total_eal_daily) || 0;
                    
                    totals.total_findings += Number(finding.finding_count);
                    
                    switch (attackType) {
                        case 'PHISHING_BEC':
                            totals.phishing_bec_low += low;
                            totals.phishing_bec_ml += ml;
                            totals.phishing_bec_high += high;
                            break;
                            
                        case 'SITE_HACK':
                            totals.site_hack_low += low;
                            totals.site_hack_ml += ml;
                            totals.site_hack_high += high;
                            break;
                            
                        case 'MALWARE':
                            totals.malware_low += low;
                            totals.malware_ml += ml;
                            totals.malware_high += high;
                            break;
                            
                        case 'ADA_COMPLIANCE':
                            totals.ada_compliance_low += low;
                            totals.ada_compliance_ml += ml;
                            totals.ada_compliance_high += high;
                            break;
                            
                        case 'DENIAL_OF_WALLET':
                            totals.dow_daily_low += daily;
                            totals.dow_daily_ml += daily;
                            totals.dow_daily_high += daily;
                            break;
                    }
                });
                
                // Calculate cyber totals
                totals.cyber_total_low = totals.phishing_bec_low + totals.site_hack_low + totals.malware_low;
                totals.cyber_total_ml = totals.phishing_bec_ml + totals.site_hack_ml + totals.malware_ml;
                totals.cyber_total_high = totals.phishing_bec_high + totals.site_hack_high + totals.malware_high;
                
                // Count verified findings
                const verifiedQuery = `
                    SELECT COUNT(*) as verified_count 
                    FROM findings 
                    WHERE scan_id = $1 AND state = 'VERIFIED'`;
                const { rows: verified } = await flyPostgresPool.query(verifiedQuery, [scan.scan_id]);
                totals.verified_findings = Number(verified[0]?.verified_count) || 0;
                
                // Insert into Supabase
                const { data, error } = await supabase
                    .from('scan_totals_automated')
                    .insert([totals]);

                if (error) {
                    logError(`Error inserting scan totals for ${scan.scan_id}`, error);
                    continue; // Skip this scan, don't update timestamp
                }
                
                logProgress(`Scan totals calculated for ${scan.scan_id}`, {
                    cyber_total: totals.cyber_total_ml,
                    ada_total: totals.ada_compliance_ml,
                    dow_daily: totals.dow_daily_ml,
                    total_findings: totals.total_findings
                });
            }
            
            // Update timestamp
            lastSuccessfulTotalsSync = new Date(scans[scans.length - 1].completed_at);
        }
    } catch (error) {
        logError('Error in syncScanTotalsAutomated', error);
    }
}

async function runSyncCycle() {
    // Test connections first
    const flyConnectionOk = await testFlyPostgresConnection();
    const supabaseConnectionOk = await testSupabaseConnection();
    
    if (!flyConnectionOk) {
        logError('Fly Postgres connection failed, skipping sync cycle');
        return;
    }
    
    if (!supabaseConnectionOk) {
        logError('Supabase connection failed, skipping sync cycle');
        return;
    }
    
    await syncScansMasterTable();
    await syncFindingsTable();
    await syncCompromisedCredentialsTable();
    await syncScanTotalsAutomated();
}

async function startSyncWorker() {
    // Test connections on startup
    const flyConnectionOk = await testFlyPostgresConnection();
    const supabaseConnectionOk = await testSupabaseConnection();
    
    if (!flyConnectionOk || !supabaseConnectionOk) {
        logError('Critical: One or more connections failed on startup');
        process.exit(1);
    }
    
    logProgress('Sync Worker started - running continuous sync every minute');
    
    // Initialize sync timestamps to catch ALL data (epoch start)  
    // FIXED: Force sync of all data to catch missing scans
    const epochStart = new Date(0); // Start from epoch to sync everything
    lastSuccessfulScanSync = epochStart;
    lastSuccessfulFindingSync = epochStart;
    lastSuccessfulCredentialsSync = epochStart;
    lastSuccessfulTotalsSync = epochStart;
    
    // Run initial sync
    await runSyncCycle();
    
    // Continue running and sync every minute
    setInterval(async () => {
        try {
            await runSyncCycle();
        } catch (error) {
            logError('Sync cycle failed:', error);
        }
    }, SYNC_INTERVAL_MS);
    
    logProgress('Sync Worker running continuously - will sync every minute');
}

// Graceful shutdown
process.on('SIGTERM', () => {
    logProgress('Sync Worker shutting down');
    process.exit(0);
});

process.on('SIGINT', () => {
    logProgress('Sync Worker shutting down');
    process.exit(0);
});

startSyncWorker().catch(error => {
    logError('CRITICAL - Failed to start sync worker', error);
    process.exit(1);
}); 