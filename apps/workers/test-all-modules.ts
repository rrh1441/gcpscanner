#!/usr/bin/env npx tsx
// Comprehensive module testing script
// Tests each scanner module against the test site

import { config } from 'dotenv';
import { initializeDatabase, pool } from './core/artifactStore.js';
import { runEndpointDiscovery } from './modules/endpointDiscovery.js';
import { runClientSecretScanner } from './modules/clientSecretScanner.js';
import { runConfigExposureScanner } from './modules/configExposureScanner.js';
import { runTechStackScan } from './modules/techStackScan.js';
import { runDnsTwist } from './modules/dnsTwist.js';
import { runDocumentExposure } from './modules/documentExposure.js';
import { runShodanScan } from './modules/shodan.js';
import { runBreachDirectoryProbe } from './modules/breachDirectoryProbe.js';
import { runTlsScan } from './modules/tlsScan.js';
import { runSpfDmarc } from './modules/spfDmarc.js';
import { runNucleiLegacy as runNuclei } from './modules/nuclei.js';
import { runAccessibilityScan } from './modules/accessibilityScan.js';
import { runAbuseIntelScan } from './modules/abuseIntelScan.js';
import { runRateLimitScan } from './modules/rateLimitScan.js';
import { runDbPortScan } from './modules/dbPortScan.js';
import { runEmailBruteforceSurface } from './modules/emailBruteforceSurface.js';
import { runRdpVpnTemplates } from './modules/rdpVpnTemplates.js';
import { runDenialWalletScan } from './modules/denialWalletScan.js';
import { runZAPScan } from './modules/zapScan.js';
import { runAssetCorrelator } from './modules/assetCorrelator.js';

config();

// Test configuration
const TEST_DOMAIN = process.env.TEST_DOMAIN || 'dealbrief-test.vercel.app';
const TEST_COMPANY = 'Test Company';
const SCAN_ID = `test-${Date.now()}`;

interface TestResult {
  module: string;
  status: 'success' | 'failed' | 'blocked' | 'skipped';
  findings: number;
  duration: number;
  error?: string;
  notes?: string;
}

const results: TestResult[] = [];

async function testModule(
  name: string,
  testFn: () => Promise<number>,
  dependencies?: string[]
): Promise<void> {
  console.log(`\n🧪 Testing ${name}...`);
  const start = Date.now();
  
  try {
    // Check dependencies
    if (dependencies) {
      for (const dep of dependencies) {
        const depResult = results.find(r => r.module === dep);
        if (!depResult || depResult.status !== 'success') {
          results.push({
            module: name,
            status: 'skipped',
            findings: 0,
            duration: 0,
            notes: `Skipped due to dependency failure: ${dep}`
          });
          console.log(`⏭️  Skipped ${name} (dependency not met)`);
          return;
        }
      }
    }
    
    const findings = await testFn();
    const duration = Date.now() - start;
    
    results.push({
      module: name,
      status: 'success',
      findings,
      duration,
      notes: findings > 0 ? '✅ Found vulnerabilities as expected' : '⚠️ No findings (check if working)'
    });
    
    console.log(`✅ ${name} completed: ${findings} findings in ${duration}ms`);
  } catch (error: any) {
    const duration = Date.now() - start;
    const errorMsg = error.message || 'Unknown error';
    
    // Determine if it's an API block or other error
    let status: TestResult['status'] = 'failed';
    if (errorMsg.includes('API') || errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('rate limit')) {
      status = 'blocked';
    }
    
    results.push({
      module: name,
      status,
      findings: 0,
      duration,
      error: errorMsg
    });
    
    console.error(`❌ ${name} failed: ${errorMsg}`);
  }
}

