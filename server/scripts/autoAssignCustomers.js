/**
 * Auto-Assign Current Account Customers to Officers and Create Tasks
 * This script should be run every 24 hours (via cron or scheduled task)
 * 
 * Assignment Rules:
 * - Only Current accounts are assigned (Savings and Fixed Deposit cannot churn per BNR rules)
 * - Assigns customers with status: Dormant, Inactive, or Active
 * - Priority: Dormant → Inactive → Active (within each status, sorted by churn_score DESC)
 * - 100 customers per officer per day
 * - Round-robin distribution among officers
 * - Prevents duplicates (customers not assigned if already assigned in last 24 hours)
 * - Excludes customers that already have active tasks (pending or in_progress)
 * - Automatically creates tasks in "My Tasks" page for all assigned customers
 * - Task priority: Dormant = high, Inactive = medium, Active = low
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
    // 1. Current accounts only (only Current accounts can churn)
    // 2. Account status: Dormant, Inactive, or Active (priority: Dormant → Inactive → Active)
    // 3. Not currently in active assignments
    // 4. Not already assigned to an officer in the last 24 hours (to avoid duplicates)
    // 5. Not already converted to a task (exclude customers with active tasks)
    const availableCustomersResult = await pool.query(`
      SELECT c.id, c.customer_id, c.name, c.churn_score, c.account_status
      FROM customers c
      WHERE c.product_type = 'Current'
        AND c.account_status IN ('Dormant', 'Inactive', 'Active')
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
        AND c.id NOT IN (
          SELECT customer_id 
          FROM actions 
          WHERE customer_id IS NOT NULL 
            AND status IN ('pending', 'in_progress')
        )
      ORDER BY 
        CASE c.account_status
          WHEN 'Dormant' THEN 1
          WHEN 'Inactive' THEN 2
          WHEN 'Active' THEN 3
        END,
        c.churn_score DESC NULLS LAST
      LIMIT $1
    `, [officers.length * CUSTOMERS_PER_OFFICER]);

    const availableCustomers = availableCustomersResult.rows;
    console.log(`📊 Found ${availableCustomers.length} available Current account customers\n`);
    
    // Show breakdown by status
    const statusBreakdown = {};
    availableCustomers.forEach(c => {
      statusBreakdown[c.account_status] = (statusBreakdown[c.account_status] || 0) + 1;
    });
    console.log('📊 Breakdown by status:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    console.log('');
    
    if (availableCustomers.length === 0) {
      console.log('✅ No customers available for assignment. All eligible Current account customers are already assigned or have active tasks.');
      await pool.end();
      return;
    }

    // Check if churn_score_at_assignment column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customer_assignments' 
      AND column_name = 'churn_score_at_assignment'
    `);
    const hasChurnScoreAtAssignment = columnCheck.rows.length > 0;

    // Distribute customers round-robin among officers and create tasks
    const assignedAt = new Date();
    const expiresAt = new Date(assignedAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    let totalAssigned = 0;
    let totalTasksCreated = 0;
    const assignmentsByOfficer = {};
    const tasksByOfficer = {};

    // Helper function to determine task priority based on account_status
    const getTaskPriority = (accountStatus, churnScore) => {
      if (accountStatus === 'Dormant') return 'high';
      if (accountStatus === 'Inactive') return 'medium';
      if (accountStatus === 'Active') {
        // For Active accounts, use churn_score to determine priority
        const score = churnScore !== null && churnScore !== undefined ? parseFloat(churnScore) : null;
        if (score !== null && !isNaN(score)) {
          if (score >= 70) return 'high';
          if (score >= 50) return 'medium';
        }
        return 'low';
      }
      return 'medium';
    };

    // Helper function to generate task description
    const getTaskDescription = (customerName, accountStatus, churnScore) => {
      const statusText = accountStatus === 'Dormant' ? 'Dormant account' : 
                        accountStatus === 'Inactive' ? 'Inactive account' : 
                        'Active account';
      const score = churnScore !== null && churnScore !== undefined ? parseFloat(churnScore) : null;
      const scoreText = score !== null && !isNaN(score) ? ` (Churn Score: ${score.toFixed(1)})` : '';
      return `Retention task for ${customerName} - ${statusText}${scoreText}`;
    };

    // Calculate default due date (3 days from now)
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 3);
    const dueDateStr = defaultDueDate.toISOString().split('T')[0];

    for (let i = 0; i < availableCustomers.length; i++) {
      const customer = availableCustomers[i];
      const officerIndex = i % officers.length;
      const officerId = officers[officerIndex].id;
      const officerName = officers[officerIndex].name;

      try {
        // Step 1: Create assignment record (for tracking)
        let insertQuery, insertParams;
        
        if (hasChurnScoreAtAssignment) {
          insertQuery = `INSERT INTO customer_assignments (customer_id, officer_id, assigned_at, expires_at, is_active, churn_score_at_assignment)
                         VALUES ($1, $2, $3, $4, true, $5)
                         ON CONFLICT (customer_id, officer_id, expires_at) DO NOTHING
                         RETURNING id`;
          insertParams = [customer.id, officerId, assignedAt, expiresAt, customer.churn_score];
        } else {
          insertQuery = `INSERT INTO customer_assignments (customer_id, officer_id, assigned_at, expires_at, is_active)
                         VALUES ($1, $2, $3, $4, true)
                         ON CONFLICT (customer_id, officer_id, expires_at) DO NOTHING
                         RETURNING id`;
          insertParams = [customer.id, officerId, assignedAt, expiresAt];
        }

        const assignmentResult = await pool.query(insertQuery, insertParams);
        
        // Only create task if assignment was successful (not a duplicate)
        if (assignmentResult.rowCount > 0) {
          // Step 2: Create task automatically
          const taskPriority = getTaskPriority(customer.account_status, customer.churn_score);
          const taskDescription = getTaskDescription(
            customer.name || `Customer ${customer.customer_id}`,
            customer.account_status,
            customer.churn_score
          );

          // Check if task already exists to avoid duplicates
          const existingTask = await pool.query(
            `SELECT id FROM actions 
             WHERE customer_id = $1 AND officer_id = $2 
             AND status IN ('pending', 'in_progress') 
             LIMIT 1`,
            [customer.id, officerId]
          );

          if (existingTask.rows.length === 0) {
            const taskResult = await pool.query(
              `INSERT INTO actions (customer_id, officer_id, action_type, description, status, priority, due_date)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               RETURNING id`,
              [customer.id, officerId, 'Task', taskDescription, 'pending', taskPriority, dueDateStr]
            );

            if (taskResult.rowCount > 0) {
              totalTasksCreated++;
              if (!tasksByOfficer[officerName]) {
                tasksByOfficer[officerName] = 0;
              }
              tasksByOfficer[officerName]++;
            }
          }

          totalAssigned++;
          if (!assignmentsByOfficer[officerName]) {
            assignmentsByOfficer[officerName] = 0;
          }
          assignmentsByOfficer[officerName]++;
        }
      } catch (err) {
        console.error(`❌ Error assigning customer ${customer.customer_id} to ${officerName}:`, err.message);
      }
    }

    console.log(`\n✅ Successfully assigned ${totalAssigned} customers to ${officers.length} officers`);
    console.log(`✅ Created ${totalTasksCreated} tasks in "My Tasks" page\n`);
    console.log('📊 Assignments by officer:');
    Object.entries(assignmentsByOfficer).forEach(([name, count]) => {
      const taskCount = tasksByOfficer[name] || 0;
      console.log(`   ${name}: ${count} customers assigned, ${taskCount} tasks created`);
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

