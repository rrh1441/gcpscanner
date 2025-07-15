import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Finding {
  id: number;
  finding_type: string;
  severity: string;
  description: string;
  scan_id: string;
  artifact_id: number;
}

interface EALValues {
  eal_low: number;
  eal_ml: number;
  eal_high: number;
  eal_daily: number;
}

// EAL calculation based on finding type and severity
function calculateEAL(finding: Finding): EALValues {
  // Base values by severity
  const severityMultipliers = {
    CRITICAL: { low: 50000, ml: 250000, high: 1000000, daily: 10000 },
    HIGH: { low: 10000, ml: 50000, high: 250000, daily: 2500 },
    MEDIUM: { low: 2500, ml: 10000, high: 50000, daily: 500 },
    LOW: { low: 500, ml: 2500, high: 10000, daily: 100 },
    INFO: { low: 0, ml: 0, high: 0, daily: 0 }
  };

  // Finding type specific multipliers
  const typeMultipliers: Record<string, { low: number; ml: number; high: number; daily: number }> = {
    // Critical financial impact
    'DENIAL_OF_WALLET': { low: 2.0, ml: 3.0, high: 5.0, daily: 10.0 },
    'CLOUD_COST_AMPLIFICATION': { low: 2.0, ml: 3.0, high: 5.0, daily: 10.0 },
    
    // Legal/compliance risks
    'ADA_LEGAL_CONTINGENT_LIABILITY': { low: 5.0, ml: 10.0, high: 20.0, daily: 0.1 },
    'GDPR_VIOLATION': { low: 3.0, ml: 5.0, high: 10.0, daily: 0.1 },
    'PCI_COMPLIANCE_FAILURE': { low: 2.0, ml: 4.0, high: 8.0, daily: 0.2 },
    
    // Data exposure
    'DATA_BREACH_EXPOSURE': { low: 3.0, ml: 5.0, high: 10.0, daily: 0.5 },
    'CLIENT_SIDE_SECRET_EXPOSURE': { low: 2.0, ml: 3.0, high: 5.0, daily: 0.3 },
    'EXPOSED_DATABASE': { low: 4.0, ml: 8.0, high: 15.0, daily: 1.0 },
    'SENSITIVE_FILE_EXPOSURE': { low: 2.0, ml: 4.0, high: 8.0, daily: 0.2 },
    
    // Verified vulnerabilities
    'VERIFIED_CVE': { low: 2.0, ml: 4.0, high: 8.0, daily: 0.5 },
    'VULNERABILITY': { low: 1.5, ml: 2.5, high: 5.0, daily: 0.3 },
    
    // Brand/reputation damage
    'MALICIOUS_TYPOSQUAT': { low: 1.5, ml: 3.0, high: 6.0, daily: 1.0 },
    'PHISHING_INFRASTRUCTURE': { low: 2.0, ml: 4.0, high: 8.0, daily: 2.0 },
    'ADVERSE_MEDIA': { low: 1.0, ml: 2.0, high: 5.0, daily: 0.1 },
    
    // Infrastructure/operational
    'EXPOSED_SERVICE': { low: 1.5, ml: 2.5, high: 5.0, daily: 0.2 },
    'MISSING_RATE_LIMITING': { low: 1.0, ml: 2.0, high: 4.0, daily: 0.5 },
    'TLS_CONFIGURATION_ISSUE': { low: 0.8, ml: 1.5, high: 3.0, daily: 0.1 },
    'EMAIL_SECURITY_GAP': { low: 1.0, ml: 2.0, high: 4.0, daily: 0.2 },
    
    // Default multiplier for unknown types
    'DEFAULT': { low: 1.0, ml: 1.5, high: 3.0, daily: 0.2 }
  };

  const baseSeverity = severityMultipliers[finding.severity as keyof typeof severityMultipliers] || severityMultipliers.MEDIUM;
  const typeMultiplier = typeMultipliers[finding.finding_type] || typeMultipliers.DEFAULT;

  // Apply special logic for certain finding types
  let eal: EALValues = {
    eal_low: Math.round(baseSeverity.low * typeMultiplier.low),
    eal_ml: Math.round(baseSeverity.ml * typeMultiplier.ml),
    eal_high: Math.round(baseSeverity.high * typeMultiplier.high),
    eal_daily: Math.round(baseSeverity.daily * typeMultiplier.daily)
  };

  // Special cases based on finding description
  if (finding.finding_type === 'DENIAL_OF_WALLET' && finding.description.includes('Estimated daily cost:')) {
    // Extract estimated cost from description if available
    const match = finding.description.match(/Estimated daily cost: \$(\d+(?:\.\d+)?)/);
    if (match) {
      const estimatedDaily = parseFloat(match[1]);
      eal.eal_daily = Math.round(estimatedDaily);
      eal.eal_low = Math.round(estimatedDaily * 30); // 1 month
      eal.eal_ml = Math.round(estimatedDaily * 90); // 3 months
      eal.eal_high = Math.round(estimatedDaily * 365); // 1 year
    }
  }

  // ADA compliance - fixed legal liability
  if (finding.finding_type === 'ADA_LEGAL_CONTINGENT_LIABILITY') {
    eal.eal_low = 25000; // Minimum settlement
    eal.eal_ml = 75000; // Average settlement
    eal.eal_high = 500000; // Major lawsuit
    eal.eal_daily = 0; // Not a daily cost
  }

  return eal;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get request body
    const { scan_id } = await req.json();
    
    if (!scan_id) {
      return new Response(
        JSON.stringify({ error: 'scan_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing EAL calculation for scan ${scan_id}`);

    // Get findings that need EAL calculation
    const { data: findings, error: findingsError } = await supabase
      .from('findings')
      .select('*')
      .eq('scan_id', scan_id)
      .is('eal_ml', null) // Only process findings without EAL values
      .order('severity', { ascending: false })
      .limit(500); // Process up to 500 findings per run

    if (findingsError) {
      console.error('Error fetching findings:', findingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch findings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!findings || findings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No findings need EAL calculation' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${findings.length} findings needing EAL calculation`);

    let processedCount = 0;
    const updates = [];

    // Calculate EAL for each finding
    for (const finding of findings) {
      try {
        const ealValues = calculateEAL(finding as Finding);
        
        updates.push({
          id: finding.id,
          ...ealValues
        });
        
        processedCount++;
      } catch (error) {
        console.error(`Error calculating EAL for finding ${finding.id}:`, error);
      }
    }

    // Batch update all findings
    if (updates.length > 0) {
      // Update in batches of 100
      const batchSize = 100;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        // Update each finding individually (Supabase doesn't support bulk updates with different values)
        await Promise.all(batch.map(async (update) => {
          const { id, ...ealValues } = update;
          const { error } = await supabase
            .from('findings')
            .update(ealValues)
            .eq('id', id);
          
          if (error) {
            console.error(`Failed to update finding ${id}:`, error);
          }
        }));
      }
    }

    // Calculate total EAL for the scan
    const { data: totalData, error: totalError } = await supabase
      .from('findings')
      .select('eal_low, eal_ml, eal_high, eal_daily')
      .eq('scan_id', scan_id);

    let totals = {
      total_eal_low: 0,
      total_eal_ml: 0,
      total_eal_high: 0,
      total_eal_daily: 0
    };

    if (totalData && !totalError) {
      totals = totalData.reduce((acc, finding) => ({
        total_eal_low: acc.total_eal_low + (finding.eal_low || 0),
        total_eal_ml: acc.total_eal_ml + (finding.eal_ml || 0),
        total_eal_high: acc.total_eal_high + (finding.eal_high || 0),
        total_eal_daily: acc.total_eal_daily + (finding.eal_daily || 0)
      }), totals);
    }

    console.log(`Completed EAL calculation: ${processedCount}/${findings.length} findings processed`);

    return new Response(
      JSON.stringify({
        scan_id,
        findings_total: findings.length,
        findings_processed: processedCount,
        eal_totals: totals
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('EAL calculation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});