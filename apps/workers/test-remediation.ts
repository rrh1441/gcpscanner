import { config } from 'dotenv';
import { enrichFindingsWithRemediation } from './util/remediationPlanner.js';
import { initializeDatabase } from './core/artifactStore.js';

config();

async function testRemediation() {
  console.log('Testing remediation enrichment...');
  
  try {
    await initializeDatabase();
    console.log('Database initialized');
    
    // Test with a scan ID (replace with actual scan ID from your database)
    const testScanId = process.argv[2];
    if (!testScanId) {
      console.log('Usage: tsx test-remediation.ts <scan_id>');
      process.exit(1);
    }
    
    console.log(`Testing remediation enrichment for scan: ${testScanId}`);
    
    const enrichedCount = await enrichFindingsWithRemediation(testScanId);
    console.log(`✅ Successfully enriched ${enrichedCount} findings with remediation`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testRemediation(); 