#!/usr/bin/env node

// Test writing to Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWrite() {
  try {
    const testScanId = 'test-' + Date.now();
    
    // 1. Test artifact insert
    console.log('\n1. Testing artifact insert...');
    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .insert({
        type: 'test_artifact',
        val_text: 'This is a test artifact',
        severity: 'INFO',
        meta: { scan_id: testScanId }
      })
      .select()
      .single();
    
    if (artifactError) {
      console.error('❌ Artifact insert failed:', artifactError);
      return;
    }
    
    console.log('✓ Artifact created with ID:', artifact.id);
    
    // 2. Test finding insert
    console.log('\n2. Testing finding insert...');
    const { data: finding, error: findingError } = await supabase
      .from('findings')
      .insert({
        artifact_id: artifact.id,
        finding_type: 'TEST_FINDING',
        recommendation: 'This is a test recommendation',
        description: 'This is a test description',
        scan_id: testScanId,
        severity: 'LOW'
      })
      .select()
      .single();
    
    if (findingError) {
      console.error('❌ Finding insert failed:', findingError);
      return;
    }
    
    console.log('✓ Finding created with ID:', finding.id);
    
    // 3. Test remediation update
    console.log('\n3. Testing remediation update...');
    const { error: updateError } = await supabase
      .from('findings')
      .update({
        remediation: {
          summary: 'Test remediation',
          steps: ['Step 1', 'Step 2'],
          code_example: { language: 'bash', code: 'echo "test"' }
        }
      })
      .eq('id', finding.id);
    
    if (updateError) {
      console.error('❌ Remediation update failed:', updateError);
      return;
    }
    
    console.log('✓ Remediation updated successfully');
    
    // 4. Verify the update
    const { data: updatedFinding, error: verifyError } = await supabase
      .from('findings')
      .select('*')
      .eq('id', finding.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return;
    }
    
    console.log('\n✅ All tests passed!');
    console.log('Finding with remediation:', JSON.stringify(updatedFinding, null, 2));
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('findings').delete().eq('id', finding.id);
    await supabase.from('artifacts').delete().eq('id', artifact.id);
    console.log('✓ Test data cleaned up');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testWrite();