/**
 * Auto-Assign High-Risk Customers to Officers
 * This script should be run every 24 hours (via cron or scheduled task)
 * 
 * Usage:
 *   node server/scripts/autoAssignCustomers.js
 * 
 * Or set up as cron job:
 *   0 0 * * * cd /path/to/project && node server/scripts/autoAssignCustomers.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

const CUSTOMERS_PER_OFFICER = 100;

async function autoAssignCustomers() {
  console.log('🚀 Starting auto-assignment of high-risk customers...\n');
  
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Get all active retention officers
    const officersResult = await pool.query(
      "SELECT id, name, email FROM users WHERE role = 'retentionOfficer' AND is_active = true ORDER BY id"
    );
    const officers = officersResult.rows;

    if (officers.length === 0) {
      console.log('❌ No active retention officers found. Exiting.');
      await pool.end();
      return;
    }

    console.log(`📋 Found ${officers.length} active retention officers\n`);

    // Deactivate expired assignments
    const expiredResult = await pool.query(
      `UPDATE customer_assignments 
       SET is_active = false 
       WHERE expires_at <= CURRENT_TIMESTAMP AND is_active = true
       RETURNING id`
    );
    console.log(`🔄 Deactivated ${expiredResult.rowCount} expired assignments\n`);

    // Get customers that are:
    // 1. High risk (churn_score >= 70)
    // 2. Not currently in active assignments
    // 3. Not already assigned to an officer in the last 24 hours (to avoid duplicates)
    const availableCustomersResult = await pool.query(`
      SELECT DISTINCT c.id, c.customer_id, c.name, c.churn_score
      FROM customers c
      WHERE c.churn_score >= 70
        AND c.id NOT IN (
          SELECT customer_id 
          FROM customer_assignments 
          WHERE is_active = true 
            AND expires_at > CURRENT_TIMESTAMP
        )
        AND c.id NOT IN (
          SELECT customer_id 
          FROM customer_assignments 
          WHERE assigned_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
        )
      ORDER BY c.churn_score DESC
      LIMIT $1
    `, [officers.length * CUSTOMERS_PER_OFFICER]);

    const availableCustomers = availableCustomersResult.rows;
    console.log(`📊 Found ${availableCustomers.length} available high-risk customers\n`);

    if (availableCustomers.length === 0) {
      console.log('✅ No customers available for assignment. All high-risk customers are already assigned.');
      await pool.end();
      return;
    }

    // Distribute customers round-robin among officers
    const assignedAt = new Date();
    const expiresAt = new Date(assignedAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    let totalAssigned = 0;
    const assignmentsByOfficer = {};

    for (let i = 0; i < availableCustomers.length; i++) {
      const customer = availableCustomers[i];
      const officerIndex = i % officers.length;
      const officerId = officers[officerIndex].id;
      const officerName = officers[officerIndex].name;

      try {
        await pool.query(
          `INSERT INTO customer_assignments (customer_id, officer_id, assigned_at, expires_at, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (customer_id, officer_id, expires_at) DO NOTHING`,
          [customer.id, officerId, assignedAt, expiresAt]
        );
        
        totalAssigned++;
        if (!assignmentsByOfficer[officerName]) {
          assignmentsByOfficer[officerName] = 0;
        }
        assignmentsByOfficer[officerName]++;
      } catch (err) {
        console.error(`❌ Error assigning customer ${customer.customer_id} to ${officerName}:`, err.message);
      }
    }

    console.log(`\n✅ Successfully assigned ${totalAssigned} customers to ${officers.length} officers\n`);
    console.log('📊 Assignments by officer:');
    Object.entries(assignmentsByOfficer).forEach(([name, count]) => {
      console.log(`   ${name}: ${count} customers`);
    });
    console.log(`\n⏰ Assignments expire at: ${expiresAt.toISOString()}\n`);

  } catch (error) {
    console.error('\n❌ Error during auto-assignment:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  autoAssignCustomers()
    .then(() => {
      console.log('✅ Auto-assignment completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Auto-assignment failed:', error);
      process.exit(1);
    });
}

module.exports = autoAssignCustomers;

