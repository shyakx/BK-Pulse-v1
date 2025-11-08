/**
 * Create Customer Assignments Table
 * This script creates the customer_assignments table if it doesn't exist
 * 
 * Usage:
 *   node server/scripts/createAssignmentsTable.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');
const fs = require('fs');

async function createAssignmentsTable() {
  console.log('🚀 Creating customer_assignments table...\n');
  
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '../sql/add_customer_assignments_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    await pool.query(sql);
    
    console.log('✅ Table created successfully!\n');
    
    // Verify table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customer_assignments'
      );
    `);
    
    if (result.rows[0].exists) {
      console.log('✅ Verification: customer_assignments table exists\n');
      
      // Check indexes
      const indexesResult = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'customer_assignments'
      `);
      
      console.log(`📊 Created ${indexesResult.rows.length} indexes:`);
      indexesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.indexname}`);
      });
      console.log('\n');
    } else {
      console.log('❌ Warning: Table verification failed\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error creating table:', error.message);
    if (error.code === '42P07') {
      console.log('ℹ️  Table already exists. This is okay.\n');
    } else {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  createAssignmentsTable()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = createAssignmentsTable;

