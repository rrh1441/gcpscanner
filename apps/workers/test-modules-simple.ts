#!/usr/bin/env npx tsx
// Simple module testing script that loads modules dynamically

import { config } from 'dotenv';
import { initializeDatabase, pool } from './core/artifactStore.js';

// Load environment variables first
config();

// Verify environment variables are loaded
console.log('Environment check:');
console.log('- SHODAN_API_KEY:', process.env.SHODAN_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- ABUSEIPDB_API_KEY:', process.env.ABUSEIPDB_API_KEY ? '✅ Set' : '❌ Missing');

const TEST_DOMAIN = 'vulnerable-test-site.vercel.app';
const TEST_COMPANY = 'Test Company';
const SCAN_ID = `test-${Date.now()}`;

async function testEndpointDiscovery() {
  console.log('\n🧪 Testing endpointDiscovery...');
  try {
    const { runEndpointDiscovery } = await import('./modules/endpointDiscovery.js');
    const result = await runEndpointDiscovery({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    console.log(`✅ Success: ${result} findings`);
    return result;
  } catch (error: any) {
    console.error(`❌ Failed: ${error.message}`);
    return 0;
  }
}

async function testClientSecretScanner() {
  console.log('\n🧪 Testing clientSecretScanner...');
  try {
    const { runClientSecretScanner } = await import('./modules/clientSecretScanner.js');
    const result = await runClientSecretScanner({ scanId: SCAN_ID });
    console.log(`✅ Success: ${result} secrets found`);
    return result;
  } catch (error: any) {
    console.error(`❌ Failed: ${error.message}`);
    return 0;
  }
}

async function testConfigExposureScanner() {
  console.log('\n🧪 Testing configExposureScanner...');
  try {
    const { runConfigExposureScanner } = await import('./modules/configExposureScanner.js');
    const result = await runConfigExposureScanner({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    console.log(`✅ Success: ${result} exposed configs found`);
    return result;
  } catch (error: any) {
    console.error(`❌ Failed: ${error.message}`);
    return 0;
  }
}

async function testTechStackScan() {
  console.log('\n🧪 Testing techStackScan...');
  try {
    const { runTechStackScan } = await import('./modules/techStackScan.js');
    const result = await runTechStackScan({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    console.log(`✅ Success: ${result} technologies found`);
    return result;
  } catch (error: any) {
    console.error(`❌ Failed: ${error.message}`);
    return 0;
  }
}

async function testDnsTwist() {
  console.log('\n🧪 Testing dnsTwist...');
  try {
    const { runDnsTwist } = await import('./modules/dnsTwist.js');
    const result = await runDnsTwist({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    console.log(`✅ Success: ${result} permutations found`);
    return result;
  } catch (error: any) {
    console.error(`❌ Failed: ${error.message}`);
    return 0;
  }
}

async function testShodan() {
  console.log('\n🧪 Testing shodan...');
  try {
    const { runShodanScan } = await import('./modules/shodan.js');
    const result = await runShodanScan({ domain: TEST_DOMAIN, scanId: SCAN_ID, companyName: TEST_COMPANY });
    console.log(`✅ Success: ${result} findings`);
    return result;
  } catch (error: any) {
    console.error(`❌ Failed: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting module testing');
  console.log(`📍 Test domain: ${TEST_DOMAIN}`);
  console.log(`🆔 Scan ID: ${SCAN_ID}`);
  
  try {
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    // Test modules in order
    await testEndpointDiscovery();
    await testConfigExposureScanner();
    await testClientSecretScanner();
    await testTechStackScan();
    await testDnsTwist();
    await testShodan();
    
    console.log('\n✅ Testing complete!');
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main().catch(console.error);