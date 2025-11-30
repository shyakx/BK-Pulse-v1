/**
 * Add Search Indexes for Customer Search Performance
 * This script creates indexes to improve customer search query performance
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const SQL_FILE = path.join(__dirname, '../sql/add_search_indexes.sql');

async function addSearchIndexes() {
  console.log('🚀 Adding search indexes for better performance...\n');
  
  try {
    // Check database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Read SQL file
    if (!fs.existsSync(SQL_FILE)) {
      throw new Error(`SQL file not found: ${SQL_FILE}`);
    }
    
    console.log(`📖 Reading SQL file: ${SQL_FILE}\n`);
    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    
    // Remove comments and split by semicolon
    let cleanedSql = sql
      .split('\n')
      .map(line => {
        // Remove single-line comments
        const commentIndex = line.indexOf('--');
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .join('\n');
    
    // Split by semicolon and filter empty statements
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.match(/^\s*$/));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Show first 60 chars of statement for logging
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}: ${preview}...`);
        await pool.query(statement);
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error) {
        // Some errors are expected (like "index already exists")
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate')) {
          console.log(`⚠️  Statement ${i + 1} skipped (index already exists): ${error.message.split('\n')[0]}\n`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error(`Statement was: ${statement.substring(0, 200)}...`);
          throw error;
        }
      }
    }
    
    // Verify indexes were created
    console.log('🔍 Verifying indexes...\n');
    const result = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'customers' 
      AND indexname LIKE 'idx_customers%search%' 
      OR indexname LIKE 'idx_customers%_prefix'
      OR indexname LIKE 'idx_customers%_lower'
      OR indexname = 'idx_customers_customer_id'
      ORDER BY indexname
    `);
    
    console.log(`✅ Index creation complete! Found ${result.rows.length} search-related indexes:\n`);
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`   - ${row.indexname}`);
      });
    } else {
      console.log('   (Indexes may have different names or already existed)');
    }
    
    console.log('\n🎉 Search indexes added successfully!');
    console.log('   Customer search should now be much faster.\n');
    
  } catch (error) {
    console.error('❌ Failed to add search indexes:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  addSearchIndexes()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addSearchIndexes };

