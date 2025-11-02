/**
 * Test script to check what database the backend is connecting to
 * Run this in Render Shell to verify the connection
 */

const pool = require('../config/database');

async function testConnection() {
  try {
    console.log('🔍 Testing Database Connection...\n');
    
    // Check DATABASE_URL
    console.log('📋 Environment Check:');
    console.log(`   DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL;
      // Hide password in output
      const safeUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
      console.log(`   DATABASE_URL: ${safeUrl}`);
    }
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}\n`);
    
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Get customer count
    const result = await pool.query('SELECT COUNT(*) as count FROM customers');
    const count = parseInt(result.rows[0].count || 0);
    
    console.log(`📊 Customer Count: ${count.toLocaleString()}\n`);
    
    // Get database name
    const dbResult = await pool.query('SELECT current_database() as db_name');
    console.log(`🗄️  Database Name: ${dbResult.rows[0].db_name}\n`);
    
    // Get sample customers
    const sampleResult = await pool.query('SELECT customer_id, name, id FROM customers ORDER BY id LIMIT 5');
    console.log('📝 Sample Customers (first 5):');
    sampleResult.rows.forEach(row => {
      console.log(`   ID: ${row.id}, customer_id: ${row.customer_id}, Name: ${row.name}`);
    });
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();

