#!/usr/bin/env node

// Check Supabase schema details
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    // Check artifacts table structure
    console.log('\n📊 Checking artifacts table schema...');
    const { data: artifactSample, error: artifactError } = await supabase
      .from('artifacts')
      .select('*')
      .limit(1);
    
    if (artifactError) {
      console.error('❌ Error:', artifactError.message);
    } else if (artifactSample && artifactSample.length > 0) {
      console.log('✓ Artifacts columns:', Object.keys(artifactSample[0]));
    } else {
      console.log('ℹ️  No artifacts found, but table exists');
    }

    // Check findings table structure  
    console.log('\n📊 Checking findings table schema...');
    const { data: findingSample, error: findingError } = await supabase
      .from('findings')
      .select('*')
      .limit(1);
    
    if (findingError) {
      console.error('❌ Error:', findingError.message);
    } else if (findingSample && findingSample.length > 0) {
      console.log('✓ Findings columns:', Object.keys(findingSample[0]));
    } else {
      console.log('ℹ️  No findings found, but table exists');
    }

    // Check for recent data
    console.log('\n📊 Checking for recent data...');
    const { count: scanCount } = await supabase
      .from('scan_status')
      .select('*', { count: 'exact', head: true })
      .gte('last_updated', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    console.log(`Found ${scanCount || 0} scans updated in the last 24 hours`);

    const { count: findingCount } = await supabase
      .from('findings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    console.log(`Found ${findingCount || 0} findings created in the last 24 hours`);

    // Check if artifacts table has scan_id in meta
    console.log('\n📊 Checking artifacts meta field...');
    const { data: artifactWithMeta } = await supabase
      .from('artifacts')
      .select('id, meta')
      .not('meta', 'is', null)
      .limit(5);
    
    if (artifactWithMeta && artifactWithMeta.length > 0) {
      console.log('Sample artifact meta fields:');
      artifactWithMeta.forEach(a => {
        const keys = a.meta ? Object.keys(a.meta) : [];
        console.log(`  ID ${a.id}: ${keys.join(', ')}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Schema check failed:', error.message);
  }
}

checkSchema();