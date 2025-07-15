#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Use the Supabase credentials
const supabaseUrl = 'https://cssqcaieeixukjxqpynp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzc3FjYWllZWl4dWtqeHFweW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MDg1OTUsImV4cCI6MjA2MTI4NDU5NX0.wJ4q9ywje_6dPlsqGX7cBjGf6iRI1IOO8WP7S883ssY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getRemediationFindings(scanId) {
  try {
    console.log(`🔍 Fetching findings with remediation for scan: ${scanId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // First check if this scan exists
    const { data: scanStatus, error: scanError } = await supabase
      .from('scan_status')
      .select('scan_id, company_name, status, created_at')
      .eq('scan_id', scanId)
      .single();
    
    if (scanError) {
      console.error('❌ Error fetching scan status:', scanError.message);
      
      // List recent scans
      const { data: recentScans } = await supabase
        .from('scan_status')
        .select('scan_id, company_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (recentScans && recentScans.length > 0) {
        console.log('\n📋 Recent scans in database:');
        recentScans.forEach(scan => {
          console.log(`   - ${scan.scan_id} | ${scan.company_name} | ${scan.status} | ${new Date(scan.created_at).toLocaleString()}`);
        });
      }
    } else {
      console.log(`✅ Found scan: ${scanStatus.company_name} | Status: ${scanStatus.status}`);
    }
    
    // First, let's try to get artifacts for this scan
    const { data: artifacts, error: artifactError } = await supabase
      .from('artifacts')
      .select('id, severity, type, val_text, src_url')
      .eq('meta->>scan_id', scanId)
      .limit(5);
    
    if (artifactError) {
      console.error('❌ Error fetching artifacts:', artifactError.message);
    } else {
      console.log('Found artifacts:', artifacts?.length || 0);
    }
    
    // First let's check if there are any findings at all
    const { data: allFindings, error: allError } = await supabase
      .from('findings')
      .select('id, finding_type, remediation')
      .limit(20);
    
    if (allError) {
      console.error('❌ Error fetching all findings:', allError.message);
    } else {
      console.log(`Total findings in database: ${allFindings?.length || 0}`);
      const withRemediation = allFindings?.filter(f => f.remediation !== null) || [];
      console.log(`Findings with remediation: ${withRemediation.length}`);
    }
    
    // Query findings with remediation data
    const { data: findings, error } = await supabase
      .from('findings')
      .select(`
        id,
        finding_type,
        description,
        recommendation,
        remediation,
        artifact_id
      `)
      .not('remediation', 'is', null)
      .limit(10);
    
    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }
    
    console.log(`📊 Found ${findings.length} findings with remediation data\n`);
    
    if (findings.length === 0) {
      console.log('No findings with remediation data found for this scan.');
      return;
    }
    
    // Display each finding with remediation
    findings.forEach((finding, index) => {
      console.log(`${index + 1}. ${finding.finding_type}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      console.log(`📝 Description: ${finding.description}`);
      console.log(`⚠️  Recommendation: ${finding.recommendation}`)
      
      console.log('\n✅ REMEDIATION DETAILS:');
      console.log('───────────────────────');
      
      const remediation = finding.remediation;
      
      if (remediation.summary) {
        console.log(`📋 Summary: ${remediation.summary}\n`);
      }
      
      if (remediation.steps && remediation.steps.length > 0) {
        console.log('📌 Steps:');
        remediation.steps.forEach((step, idx) => {
          console.log(`   ${idx + 1}. ${step}`);
        });
        console.log('');
      }
      
      if (remediation.code_example) {
        console.log(`💻 Code Example (${remediation.code_example.language || 'unknown'}):`);
        console.log('```' + (remediation.code_example.language || ''));
        console.log(remediation.code_example.code);
        console.log('```\n');
      }
      
      if (remediation.verification_command) {
        console.log(`🔍 Verification Command:`);
        console.log(`   ${remediation.verification_command}`);
      }
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
    
    // Summary statistics
    console.log('📊 REMEDIATION SUMMARY:');
    console.log('───────────────────────');
    console.log(`   Total: ${findings.length} findings with remediation`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Run the script
const scanId = process.argv[2] || 'hu-TUdbc_N1';
getRemediationFindings(scanId);