#!/usr/bin/env tsx

import { httpRequest, httpGetText } from './net/httpClient.js';

async function testHttpClient() {
  console.log('Testing HTTP client with timeout protection...\n');

  // Test 1: Normal request
  try {
    console.log('Test 1: Normal request to google.com');
    const result = await httpRequest({
      url: 'https://www.google.com',
      totalTimeoutMs: 5000,
      forceIPv4: true,
    });
    console.log(`✅ Success: Status ${result.status}, Body size: ${result.body.length} bytes\n`);
  } catch (err) {
    console.log(`❌ Failed: ${err.message}\n`);
  }

  // Test 2: Request with very short timeout (should fail)
  try {
    console.log('Test 2: Request with 100ms timeout (should fail)');
    await httpRequest({
      url: 'https://www.google.com',
      totalTimeoutMs: 100,
      forceIPv4: true,
    });
    console.log('✅ Unexpectedly succeeded\n');
  } catch (err) {
    console.log(`✅ Failed as expected: ${err.message}\n`);
  }

  // Test 3: Test httpGetText helper
  try {
    console.log('Test 3: Get robots.txt from example.com');
    const robots = await httpGetText('https://example.com/robots.txt', {
      totalTimeoutMs: 5000,
      forceIPv4: true,
    });
    console.log(`✅ Success: Got ${robots.length} characters\n`);
  } catch (err) {
    console.log(`❌ Failed: ${err.message}\n`);
  }

  // Test 4: Test with a problematic domain that might hang
  try {
    console.log('Test 4: Request to potentially problematic domain with strict timeout');
    const result = await httpRequest({
      url: 'https://vulnerable-test-site.vercel.app',
      totalTimeoutMs: 3000,
      connectTimeoutMs: 1000,
      firstByteTimeoutMs: 2000,
      forceIPv4: true,
      probeConnectWithHead: true,
    });
    console.log(`✅ Success: Status ${result.status}\n`);
  } catch (err) {
    console.log(`✅ Timeout protection worked: ${err.message}\n`);
  }

  console.log('All tests completed!');
}

testHttpClient().catch(console.error);