#!/usr/bin/env node

/**
 * Trigger remediation generation for a specific scan
 * Usage: node trigger-remediation.js <scan_id>
 */

const scanId = process.argv[2];

if (!scanId) {
  console.error('Usage: node trigger-remediation.js <scan_id>');
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cssqcaieeixukjxqpynp.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzc3FjYWllZWl4dWtqeHFweW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MDg1OTUsImV4cCI6MjA2MTI4NDU5NX0.wJ4q9ywje_6dPlsqGX7cBjGf6iRI1IOO8WP7S883ssY';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

async function triggerRemediation() {
  try {
    console.log(`🔧 Triggering remediation for scan: ${scanId}`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/remediation-generator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ scan_id: scanId })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    
    console.log('✅ Remediation generation complete:');
    console.log(`   - Total findings: ${result.findings_total}`);
    console.log(`   - Processed: ${result.findings_processed}`);
    console.log(`   - Estimated cost: $${result.estimated_cost_usd}`);
    
  } catch (error) {
    console.error('❌ Error triggering remediation:', error.message);
    process.exit(1);
  }
}

triggerRemediation();