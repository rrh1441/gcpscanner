#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || 'https://cssqcaieeixukjxqpynp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const scanId = process.argv[2] || 'I50E5WPlwFQ';

async function queryFindings() {
  try {
    console.log(`\nQuerying findings for scan_id: ${scanId}\n`);

    // Query 1: Breakdown by finding_type with EAL values
    console.log('1. BREAKDOWN BY FINDING_TYPE:\n');
    const { data: typeBreakdown, error: typeError } = await supabase
      .from('findings')
      .select('finding_type, severity, eal_low, eal_ml, eal_high, eal_daily')
      .eq('scan_id', scanId)
      .order('finding_type');

    if (typeError) {
      console.error('Error querying findings:', typeError.message);
      return;
    }

    // Group by finding_type
    const grouped = {};
    typeBreakdown.forEach(finding => {
      if (!grouped[finding.finding_type]) {
        grouped[finding.finding_type] = [];
      }
      grouped[finding.finding_type].push(finding);
    });

    // Display grouped results
    for (const [type, findings] of Object.entries(grouped)) {
      console.log(`Finding Type: ${type}`);
      console.log(`Count: ${findings.length}`);
      
      // Calculate averages for this type
      const totals = findings.reduce((acc, f) => {
        acc.eal_low += f.eal_low || 0;
        acc.eal_ml += f.eal_ml || 0;
        acc.eal_high += f.eal_high || 0;
        acc.eal_daily += f.eal_daily || 0;
        return acc;
      }, { eal_low: 0, eal_ml: 0, eal_high: 0, eal_daily: 0 });

      console.log(`Average EAL Low: $${(totals.eal_low / findings.length).toFixed(2)}`);
      console.log(`Average EAL ML: $${(totals.eal_ml / findings.length).toFixed(2)}`);
      console.log(`Average EAL High: $${(totals.eal_high / findings.length).toFixed(2)}`);
      console.log(`Average EAL Daily: $${(totals.eal_daily / findings.length).toFixed(2)}`);
      console.log('---');
    }

    // Query 2: Get 5-10 examples with full details
    console.log('\n2. SAMPLE FINDINGS (5-10 examples):\n');
    const { data: examples, error: exampleError } = await supabase
      .from('findings')
      .select('*')
      .eq('scan_id', scanId)
      .limit(10);

    if (exampleError) {
      console.error('Error getting examples:', exampleError.message);
      return;
    }

    examples.forEach((finding, index) => {
      console.log(`\nExample ${index + 1}:`);
      console.log(`Finding Type: ${finding.finding_type}`);
      console.log(`Severity: ${finding.severity}`);
      console.log(`Asset: ${finding.asset}`);
      console.log(`Title: ${finding.title}`);
      console.log(`EAL Low: $${finding.eal_low || 0}`);
      console.log(`EAL ML: $${finding.eal_ml || 0}`);
      console.log(`EAL High: $${finding.eal_high || 0}`);
      console.log(`EAL Daily: $${finding.eal_daily || 0}`);
      console.log(`Description: ${finding.description?.substring(0, 100)}...`);
    });

    // Query 3: Summary statistics
    console.log('\n3. SUMMARY STATISTICS:\n');
    const { data: allFindings, error: summaryError } = await supabase
      .from('findings')
      .select('eal_low, eal_ml, eal_high, eal_daily')
      .eq('scan_id', scanId);

    if (summaryError) {
      console.error('Error getting summary:', summaryError.message);
      return;
    }

    const totalEAL = allFindings.reduce((acc, f) => {
      acc.low += f.eal_low || 0;
      acc.ml += f.eal_ml || 0;
      acc.high += f.eal_high || 0;
      acc.daily += f.eal_daily || 0;
      return acc;
    }, { low: 0, ml: 0, high: 0, daily: 0 });

    console.log(`Total Findings: ${allFindings.length}`);
    console.log(`Total EAL Low: $${totalEAL.low.toFixed(2)}`);
    console.log(`Total EAL ML: $${totalEAL.ml.toFixed(2)}`);
    console.log(`Total EAL High: $${totalEAL.high.toFixed(2)}`);
    console.log(`Total EAL Daily: $${totalEAL.daily.toFixed(2)}`);

  } catch (error) {
    console.error('Query failed:', error.message);
  }
}

queryFindings();