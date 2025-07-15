import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function getRemediationFindings(scanId) {
  try {
    console.log(`🔍 Fetching findings with remediation for scan: ${scanId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Query findings with remediation data
    const query = `
      SELECT 
        f.id as finding_id,
        f.finding_type,
        f.description,
        f.recommendation,
        f.remediation,
        a.severity,
        a.type as artifact_type,
        a.val_text,
        a.src_url
      FROM findings f
      INNER JOIN artifacts a ON f.artifact_id = a.id
      WHERE a.meta->>'scan_id' = $1 
        AND f.remediation IS NOT NULL
      ORDER BY 
        CASE a.severity 
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2  
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
          WHEN 'INFO' THEN 5
          ELSE 6
        END,
        f.created_at DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query, [scanId]);
    
    console.log(`📊 Found ${result.rows.length} findings with remediation data\n`);
    
    if (result.rows.length === 0) {
      console.log('No findings with remediation data found for this scan.');
      return;
    }
    
    // Display each finding with remediation
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. [${row.severity}] ${row.finding_type}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      console.log(`📍 Finding: ${row.val_text}`);
      console.log(`📝 Description: ${row.description}`);
      console.log(`⚠️  Recommendation: ${row.recommendation}`);
      
      if (row.src_url) {
        console.log(`🔗 Source: ${row.src_url}`);
      }
      
      console.log('\n✅ REMEDIATION DETAILS:');
      console.log('───────────────────────');
      
      const remediation = row.remediation;
      
      if (remediation.summary) {
        console.log(`📋 Summary: ${remediation.summary}\n`);
      }
      
      if (remediation.steps && remediation.steps.length > 0) {
        console.log('📌 Steps:');
        remediation.steps.forEach((step, idx) => {
          console.log(`   ${idx + 1}. ${step}`);
        });
        console.log('');
      }
      
      if (remediation.code_example) {
        console.log(`💻 Code Example (${remediation.code_example.language || 'unknown'}):`);
        console.log('```' + (remediation.code_example.language || ''));
        console.log(remediation.code_example.code);
        console.log('```\n');
      }
      
      if (remediation.verification_command) {
        console.log(`🔍 Verification Command:`);
        console.log(`   ${remediation.verification_command}`);
      }
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
    
    // Summary statistics
    const severityCounts = {};
    result.rows.forEach(row => {
      severityCounts[row.severity] = (severityCounts[row.severity] || 0) + 1;
    });
    
    console.log('📊 REMEDIATION SUMMARY:');
    console.log('───────────────────────');
    Object.entries(severityCounts).forEach(([severity, count]) => {
      console.log(`   ${severity}: ${count} findings with remediation`);
    });
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// Run the script
const scanId = process.argv[2] || 'hu-TUdbc_N1';
getRemediationFindings(scanId);