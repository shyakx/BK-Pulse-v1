/**
 * Test dashboard API to see what customer count it returns
 * Usage: node server/scripts/testDashboardAPI.js
 */

const pool = require('../config/database');

async function testDashboard() {
  try {
    console.log('🧪 Testing Dashboard Data...\n');
    
    // Test same query as dashboard endpoint
    const totalCustomersResult = await pool.query('SELECT COUNT(*) as count FROM customers');
    const totalCustomers = parseInt(totalCustomersResult.rows[0]?.count || 0);
    
    console.log(`📊 Total Customers (as dashboard sees): ${totalCustomers.toLocaleString()}\n`);
    
    // Also check assigned customers for officers
    const assignedResult = await pool.query('SELECT COUNT(*) as count FROM customers WHERE assigned_officer_id IS NOT NULL');
    const assigned = parseInt(assignedResult.rows[0]?.count || 0);
    
    console.log(`👤 Assigned Customers: ${assigned.toLocaleString()}\n`);
    
    // Check risk distribution
    const riskResult = await pool.query(`
      SELECT 
        risk_level,
        COUNT(*) as count
      FROM customers
      WHERE risk_level IS NOT NULL
      GROUP BY risk_level
    `);
    
    console.log('📈 Risk Distribution:');
    riskResult.rows.forEach(row => {
      console.log(`   ${row.risk_level}: ${parseInt(row.count).toLocaleString()}`);
    });
    
    console.log('\n✅ Dashboard data check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testDashboard();

