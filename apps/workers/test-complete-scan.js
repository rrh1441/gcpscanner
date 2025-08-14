// Set mock API keys to avoid startup errors
process.env.SHODAN_API_KEY = 'mock-key';
process.env.OPENAI_API_KEY = 'mock-key';

// Mock artifact store to capture findings
const findings = [];
const artifacts = [];

// Override the artifact store functions
const originalModule = await import('./dist/core/artifactStore.js');
originalModule.insertFinding = async (finding) => {
  findings.push(finding);
  console.log(`📌 Finding: ${finding.title} [${finding.severity}]`);
  return finding;
};
originalModule.insertArtifact = async (artifact) => {
  artifacts.push(artifact);
  console.log(`📦 Artifact: ${artifact.type} - ${artifact.val_text || artifact.value || 'N/A'}`);
  return artifact;
};

async function runCompleteScan() {
  const domain = 'vulnerable-test-site.vercel.app';
  console.log(`\n🚀 Starting COMPLETE SCAN of ${domain}\n`);
  console.log('=' . repeat(60));
  
  const scanStart = Date.now();
  const results = {};
  
  // Test each module
  const modules = [
    { name: 'endpointDiscovery', import: './dist/modules/endpointDiscovery.js', fn: 'runEndpointDiscovery' },
    { name: 'documentExposure', import: './dist/modules/documentExposure.js', fn: 'runDocumentExposure' },
    { name: 'configExposureScanner', import: './dist/modules/configExposureScanner.js', fn: 'runConfigExposureScanner' },
    { name: 'tlsScan', import: './dist/modules/tlsScan.js', fn: 'runTLSScan' },
  ];
  
  for (const module of modules) {
    console.log(`\n📍 Running ${module.name}...`);
    const moduleStart = Date.now();
    
    try {
      const mod = await import(module.import);
      const result = await Promise.race([
        mod[module.fn]({ domain }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Module timeout after 30s')), 30000))
      ]);
      
      const elapsed = Date.now() - moduleStart;
      results[module.name] = {
        success: true,
        findingsCount: result,
        timeMs: elapsed
      };
      console.log(`✅ ${module.name}: ${result} findings in ${elapsed}ms`);
    } catch (error) {
      const elapsed = Date.now() - moduleStart;
      results[module.name] = {
        success: false,
        error: error.message,
        timeMs: elapsed
      };
      console.log(`❌ ${module.name} failed after ${elapsed}ms: ${error.message}`);
    }
  }
  
  const totalTime = Date.now() - scanStart;
  
  // Generate report
  console.log('\n' + '=' . repeat(60));
  console.log('📊 SCAN COMPLETE - REPORT');
  console.log('=' . repeat(60));
  
  console.log(`\n⏱️  Total Time: ${(totalTime / 1000).toFixed(1)} seconds`);
  console.log(`📈 Total Findings: ${findings.length}`);
  console.log(`📦 Total Artifacts: ${artifacts.length}`);
  
  console.log('\n🔍 Module Performance:');
  for (const [name, result] of Object.entries(results)) {
    const status = result.success ? '✅' : '❌';
    const time = (result.timeMs / 1000).toFixed(1) + 's';
    const findings = result.success ? `${result.findingsCount} findings` : result.error;
    console.log(`  ${status} ${name}: ${time} - ${findings}`);
  }
  
  if (findings.length > 0) {
    console.log('\n🚨 Top Findings by Severity:');
    const bySeverity = {};
    findings.forEach(f => {
      bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
    });
    for (const [sev, count] of Object.entries(bySeverity)) {
      console.log(`  ${sev}: ${count} findings`);
    }
    
    console.log('\n📝 Sample Findings:');
    findings.slice(0, 5).forEach(f => {
      console.log(`  • [${f.severity}] ${f.title}`);
      if (f.description) console.log(`    ${f.description.substring(0, 100)}...`);
    });
  }
  
  if (artifacts.length > 0) {
    console.log('\n📦 Discovered Artifacts:');
    const byType = {};
    artifacts.forEach(a => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });
    for (const [type, count] of Object.entries(byType)) {
      console.log(`  ${type}: ${count}`);
    }
  }
  
  console.log('\n' + '=' . repeat(60));
  console.log('✨ Scan completed successfully!');
}

runCompleteScan().catch(console.error);