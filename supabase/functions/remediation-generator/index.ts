import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RemediationJob {
  id: number;
  scan_id: string;
  status: string;
  findings_count?: number;
}

interface Finding {
  id: number;
  finding_type: string;
  description: string;
  recommendation: string;
  severity: string;
  scan_id: string;
}

interface RemediationResult {
  summary: string;
  steps: string[];
  code_example?: { language: string; code: string };
  verification_command?: string;
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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Get request body
    const { scan_id } = await req.json();
    
    if (!scan_id) {
      return new Response(
        JSON.stringify({ error: 'scan_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing remediation for scan ${scan_id}`);

    // Get findings that need remediation
    const { data: findings, error: findingsError } = await supabase
      .from('findings')
      .select('*')
      .eq('scan_id', scan_id)
      .is('remediation', null)
      .order('severity', { ascending: false })
      .limit(200); // Cap at 200 findings to prevent runaway costs

    if (findingsError) {
      console.error('Error fetching findings:', findingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch findings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!findings || findings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No findings need remediation' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${findings.length} findings needing remediation`);

    let processedCount = 0;
    let totalCost = 0;

    // Process findings in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < findings.length; i += batchSize) {
      const batch = findings.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (finding: Finding) => {
        try {
          const prompt = buildRemediationPrompt(finding);
          
          const completion = await openai.chat.completions.create({
            model: 'o4-mini-2025-04-16',
            messages: [
              { 
                role: 'system', 
                content: 'You are a senior DevSecOps engineer. Provide concise remediation plans as JSON. Focus on practical, actionable steps. Include specific commands where applicable.'
              },
              { role: 'user', content: prompt }
            ],
            max_tokens: 1000,
            temperature: 0.1,
            response_format: { type: "json_object" }
          });

          const remediationText = completion.choices[0]?.message?.content;
          if (!remediationText) {
            throw new Error('No remediation generated');
          }

          const remediation = JSON.parse(remediationText) as RemediationResult;
          
          // Update finding with remediation
          const { error: updateError } = await supabase
            .from('findings')
            .update({ remediation })
            .eq('id', finding.id);

          if (updateError) {
            console.error(`Failed to update finding ${finding.id}:`, updateError);
          } else {
            processedCount++;
            totalCost += (completion.usage?.total_tokens || 0) * 0.000002; // Rough estimate
          }

        } catch (error) {
          console.error(`Error processing finding ${finding.id}:`, error);
        }
      }));
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < findings.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Completed remediation: ${processedCount}/${findings.length} findings processed`);

    return new Response(
      JSON.stringify({
        scan_id,
        findings_total: findings.length,
        findings_processed: processedCount,
        estimated_cost_usd: totalCost.toFixed(6)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Remediation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildRemediationPrompt(finding: Finding): string {
  const context = {
    type: finding.finding_type,
    description: finding.description,
    recommendation: finding.recommendation,
    severity: finding.severity
  };
  
  return `
Finding Context:
${JSON.stringify(context, null, 2)}

Provide a remediation plan as JSON with this exact schema:
{
  "summary": "Brief 1-2 sentence summary of the remediation approach",
  "steps": ["Step 1: Specific action", "Step 2: Next action", "Step 3: Verification"],
  "code_example": { "language": "bash|yaml|json|python", "code": "# Example command or configuration" },
  "verification_command": "Command to verify the fix was applied successfully"
}

Focus on:
- Practical, actionable steps that can be implemented immediately
- Include specific commands, configuration changes, or code snippets
- Provide a way to verify the remediation was successful
- Keep the summary concise and business-friendly

Return ONLY valid JSON, no additional text.`;
}