async function main() {
  console.log('🚀 Starting comprehensive module testing');
  console.log(`📍 Test domain: ${TEST_DOMAIN}`);
  console.log(`🆔 Scan ID: ${SCAN_ID}`);
  
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');
    
    // Phase 1: Independent modules
    console.log('\n=== Phase 1: Independent Modules ===');
    
    await testModule('endpointDiscovery', async () => {
      return await runEndpointDiscovery({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    await testModule('configExposureScanner', async () => {
      return await runConfigExposureScanner({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    await testModule('dnsTwist', async () => {
      return await runDnsTwist({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    await testModule('documentExposure', async () => {
      return await runDocumentExposure({ companyName: TEST_COMPANY, domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    await testModule('shodan', async () => {
      return await runShodanScan({ domain: TEST_DOMAIN, scanId: SCAN_ID, companyName: TEST_COMPANY });
    });
    
    await testModule('breachDirectoryProbe', async () => {
      return await runBreachDirectoryProbe({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    await testModule('tlsScan', async () => {
      return await runTlsScan({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    await testModule('spfDmarc', async () => {
      return await runSpfDmarc({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    await testModule('accessibilityScan', async () => {
      return await runAccessibilityScan({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    // Phase 2: Modules that depend on endpointDiscovery
    console.log('\n=== Phase 2: Endpoint-Dependent Modules ===');
    
    await testModule('clientSecretScanner', async () => {
      return await runClientSecretScanner({ scanId: SCAN_ID });
    }, ['endpointDiscovery']);
    
    await testModule('techStackScan', async () => {
      return await runTechStackScan({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    }, ['endpointDiscovery']);
    
    await testModule('nuclei', async () => {
      return await runNuclei({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    }, ['endpointDiscovery']);
    
    await testModule('abuseIntelScan', async () => {
      return await runAbuseIntelScan({ scanId: SCAN_ID });
    }, ['endpointDiscovery']);
    
    // Phase 3: Other modules
    console.log('\n=== Phase 3: Other Modules ===');
    
    await testModule('rateLimitScan', async () => {
      return await runRateLimitScan({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    await testModule('dbPortScan', async () => {
      return await runDbPortScan({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    await testModule('emailBruteforceSurface', async () => {
      return await runEmailBruteforceSurface({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    await testModule('rdpVpnTemplates', async () => {
      return await runRdpVpnTemplates({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    await testModule('denialWalletScan', async () => {
      return await runDenialWalletScan({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    await testModule('zapScan', async () => {
      return await runZAPScan({ domain: TEST_DOMAIN, scanId: SCAN_ID });
    });
    
    // Phase 4: Correlation
    console.log('\n=== Phase 4: Asset Correlation ===');
    
    await testModule('assetCorrelator', async () => {
      await runAssetCorrelator({ scanId: SCAN_ID, domain: TEST_DOMAIN, tier: 'tier1' });
      return 0; // This module doesn't return findings count
    });
    
    // Generate report
    console.log('\n=== Test Results Summary ===');
    console.log(`Total modules tested: ${results.length}`);
    console.log(`✅ Successful: ${results.filter(r => r.status === 'success').length}`);
    console.log(`❌ Failed: ${results.filter(r => r.status === 'failed').length}`);
    console.log(`🚫 Blocked (API): ${results.filter(r => r.status === 'blocked').length}`);
    console.log(`⏭️  Skipped: ${results.filter(r => r.status === 'skipped').length}`);
    
    // Write detailed results
    await writeTestResults(results);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

async function writeTestResults(results: TestResult[]) {
  const fs = await import('fs/promises');
  
  let markdown = `# Module Test Results
Generated: ${new Date().toISOString()}
Test Domain: ${TEST_DOMAIN}
Scan ID: ${SCAN_ID}

## Summary
- Total Modules: ${results.length}
- ✅ Successful: ${results.filter(r => r.status === 'success').length}
- ❌ Failed: ${results.filter(r => r.status === 'failed').length}
- 🚫 API Blocked: ${results.filter(r => r.status === 'blocked').length}
- ⏭️ Skipped: ${results.filter(r => r.status === 'skipped').length}

## Detailed Results

| Module | Status | Findings | Duration | Notes |
|--------|--------|----------|----------|-------|
`;
  
  for (const result of results) {
    const statusEmoji = {
      success: '✅',
      failed: '❌',
      blocked: '🚫',
      skipped: '⏭️'
    }[result.status];
    
    const notes = result.error || result.notes || '-';
    markdown += `| ${result.module} | ${statusEmoji} ${result.status} | ${result.findings} | ${result.duration}ms | ${notes} |\n`;
  }
  
  markdown += `\n## API/Dependency Issues\n\n`;
  
  const blockedModules = results.filter(r => r.status === 'blocked');
  if (blockedModules.length > 0) {
    markdown += `### Blocked Modules (API Key/Rate Limit Issues)\n\n`;
    for (const module of blockedModules) {
      markdown += `- **${module.module}**: ${module.error}\n`;
    }
  }
  
  const failedModules = results.filter(r => r.status === 'failed');
  if (failedModules.length > 0) {
    markdown += `\n### Failed Modules (Other Errors)\n\n`;
    for (const module of failedModules) {
      markdown += `- **${module.module}**: ${module.error}\n`;
    }
  }
  
  markdown += `\n## Recommendations\n\n`;
  
  // Check for specific issues
  if (results.find(r => r.module === 'shodan' && r.status === 'blocked')) {
    markdown += `- **Shodan**: Need valid SHODAN_API_KEY in .env\n`;
  }
  
  if (results.find(r => r.module === 'abuseIntelScan' && r.status === 'blocked')) {
    markdown += `- **AbuseIPDB**: Need valid ABUSEIPDB_API_KEY in .env\n`;
  }
  
  if (results.find(r => r.module === 'breachDirectoryProbe' && r.status === 'blocked')) {
    markdown += `- **Breach Directory**: Need valid RAPIDAPI_KEY in .env\n`;
  }
  
  const successfulWithNoFindings = results.filter(r => r.status === 'success' && r.findings === 0);
  if (successfulWithNoFindings.length > 0) {
    markdown += `\n### Modules with No Findings (May Need Investigation)\n\n`;
    for (const module of successfulWithNoFindings) {
      markdown += `- **${module.module}**: Completed successfully but found 0 issues\n`;
    }
  }
  
  await fs.writeFile('testresults.md', markdown);
  console.log('\n📄 Detailed results written to testresults.md');
}

// Run the tests
main().catch(console.error);