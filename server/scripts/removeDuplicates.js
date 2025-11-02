/**
 * Remove duplicate customers, keeping the oldest record (lowest id)
 * Usage: node server/scripts/removeDuplicates.js
 * 
 * WARNING: This will delete duplicate records. Make sure to backup first!
 */

const pool = require('../config/database');

async function removeDuplicates() {
  try {
    console.log('🔍 Checking for duplicates...\n');
    
    // First, check how many duplicates exist
    const duplicateCheck = await pool.query(`
      SELECT customer_id, COUNT(*) as count
      FROM customers
      GROUP BY customer_id
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateCheck.rows.length === 0) {
      console.log('✅ No duplicates found. Nothing to remove.\n');
      await pool.end();
      return;
    }
    
    const totalDuplicates = duplicateCheck.rows.reduce((sum, row) => sum + (parseInt(row.count) - 1), 0);
    console.log(`⚠️  Found ${duplicateCheck.rows.length} customer_id groups with duplicates`);
    console.log(`📊 Total duplicate records to remove: ${totalDuplicates.toLocaleString()}\n`);
    
    // Confirm before proceeding
    console.log('🗑️  Removing duplicates (keeping the record with lowest id)...\n');
    
    // Remove duplicates, keeping the one with the lowest id
    const result = await pool.query(`
      DELETE FROM customers
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM customers
        GROUP BY customer_id
      )
    `);
    
    const deletedCount = result.rowCount;
    console.log(`✅ Removed ${deletedCount.toLocaleString()} duplicate records\n`);
    
    // Verify final count
    const finalCount = await pool.query('SELECT COUNT(*) as count FROM customers');
    console.log(`📊 Final customer count: ${parseInt(finalCount.rows[0].count).toLocaleString()}\n`);
    
    // Verify no duplicates remain
    const verifyDuplicates = await pool.query(`
      SELECT customer_id, COUNT(*) as count
      FROM customers
      GROUP BY customer_id
      HAVING COUNT(*) > 1
    `);
    
    if (verifyDuplicates.rows.length === 0) {
      console.log('✅ Verification: No duplicates remain!\n');
    } else {
      console.log('⚠️  Warning: Some duplicates may still exist. Please check manually.\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.error('\n💡 Make sure you are connected to the correct database.\n');
    }
  } finally {
    await pool.end();
  }
}

// Add confirmation prompt (simple yes/no check)
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  This will delete duplicate records. Continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    removeDuplicates();
  } else {
    console.log('❌ Operation cancelled.\n');
    process.exit(0);
  }
  rl.close();
});
