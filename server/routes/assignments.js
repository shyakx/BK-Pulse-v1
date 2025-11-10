const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// @route   GET /api/assignments/my-assigned
// @desc    Get assigned customers for logged-in officer (active assignments only)
// @access  Private (Officer only)
router.get('/my-assigned', authenticateToken, requireRole(['retentionOfficer']), async (req, res) => {
  try {
    const { page = 1, limit = 100, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const officerId = req.user.id;

    // Check if churn_score_at_assignment column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customer_assignments' 
      AND column_name = 'churn_score_at_assignment'
    `);
    const hasChurnScoreAtAssignment = columnCheck.rows.length > 0;

    // Get the most recent customer record for each customer
    // This ensures we get the latest churn_score and risk_level
    // Priority is based on churn_score_at_assignment (stable) not current churn_score (dynamic)
    // customer_assignments.customer_id references customers.id (primary key)
    // We use a subquery to get the most recent customer record by customer_id string
    // This matches the logic used in the individual customer API endpoint
    // Include ALL assigned customers (with or without tasks) - My Tasks page shows complete portfolio
    // Customers with tasks will have their task info merged on the frontend
    let query = `
      SELECT 
        c_latest.*,
        ca.assigned_at,
        ca.expires_at${hasChurnScoreAtAssignment ? ', ca.churn_score_at_assignment' : ''}
      FROM customer_assignments ca
      INNER JOIN customers c_assigned ON ca.customer_id = c_assigned.id
      INNER JOIN LATERAL (
        SELECT *
        FROM customers
        WHERE customer_id = c_assigned.customer_id
        ORDER BY updated_at DESC NULLS LAST, id DESC
        LIMIT 1
      ) c_latest ON true
      WHERE ca.officer_id = $1 
        AND ca.is_active = true
        AND ca.expires_at > CURRENT_TIMESTAMP
    `;
    const params = [officerId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      query += ` AND (c_latest.customer_id ILIKE $${paramCount} OR c_latest.name ILIKE $${paramCount} OR c_latest.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Count total - build a proper COUNT query that works with LATERAL join
    // Include ALL assigned customers (with or without tasks)
    let countQuery = `
      SELECT COUNT(DISTINCT c_latest.id) as count
      FROM customer_assignments ca
      INNER JOIN customers c_assigned ON ca.customer_id = c_assigned.id
      INNER JOIN LATERAL (
        SELECT *
        FROM customers
        WHERE customer_id = c_assigned.customer_id
        ORDER BY updated_at DESC NULLS LAST, id DESC
        LIMIT 1
      ) c_latest ON true
      WHERE ca.officer_id = $1 
        AND ca.is_active = true
        AND ca.expires_at > CURRENT_TIMESTAMP
    `;
    const countParams = [officerId];
    if (search) {
      countQuery += ` AND (c_latest.customer_id ILIKE $2 OR c_latest.name ILIKE $2 OR c_latest.email ILIKE $2)`;
      countParams.push(`%${search}%`);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.count || 0);

    // Get paginated results, ordered by churn score (high to low) - prioritize high-risk customers first
    // Use churn_score_at_assignment if available (stable score at assignment time), otherwise use current churn_score
    // Secondary sort by account balance (highest first) to prioritize high-value customers
    paramCount++;
    if (hasChurnScoreAtAssignment) {
      query += ` ORDER BY COALESCE(ca.churn_score_at_assignment, c_latest.churn_score) DESC NULLS LAST, COALESCE(c_latest.account_balance, 0) DESC, c_latest.id ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    } else {
      query += ` ORDER BY COALESCE(c_latest.churn_score, 0) DESC NULLS LAST, COALESCE(c_latest.account_balance, 0) DESC, c_latest.id ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    }
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Add metadata to indicate if predictions are from ML model
    // Check if updated_at is recent (within last 7 days) to indicate likely ML predictions
    const customersWithMetadata = result.rows.map(customer => {
      const updatedAt = customer.updated_at ? new Date(customer.updated_at) : null;
      const now = new Date();
      const daysSinceUpdate = updatedAt ? Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24)) : null;
      
      // If updated within last 7 days, likely from ML prediction
      // If older or null, might be from random generation
      const isRecentPrediction = updatedAt && daysSinceUpdate !== null && daysSinceUpdate <= 7;
      
      return {
        ...customer,
        _metadata: {
          isRecentPrediction,
          daysSinceUpdate,
          predictionSource: isRecentPrediction ? 'ml_model' : 'unknown'
        }
      };
    });

    // Disable caching to ensure fresh data (churn scores can change frequently)
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({
      success: true,
      customers: customersWithMetadata,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching assigned customers:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned customers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/assignments/assign
// @desc    Manually assign customers to officers (Admin/Manager only)
// @access  Private (Admin, Manager)
router.post('/assign', authenticateToken, requireRole(['admin', 'retentionManager']), async (req, res) => {
  try {
    const { customer_ids, officer_id } = req.body;

    if (!customer_ids || !Array.isArray(customer_ids) || customer_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'customer_ids array is required'
      });
    }

    if (!officer_id) {
      return res.status(400).json({
        success: false,
        message: 'officer_id is required'
      });
    }

    // Verify officer exists and is a retentionOfficer
    const officerCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [officer_id, 'retentionOfficer']
    );

    if (officerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Officer not found'
      });
    }

    // Check if churn_score_at_assignment column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customer_assignments' 
      AND column_name = 'churn_score_at_assignment'
    `);
    const hasChurnScoreAtAssignment = columnCheck.rows.length > 0;

    const assignedAt = new Date();
    const expiresAt = new Date(assignedAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const assignments = [];
    for (const customerId of customer_ids) {
      try {
        let insertQuery, insertParams;
        
        if (hasChurnScoreAtAssignment) {
          // Get current churn_score for this customer to store at assignment time
          const customerResult = await pool.query(
            `SELECT churn_score FROM customers WHERE id = $1 ORDER BY updated_at DESC, id DESC LIMIT 1`,
            [customerId]
          );
          const churnScoreAtAssignment = customerResult.rows[0]?.churn_score || null;

          insertQuery = `INSERT INTO customer_assignments (customer_id, officer_id, assigned_at, expires_at, is_active, churn_score_at_assignment)
                         VALUES ($1, $2, $3, $4, true, $5)
                         ON CONFLICT (customer_id, officer_id, expires_at) DO NOTHING`;
          insertParams = [customerId, officer_id, assignedAt, expiresAt, churnScoreAtAssignment];
        } else {
          insertQuery = `INSERT INTO customer_assignments (customer_id, officer_id, assigned_at, expires_at, is_active)
                         VALUES ($1, $2, $3, $4, true)
                         ON CONFLICT (customer_id, officer_id, expires_at) DO NOTHING`;
          insertParams = [customerId, officer_id, assignedAt, expiresAt];
        }

        await pool.query(insertQuery, insertParams);
        assignments.push(customerId);
      } catch (err) {
        console.error(`Error assigning customer ${customerId}:`, err);
      }
    }

    res.json({
      success: true,
      message: `Assigned ${assignments.length} customers`,
      assigned_count: assignments.length
    });
  } catch (error) {
    console.error('Error assigning customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign customers',
      error: error.message
    });
  }
});

// @route   POST /api/assignments/auto-assign
// @desc    Auto-assign Current account customers to officers and create tasks (100 per officer, round-robin)
// @desc    Assigns customers with status: Dormant, Inactive, or Active (priority: Dormant → Inactive → Active)
// @desc    Automatically creates tasks in "My Tasks" page for all assigned customers
// @access  Private (Admin only, or can be called by cron)
router.post('/auto-assign', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const CUSTOMERS_PER_OFFICER = 100;

    // Get all active retention officers
    const officersResult = await pool.query(
      "SELECT id FROM users WHERE role = 'retentionOfficer' AND is_active = true ORDER BY id"
    );
    const officers = officersResult.rows;

    if (officers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active retention officers found'
      });
    }

    // Deactivate expired assignments
    await pool.query(
      `UPDATE customer_assignments 
       SET is_active = false 
       WHERE expires_at <= CURRENT_TIMESTAMP AND is_active = true`
    );

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
        c.churn_score DESC NULLS LAST
      LIMIT $1
    `, [officers.length * CUSTOMERS_PER_OFFICER]);

    const availableCustomers = availableCustomersResult.rows;

    if (availableCustomers.length === 0) {
      return res.json({
        success: true,
        message: 'No customers available for assignment',
        assigned_count: 0
      });
    }

    // Check if churn_score_at_assignment column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customer_assignments' 
      AND column_name = 'churn_score_at_assignment'
    `);
    const hasChurnScoreAtAssignment = columnCheck.rows.length > 0;

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

    // Distribute customers round-robin among officers and create tasks
    const assignedAt = new Date();
    const expiresAt = new Date(assignedAt.getTime() + 24 * 60 * 60 * 1000);
    let totalAssigned = 0;
    let totalTasksCreated = 0;

    for (let i = 0; i < availableCustomers.length; i++) {
      const customer = availableCustomers[i];
      const officerIndex = i % officers.length;
      const officerId = officers[officerIndex].id;

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
            }
          }
          
          totalAssigned++;
        }
      } catch (err) {
        console.error(`Error assigning customer ${customer.customer_id}:`, err);
      }
    }

    res.json({
      success: true,
      message: `Auto-assigned ${totalAssigned} customers to ${officers.length} officers and created ${totalTasksCreated} tasks`,
      assigned_count: totalAssigned,
      tasks_created: totalTasksCreated,
      officers_count: officers.length
    });
  } catch (error) {
    console.error('Error auto-assigning customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-assign customers',
      error: error.message
    });
  }
});

// @route   DELETE /api/assignments/:customer_id
// @desc    Remove assignment (when task is created)
// @access  Private (Officer)
router.delete('/:customer_id', authenticateToken, requireRole(['retentionOfficer']), async (req, res) => {
  try {
    const customerId = req.params.customer_id;
    const officerId = req.user.id;

    // Deactivate assignment for this officer
    const result = await pool.query(
      `UPDATE customer_assignments 
       SET is_active = false 
       WHERE customer_id = $1 AND officer_id = $2 AND is_active = true`,
      [customerId, officerId]
    );

    res.json({
      success: true,
      message: 'Assignment removed',
      removed: result.rowCount > 0
    });
  } catch (error) {
    console.error('Error removing assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove assignment',
      error: error.message
    });
  }
});

module.exports = router;

