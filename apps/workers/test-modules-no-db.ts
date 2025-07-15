#!/usr/bin/env npx tsx
// Module testing script without database dependency
// Tests basic functionality of each module

import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables from parent directory
config({ path: path.join(process.cwd(), '..', '..', '.env') });

// Verify environment variables are loaded
console.log('Environment check:');
console.log('- SHODAN_API_KEY:', process.env.SHODAN_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- ABUSEIPDB_API_KEY:', process.env.ABUSEIPDB_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- Working dir:', process.cwd());

const TEST_DOMAIN = 'vulnerable-test-site.vercel.app';

// Test individual modules without database
async function testModuleBasic(moduleName: string, testFn: () => Promise<any>) {
  console.log(`\n🧪 Testing ${moduleName}...`);
  try {
    await testFn();
    console.log(`✅ ${moduleName} loaded successfully`);
    return true;
  } catch (error: any) {
    console.error(`❌ ${moduleName} failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Starting basic module testing (no database)');
  console.log(`📍 Test domain: ${TEST_DOMAIN}`);
  
  const results: { [key: string]: boolean } = {};
  
  // Test loading each module
  results.endpointDiscovery = await testModuleBasic('endpointDiscovery', async () => {
    const { runEndpointDiscovery } = await import('./modules/endpointDiscovery.js');
    console.log('  - Module loaded, function available');
  });
  
  results.clientSecretScanner = await testModuleBasic('clientSecretScanner', async () => {
    const { runClientSecretScanner } = await import('./modules/clientSecretScanner.js');
    console.log('  - Module loaded, function available');
  });
  
  results.configExposureScanner = await testModuleBasic('configExposureScanner', async () => {
    const { runConfigExposureScanner } = await import('./modules/configExposureScanner.js');
    console.log('  - Module loaded, function available');
  });
  
  results.techStackScan = await testModuleBasic('techStackScan', async () => {
    const { runTechStackScan } = await import('./modules/techStackScan.js');
    console.log('  - Module loaded, function available');
  });
  
  results.dnsTwist = await testModuleBasic('dnsTwist', async () => {
    const { runDnsTwist } = await import('./modules/dnsTwist.js');
    console.log('  - Module loaded, function available');
    // Check if dnstwist binary exists
    const { execSync } = await import('child_process');
    try {
      execSync('which dnstwist');
      console.log('  - dnstwist binary: ✅ Found');
    } catch {
      console.log('  - dnstwist binary: ❌ Not found (install with: pip install dnstwist)');
    }
  });
  
  results.shodan = await testModuleBasic('shodan', async () => {
    const { runShodanScan } = await import('./modules/shodan.js');
    console.log('  - Module loaded, function available');
    console.log('  - API Key:', process.env.SHODAN_API_KEY ? '✅ Set' : '❌ Missing');
  });
  
  results.documentExposure = await testModuleBasic('documentExposure', async () => {
    const { runDocumentExposure } = await import('./modules/documentExposure.js');
    console.log('  - Module loaded, function available');
    console.log('  - SERPER_KEY:', process.env.SERPER_KEY ? '✅ Set' : '❌ Missing');
  });
  
  results.nuclei = await testModuleBasic('nuclei', async () => {
    const { runNucleiLegacy } = await import('./modules/nuclei.js');
    console.log('  - Module loaded, function available');
    // Check if nuclei binary exists
    const { execSync } = await import('child_process');
    try {
      execSync('which nuclei');
      console.log('  - nuclei binary: ✅ Found');
    } catch {
      console.log('  - nuclei binary: ❌ Not found (install nuclei)');
    }
  });
  
  results.abuseIntelScan = await testModuleBasic('abuseIntelScan', async () => {
    const { runAbuseIntelScan } = await import('./modules/abuseIntelScan.js');
    console.log('  - Module loaded, function available');
    console.log('  - ABUSEIPDB_API_KEY:', process.env.ABUSEIPDB_API_KEY ? '✅ Set' : '❌ Missing');
  });
  
  results.breachDirectoryProbe = await testModuleBasic('breachDirectoryProbe', async () => {
    const { runBreachDirectoryProbe } = await import('./modules/breachDirectoryProbe.js');
    console.log('  - Module loaded, function available');
    console.log('  - RAPIDAPI_KEY:', process.env.RAPIDAPI_KEY ? '✅ Set' : '❌ Missing');
  });
  
  // Test making actual requests
  console.log('\n=== Testing Basic Functionality ===');
  
  // Test endpoint discovery
  console.log('\n🌐 Testing basic HTTP request to test domain...');
  try {
    const axios = (await import('axios')).default;
    const response = await axios.get(`https://${TEST_DOMAIN}`, { 
      timeout: 5000,
      validateStatus: () => true 
    });
    console.log(`✅ Domain accessible: ${response.status} ${response.statusText}`);
  } catch (error: any) {
    console.error(`❌ Domain not accessible: ${error.message}`);
  }
  
  // Summary
  console.log('\n=== Summary ===');
  const successful = Object.values(results).filter(r => r).length;
  const failed = Object.values(results).filter(r => !r).length;
  console.log(`Total modules tested: ${Object.keys(results).length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  console.log('\n=== Recommendations ===');
  if (!process.env.SHODAN_API_KEY) {
    console.log('- Add SHODAN_API_KEY to .env file');
  }
  if (!process.env.ABUSEIPDB_API_KEY) {
    console.log('- Add ABUSEIPDB_API_KEY to .env file');
  }
  if (!process.env.RAPIDAPI_KEY) {
    console.log('- Add RAPIDAPI_KEY to .env file for breach directory');
  }
  
  process.exit(0);
}

main().catch(console.error);