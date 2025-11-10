/**
 * Run Database Migration
 * Updates customers table schema to match model requirements
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const MIGRATION_FILE = path.join(__dirname, '../sql/update_customers_schema_for_model.sql');

async function runMigration() {
  console.log('🚀 Starting database migration...\n');
  
  try {
    // Check database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Read migration SQL file
    if (!fs.existsSync(MIGRATION_FILE)) {
      throw new Error(`Migration file not found: ${MIGRATION_FILE}`);
    }
    
    console.log(`📖 Reading migration file: ${MIGRATION_FILE}\n`);
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    
    // Remove comments and split by semicolon, but keep multi-line statements together
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
    
    // Split by semicolon, but handle multi-line statements
    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.match(/^\s*$/));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim().length === 0) continue;
      
      try {
        // Show first 50 chars of statement for logging
        const preview = statement.substring(0, 50).replace(/\s+/g, ' ');
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}: ${preview}...`);
        await pool.query(statement);
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error) {
        // Some errors are expected (like "column already exists" or "index already exists")
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('does not exist') && error.message.includes('relation')) {
          console.log(`⚠️  Statement ${i + 1} skipped (expected): ${error.message.split('\n')[0]}\n`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error(`Statement was: ${statement.substring(0, 200)}...`);
          throw error;
        }
      }
    }
    
    // Verify migration by checking columns
    console.log('🔍 Verifying migration...\n');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    
    console.log(`✅ Migration complete! Found ${result.rows.length} columns in customers table:\n`);
    console.table(result.rows.map(r => ({
      column: r.column_name,
      type: r.data_type,
      nullable: r.is_nullable,
      default: r.column_default || 'none'
    })));
    
    // Check for required columns
    const requiredColumns = [
      'gender', 'nationality', 'currency', 'account_status',
      'age', 'tenure_months', 'num_products', 'has_credit_card',
      'transaction_frequency', 'average_transaction_value',
      'mobile_banking_usage', 'branch_visits', 'complaint_history',
      'account_age_months', 'days_since_last_transaction', 'activity_score',
      'account_open_date', 'last_transaction_date'
    ];
    
    const existingColumns = result.rows.map(r => r.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`\n⚠️  Warning: ${missingColumns.length} required columns are still missing:`);
      missingColumns.forEach(col => console.log(`   - ${col}`));
    } else {
      console.log(`\n✅ All required columns are present!`);
    }
    
    console.log('\n✅ Migration verification complete!\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };

