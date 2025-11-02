/**
 * Quick script to check current customer count in database
 * Usage: node server/scripts/checkCustomerCount.js
 */

const pool = require('../config/database');

async function checkCount() {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM customers');
    const count = parseInt(result.rows[0].count || 0);
    console.log(`\n📊 Current customer count: ${count.toLocaleString()}\n`);
    
    // Get breakdown by risk level
    const riskBreakdown = await pool.query(`
      SELECT 
        risk_level,
        COUNT(*) as count
      FROM customers
      WHERE risk_level IS NOT NULL
      GROUP BY risk_level
      ORDER BY risk_level
    `);
    
    console.log('📈 Risk Level Distribution:');
    riskBreakdown.rows.forEach(row => {
      console.log(`   ${row.risk_level || 'null'}: ${parseInt(row.count).toLocaleString()}`);
    });
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCount();

