// Set minimal env vars
process.env.SHODAN_API_KEY = 'test';
process.env.OPENAI_API_KEY = 'test';

async function quickTest() {
  const domain = 'vulnerable-test-site.vercel.app';
  
  console.log(`Testing scan speed on ${domain}...\n`);
  
  // Test config exposure scanner (doesn't need external APIs)
  try {
    console.log('Running Config Exposure Scanner...');
    const start = Date.now();
    const { runConfigExposureScanner } = await import('./dist/modules/configExposureScanner.js');
    const result = await Promise.race([
      runConfigExposureScanner({ domain }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
    ]);
    const elapsed = Date.now() - start;
    
    console.log(`✅ Config scanner completed in ${elapsed}ms with ${result} findings\n`);
  } catch (error) {
    console.error('Config scanner failed:', error.message);
  }
  
  // Test endpoint discovery  
  try {
    console.log('Running Endpoint Discovery (limited crawl)...');
    const start = Date.now();
    const { runEndpointDiscovery } = await import('./dist/modules/endpointDiscovery.js');
    
    // Set a timeout to prevent infinite crawling
    const result = await Promise.race([
      runEndpointDiscovery({ domain }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
    ]);
    const elapsed = Date.now() - start;
    
    console.log(`✅ Endpoint discovery completed in ${elapsed}ms with ${result} findings\n`);
  } catch (error) {
    if (error.message === 'Timeout') {
      console.log('⏱️ Endpoint discovery timed out after 15s (crawling many pages)\n');
    } else {
      console.error('Endpoint discovery failed:', error.message);
    }
  }
}

quickTest().catch(console.error);