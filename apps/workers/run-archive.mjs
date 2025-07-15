#!/usr/bin/env node

// Database archival script - archives existing data and cleans production tables
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runArchival() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('🚀 Starting database archival...');
    
    // Check current data
    const artifacts = await client.query('SELECT COUNT(*) as count FROM artifacts');
    const findings = await client.query('SELECT COUNT(*) as count FROM findings');
    const scans = await client.query('SELECT COUNT(*) as count FROM scans_master');
    
    const artCount = parseInt(artifacts.rows[0].count);
    const findCount = parseInt(findings.rows[0].count);
    const scanCount = parseInt(scans.rows[0].count);
    
    console.log(`📊 Current data: ${artCount} artifacts, ${findCount} findings, ${scanCount} scans`);
    
    if (artCount === 0 && findCount === 0 && scanCount === 0) {
      console.log('✅ Database is already clean - no archival needed');
      return;
    }
    
    console.log('📦 Creating archive tables and copying data...');
    
    // Create archive tables and copy data in one operation
    await client.query('CREATE TABLE IF NOT EXISTS artifacts_archive AS SELECT *, NOW() as archived_at FROM artifacts');
    await client.query('CREATE TABLE IF NOT EXISTS findings_archive AS SELECT *, NOW() as archived_at FROM findings');
    await client.query('CREATE TABLE IF NOT EXISTS scans_master_archive AS SELECT *, NOW() as archived_at FROM scans_master');
    
    console.log('✅ Data archived successfully');
    
    // Verify archive
    const verifyArt = await client.query('SELECT COUNT(*) as count FROM artifacts_archive');
    const verifyFind = await client.query('SELECT COUNT(*) as count FROM findings_archive');
    const verifyScan = await client.query('SELECT COUNT(*) as count FROM scans_master_archive');
    
    console.log(`🔍 Archive verification: ${verifyArt.rows[0].count} artifacts, ${verifyFind.rows[0].count} findings, ${verifyScan.rows[0].count} scans`);
    
    // Clean production tables
    console.log('🧹 Cleaning production tables...');
    await client.query('TRUNCATE findings CASCADE');
    await client.query('TRUNCATE artifacts CASCADE');
    await client.query('TRUNCATE scans_master CASCADE');
    await client.query('DELETE FROM worker_instances');
    
    // Reset sequences
    await client.query('ALTER SEQUENCE IF EXISTS artifacts_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE IF EXISTS findings_id_seq RESTART WITH 1');
    
    console.log('🎉 ARCHIVAL COMPLETE!');
    console.log(`📊 Summary: Archived ${artCount} artifacts, ${findCount} findings, ${scanCount} scans`);
    console.log('💡 Archive tables: artifacts_archive, findings_archive, scans_master_archive');
    console.log('✨ Production database is now clean and ready for fresh scans');
    
  } catch (error) {
    console.error('❌ Archival failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runArchival();