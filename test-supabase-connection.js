#!/usr/bin/env node

// Test Supabase connection
const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl ? '✓ Found' : '✗ Missing');
console.log('Key:', supabaseKey ? `✓ Found (${supabaseKey.substring(0, 20)}...)` : '✗ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials!');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check scan_status table
    console.log('\n1. Testing scan_status table...');
    const { data: scans, error: scanError } = await supabase
      .from('scan_status')
      .select('scan_id')
      .limit(1);
    
    if (scanError) {
      console.error('❌ scan_status error:', scanError.message);
    } else {
      console.log('✓ scan_status table accessible');
    }

    // Test 2: Check if artifacts table exists
    console.log('\n2. Testing artifacts table...');
    const { data: artifacts, error: artifactError } = await supabase
      .from('artifacts')
      .select('id')
      .limit(1);
    
    if (artifactError) {
      if (artifactError.message.includes('relation "public.artifacts" does not exist')) {
        console.log('⚠️  artifacts table does not exist - need to run migration');
      } else {
        console.error('❌ artifacts error:', artifactError.message);
      }
    } else {
      console.log('✓ artifacts table exists');
    }

    // Test 3: Check if findings table exists
    console.log('\n3. Testing findings table...');
    const { data: findings, error: findingError } = await supabase
      .from('findings')
      .select('id')
      .limit(1);
    
    if (findingError) {
      console.error('❌ findings error:', findingError.message);
    } else {
      console.log('✓ findings table accessible');
    }

    console.log('\n✅ Connection test complete!');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
  }
}

testConnection();