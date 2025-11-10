/**
 * Delete All Customers Script
 * This script deletes all customer data from the database
 * 
 * WARNING: This will delete ALL customers and related data!
 * 
 * Usage:
 *   node server/scripts/deleteAllCustomers.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

async function deleteAllCustomers() {
  console.log('🗑️  Starting deletion of all customer data...\n');
  
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Get current counts
    const customerCount = await pool.query('SELECT COUNT(*) as count FROM customers');
    const assignmentCount = await pool.query('SELECT COUNT(*) as count FROM customer_assignments');
    const actionCount = await pool.query('SELECT COUNT(*) as count FROM actions WHERE customer_id IS NOT NULL');
    const noteCount = await pool.query('SELECT COUNT(*) as count FROM retention_notes WHERE customer_id IS NOT NULL');
    
    console.log('📊 Current data counts:');
    console.log(`   - Customers: ${customerCount.rows[0].count}`);
    console.log(`   - Assignments: ${assignmentCount.rows[0].count}`);
    console.log(`   - Actions/Tasks: ${actionCount.rows[0].count}`);
    console.log(`   - Retention Notes: ${noteCount.rows[0].count}\n`);
    
    // Confirm deletion
    console.log('⚠️  WARNING: This will delete ALL customer data and related records!');
    console.log('   This includes:');
    console.log('   - All customers');
    console.log('   - All customer assignments');
    console.log('   - All actions/tasks linked to customers');
    console.log('   - All retention notes linked to customers');
    console.log('   - All recommendations linked to customers\n');
    
    // Delete in order to respect foreign key constraints
    console.log('🗑️  Deleting related data first...\n');
    
    // 1. Delete retention notes (references customers)
    const notesResult = await pool.query('DELETE FROM retention_notes WHERE customer_id IS NOT NULL');
    console.log(`   ✅ Deleted ${notesResult.rowCount} retention notes`);
    
    // 2. Delete actions/tasks (references customers)
    const actionsResult = await pool.query('DELETE FROM actions WHERE customer_id IS NOT NULL');
    console.log(`   ✅ Deleted ${actionsResult.rowCount} actions/tasks`);
    
    // 3. Delete customer assignments (references customers)
    const assignmentsResult = await pool.query('DELETE FROM customer_assignments');
    console.log(`   ✅ Deleted ${assignmentsResult.rowCount} customer assignments`);
    
    // 4. Delete recommendations (references customers)
    const recommendationsResult = await pool.query('DELETE FROM recommendations WHERE customer_id IS NOT NULL');
    console.log(`   ✅ Deleted ${recommendationsResult.rowCount} recommendations`);
    
    // 5. Delete campaign targets if table exists (references customers)
    try {
      const campaignTargetsResult = await pool.query('DELETE FROM campaign_targets');
      console.log(`   ✅ Deleted ${campaignTargetsResult.rowCount} campaign targets`);
    } catch (err) {
      // Table might not exist, that's okay
      console.log('   ℹ️  Campaign targets table not found (skipping)');
    }
    
    // 6. Finally, delete all customers
    console.log('\n🗑️  Deleting all customers...');
    const customersResult = await pool.query('DELETE FROM customers');
    console.log(`   ✅ Deleted ${customersResult.rowCount} customers\n`);
    
    // Verify deletion
    const verifyCount = await pool.query('SELECT COUNT(*) as count FROM customers');
    console.log(`✅ Verification: ${verifyCount.rows[0].count} customers remaining\n`);
    
    if (parseInt(verifyCount.rows[0].count) === 0) {
      console.log('🎉 All customer data deleted successfully!');
      console.log('\n💡 You can now:');
      console.log('   1. Generate new customers using the admin panel');
      console.log('   2. Run predictions to get fresh ML-based churn scores');
      console.log('   3. Assign customers to officers');
    } else {
      console.log('⚠️  Warning: Some customers may still exist. Check for foreign key constraints.');
    }
    
  } catch (error) {
    console.error('\n❌ Error during deletion:', error);
    console.error('   Error details:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  deleteAllCustomers()
    .then(() => {
      console.log('\n✅ Deletion completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Deletion failed:', error);
      process.exit(1);
    });
}

module.exports = deleteAllCustomers;

