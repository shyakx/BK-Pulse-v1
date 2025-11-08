/**
 * Add 12 Retention Officers with Rwandan Names
 * This script adds officers to the database if they don't already exist
 * 
 * Usage:
 *   node server/scripts/addOfficers.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');
const fs = require('fs');

async function addOfficers() {
  console.log('🚀 Adding 12 retention officers...\n');
  
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '../sql/add_officers.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    await pool.query(sql);
    
    // Verify officers were added
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_officers,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_officers
      FROM users 
      WHERE role = 'retentionOfficer'
    `);
    
    const { total_officers, active_officers } = result.rows[0];
    
    console.log(`✅ Officers added successfully!\n`);
    console.log(`📊 Total officers: ${total_officers}`);
    console.log(`📊 Active officers: ${active_officers}\n`);
    
    // List all officers
    const officersResult = await pool.query(`
      SELECT id, email, name, is_active
      FROM users 
      WHERE role = 'retentionOfficer'
      ORDER BY id
    `);
    
    console.log('👥 List of officers:');
    officersResult.rows.forEach((officer, index) => {
      console.log(`   ${index + 1}. ${officer.name} (${officer.email}) - ${officer.is_active ? 'Active' : 'Inactive'}`);
    });
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Error adding officers:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  addOfficers()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = addOfficers;

