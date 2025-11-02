/**
 * Test database connection script
 * Run with: node server/scripts/testDBConnection.js
 */

// Load .env from server directory
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

async function testConnection() {
  console.log('Testing database connection...\n');
  console.log('Configuration:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.DB_PORT || 5432}`);
  console.log(`  Database: ${process.env.DB_NAME || 'bk_pulse'}`);
  console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? '***' : 'not set'}\n`);

  try {
    // Test basic connection
    console.log('Attempting connection...');
    const result = await pool.query('SELECT version()');
    console.log('✅ Connection successful!\n');
    console.log('PostgreSQL Version:');
    console.log(result.rows[0].version);
    
    // Test if database exists
    const dbCheck = await pool.query(
      "SELECT datname FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'bk_pulse']
    );
    
    if (dbCheck.rows.length > 0) {
      console.log(`\n✅ Database '${process.env.DB_NAME || 'bk_pulse'}' exists`);
      
      // Test if tables exist
      const tableCheck = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      if (tableCheck.rows.length > 0) {
        console.log('\n✅ Tables found:');
        tableCheck.rows.forEach(row => {
          console.log(`   - ${row.table_name}`);
        });
      } else {
        console.log('\n⚠️  No tables found. Run schema.sql to create tables.');
      }
    } else {
      console.log(`\n⚠️  Database '${process.env.DB_NAME || 'bk_pulse'}' does not exist.`);
      console.log('   Create it with: createdb -U postgres bk_pulse');
    }
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Ensure PostgreSQL service is running');
      console.error('2. Check if PostgreSQL is listening on the correct port');
      console.error('3. Verify connection settings in server/.env file');
      console.error('4. Try: Test-NetConnection -ComputerName localhost -Port 5432');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist. Create it:');
      console.error('   createdb -U postgres bk_pulse');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed. Check username/password in .env');
    }
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();

