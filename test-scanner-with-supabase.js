#!/usr/bin/env node

// Test scanner with direct Supabase writes
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate a simple scan with findings
async function runTestScan() {
  const scanId = 'test-scan-' + Date.now();
  const domain = 'test-example.com';
  
  try {
    console.log(`\n🚀 Starting test scan: ${scanId}`);
    
    // 1. Initialize scan in scan_status
    const { error: scanError } = await supabase
      .from('scan_status')
      .insert({
        scan_id: scanId,
        company_name: 'Test Company',
        domain: domain,
        status: 'processing',
        progress: 0,
        total_modules: 3,
        started_at: new Date().toISOString()
      });
    
    if (scanError) throw scanError;
    console.log('✓ Scan initialized');
    
    // 2. Simulate some artifacts and findings
    const testFindings = [
      {
        type: 'exposed_credentials',
        severity: 'CRITICAL',
        text: 'Found exposed AWS credentials in public repository',
        finding: {
          type: 'EXPOSED_AWS_CREDENTIALS',
          description: 'AWS access keys found in public GitHub repository',
          recommendation: 'Immediately rotate the exposed credentials and remove from repository'
        }
      },
      {
        type: 'ssl_vulnerability',
        severity: 'HIGH',
        text: 'SSL certificate expires in 7 days',
        finding: {
          type: 'SSL_CERT_EXPIRING',
          description: 'SSL certificate for test-example.com expires on 2025-07-18',
          recommendation: 'Renew SSL certificate before expiration'
        }
      },
      {
        type: 'dns_typosquat',
        severity: 'MEDIUM',
        text: 'Potential typosquat domain detected: test-exmaple.com',
        finding: {
          type: 'TYPOSQUAT_DOMAIN',
          description: 'Domain test-exmaple.com is registered and could be used for phishing',
          recommendation: 'Consider registering common typo variations of your domain'
        }
      }
    ];
    
    let findingIds = [];
    
    for (const [index, test] of testFindings.entries()) {
      // Update progress
      await supabase
        .from('scan_status')
        .update({
          progress: Math.round(((index + 1) / testFindings.length) * 100),
          current_module: `Processing finding ${index + 1}/${testFindings.length}`
        })
        .eq('scan_id', scanId);
      
      // Insert artifact
      const { data: artifact, error: artifactError } = await supabase
        .from('artifacts')
        .insert({
          type: test.type,
          val_text: test.text,
          severity: test.severity,
          meta: { scan_id: scanId }
        })
        .select()
        .single();
      
      if (artifactError) throw artifactError;
      
      // Insert finding
      const { data: finding, error: findingError } = await supabase
        .from('findings')
        .insert({
          artifact_id: artifact.id,
          finding_type: test.finding.type,
          description: test.finding.description,
          recommendation: test.finding.recommendation,
          scan_id: scanId,
          severity: test.severity
        })
        .select()
        .single();
      
      if (findingError) throw findingError;
      
      findingIds.push(finding.id);
      console.log(`✓ Created finding: ${test.finding.type}`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 3. Simulate remediation enrichment
    console.log('\n🔧 Enriching findings with remediation...');
    
    for (const findingId of findingIds) {
      const remediation = {
        summary: `Automated remediation for finding ${findingId}`,
        steps: [
          'Identify the scope of the issue',
          'Apply the recommended fix',
          'Verify the fix is effective',
          'Monitor for recurrence'
        ],
        code_example: {
          language: 'bash',
          code: '# Example remediation command\necho "Apply fix here"'
        },
        verification_command: 'curl -I https://test-example.com'
      };
      
      const { error: updateError } = await supabase
        .from('findings')
        .update({ remediation })
        .eq('id', findingId);
      
      if (updateError) throw updateError;
      console.log(`✓ Added remediation to finding ${findingId}`);
    }
    
    // 4. Complete the scan
    const { error: completeError } = await supabase
      .from('scan_status')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        total_findings_count: testFindings.length,
        max_severity: 'CRITICAL',
        total_artifacts_count: testFindings.length
      })
      .eq('scan_id', scanId);
    
    if (completeError) throw completeError;
    
    console.log('\n✅ Test scan completed successfully!');
    console.log(`Scan ID: ${scanId}`);
    console.log(`Total findings: ${testFindings.length}`);
    
    // 5. Verify the data
    console.log('\n📊 Verifying data in Supabase...');
    
    const { data: scanStatus } = await supabase
      .from('scan_status')
      .select('*')
      .eq('scan_id', scanId)
      .single();
    
    console.log('Scan status:', scanStatus.status);
    
    const { data: findings } = await supabase
      .from('findings')
      .select('*, remediation')
      .eq('scan_id', scanId);
    
    console.log(`Findings with remediation: ${findings.filter(f => f.remediation).length}/${findings.length}`);
    
    return scanId;
    
  } catch (error) {
    console.error('❌ Test scan failed:', error);
    
    // Update scan status to failed
    await supabase
      .from('scan_status')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('scan_id', scanId);
  }
}

// Run the test
runTestScan()
  .then(scanId => {
    if (scanId) {
      console.log(`\n🔗 View scan at: https://cssqcaieeixukjxqpynp.supabase.co/project/default/editor/table/scan_status`);
    }
  })
  .catch(console.error);