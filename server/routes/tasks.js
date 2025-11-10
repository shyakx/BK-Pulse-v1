const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/tasks
// @desc    Get all tasks with filters (uses actions table)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      customer_id = null,
      status = null,
      priority = null,
      search = ''
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        a.*,
        c.customer_id as customer_customer_id,
        c.name as customer_name,
        c.email as customer_email,
        c.segment as customer_segment,
        c.branch as customer_branch,
        c.churn_score as customer_churn_score,
        c.risk_level as customer_risk_level,
        c.account_balance as customer_account_balance,
        c.product_type as customer_product_type,
        u.name as officer_name
      FROM actions a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN users u ON a.officer_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filter by officer (officers can only see their own tasks)
    if (req.user.role === 'retentionOfficer') {
      paramCount++;
      query += ` AND a.officer_id = $${paramCount}`;
      params.push(req.user.id);
    }

    if (customer_id) {
      paramCount++;
      query += ` AND (a.customer_id = $${paramCount} OR c.customer_id = $${paramCount})`;
      params.push(customer_id);
    }

    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
    }

    if (priority) {
      paramCount++;
      query += ` AND a.priority = $${paramCount}`;
      params.push(priority);
    }

    if (search) {
      paramCount++;
      query += ` AND (a.description ILIKE $${paramCount} OR a.action_type ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Count total - build count query separately to avoid string replacement issues
    let countQuery = `
      SELECT COUNT(*) as count
      FROM actions a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN users u ON a.officer_id = u.id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    // Apply same filters for count query
    if (req.user.role === 'retentionOfficer') {
      countParamCount++;
      countQuery += ` AND a.officer_id = $${countParamCount}`;
      countParams.push(req.user.id);
    }

    if (customer_id) {
      countParamCount++;
      countQuery += ` AND (a.customer_id = $${countParamCount} OR c.customer_id = $${countParamCount})`;
      countParams.push(customer_id);
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND a.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (priority) {
      countParamCount++;
      countQuery += ` AND a.priority = $${countParamCount}`;
      countParams.push(priority);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (a.description ILIKE $${countParamCount} OR a.action_type ILIKE $${countParamCount} OR c.name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.count || 0);

    // Get paginated results
    paramCount++;
    query += ` ORDER BY 
      CASE a.priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
      END,
      a.due_date ASC NULLS LAST,
      a.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Format response
    const tasks = result.rows.map(row => ({
      id: row.id,
      customer_id: row.customer_id,
      customer_customer_id: row.customer_customer_id,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      customer_segment: row.customer_segment,
      customer_branch: row.customer_branch,
      customer_churn_score: row.customer_churn_score,
      customer_risk_level: row.customer_risk_level,
      customer_account_balance: row.customer_account_balance,
      customer_product_type: row.customer_product_type,
      officer_id: row.officer_id,
      officer_name: row.officer_name,
      action_type: row.action_type,
      description: row.description,
      status: row.status,
      priority: row.priority,
      due_date: row.due_date,
      outcome: row.outcome,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    res.json({
      success: true,
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;

    const result = await pool.query(
      `SELECT 
        a.*,
        c.customer_id as customer_customer_id,
        c.name as customer_name,
        u.name as officer_name
      FROM actions a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN users u ON a.officer_id = u.id
      WHERE a.id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const task = result.rows[0];

    // Check permissions
    if (req.user.role === 'retentionOfficer' && task.officer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this task'
      });
    }

    res.json({
      success: true,
      task: {
        id: task.id,
        customer_id: task.customer_id,
        customer_customer_id: task.customer_customer_id,
        customer_name: task.customer_name,
        officer_id: task.officer_id,
        officer_name: task.officer_name,
        action_type: task.action_type,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        outcome: task.outcome,
        created_at: task.created_at,
        updated_at: task.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: error.message
    });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      customer_id, 
      action_type = 'Task', 
      description, 
      priority = 'medium', 
      due_date,
      status = 'pending'
    } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    // Resolve customer_id if provided (could be customer.id or customer.customer_id)
    let customerDbId = null;
    if (customer_id) {
      if (typeof customer_id === 'string') {
        const customerResult = await pool.query(
          'SELECT id FROM customers WHERE customer_id = $1',
          [customer_id]
        );
        if (customerResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Customer not found'
          });
        }
        customerDbId = customerResult.rows[0].id;
      } else {
        customerDbId = customer_id;
      }
    }

    // Default officer_id to current user if not specified
    const officerId = req.body.officer_id || req.user.id;

    // Get customer details to determine priority if not provided
    let finalPriority = priority;
    let finalDueDate = due_date;
    if (customerDbId) {
      const customerResult = await pool.query(
        'SELECT churn_score, risk_level FROM customers WHERE id = $1',
        [customerDbId]
      );
      if (customerResult.rows.length > 0) {
        const customer = customerResult.rows[0];
        // Set priority based on churn_score if not provided
        if (!priority || priority === 'medium') {
          if (customer.churn_score >= 70 || customer.risk_level === 'high') {
            finalPriority = 'high';
          } else if (customer.churn_score >= 50 || customer.risk_level === 'medium') {
            finalPriority = 'medium';
          } else {
            finalPriority = 'low';
          }
        }
        // Set default due_date to 3 days from now if not provided
        if (!due_date) {
          const defaultDueDate = new Date();
          defaultDueDate.setDate(defaultDueDate.getDate() + 3);
          finalDueDate = defaultDueDate.toISOString().split('T')[0];
        }
      }
    }

    const result = await pool.query(
      `INSERT INTO actions (customer_id, officer_id, action_type, description, status, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [customerDbId, officerId, action_type, description || `Task for customer ${customerDbId}`, status, finalPriority, finalDueDate || null]
    );

    // Keep assignment active when task is created (assignments don't expire when converted to task)
    // The assignment will be filtered out from Analysis page by excluding customers with active tasks
    // This allows the assignment to remain for tracking purposes while removing it from the view

    // Get full task with customer details
    const fullResult = await pool.query(
      `SELECT 
        a.*,
        c.customer_id as customer_customer_id,
        c.name as customer_name,
        u.name as officer_name
      FROM actions a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN users u ON a.officer_id = u.id
      WHERE a.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      success: true,
      task: {
        id: fullResult.rows[0].id,
        customer_id: fullResult.rows[0].customer_id,
        customer_customer_id: fullResult.rows[0].customer_customer_id,
        customer_name: fullResult.rows[0].customer_name,
        officer_id: fullResult.rows[0].officer_id,
        officer_name: fullResult.rows[0].officer_name,
        action_type: fullResult.rows[0].action_type,
        description: fullResult.rows[0].description,
        status: fullResult.rows[0].status,
        priority: fullResult.rows[0].priority,
        due_date: fullResult.rows[0].due_date,
        outcome: fullResult.rows[0].outcome,
        created_at: fullResult.rows[0].created_at,
        updated_at: fullResult.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
});

// @route   PATCH /api/tasks/:id/complete
// @desc    Mark a task as completed
// @access  Private
router.patch('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { outcome } = req.body;

    // Check if task exists
    const existingResult = await pool.query(
      'SELECT * FROM actions WHERE id = $1',
      [taskId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const existingTask = existingResult.rows[0];

    // Check permissions
    if (req.user.role === 'retentionOfficer' && existingTask.officer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to complete this task'
      });
    }

    const result = await pool.query(
      `UPDATE actions 
       SET status = 'completed', outcome = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [outcome || null, taskId]
    );

    // Get full task with customer details
    const fullResult = await pool.query(
      `SELECT 
        a.*,
        c.customer_id as customer_customer_id,
        c.name as customer_name,
        u.name as officer_name
      FROM actions a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN users u ON a.officer_id = u.id
      WHERE a.id = $1`,
      [taskId]
    );

    res.json({
      success: true,
      task: {
        id: fullResult.rows[0].id,
        customer_id: fullResult.rows[0].customer_id,
        customer_customer_id: fullResult.rows[0].customer_customer_id,
        customer_name: fullResult.rows[0].customer_name,
        officer_id: fullResult.rows[0].officer_id,
        officer_name: fullResult.rows[0].officer_name,
        action_type: fullResult.rows[0].action_type,
        description: fullResult.rows[0].description,
        status: fullResult.rows[0].status,
        priority: fullResult.rows[0].priority,
        due_date: fullResult.rows[0].due_date,
        outcome: fullResult.rows[0].outcome,
        created_at: fullResult.rows[0].created_at,
        updated_at: fullResult.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete task',
      error: error.message
    });
  }
});

// @route   PATCH /api/tasks/:id
// @desc    Update a task
// @access  Private
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { action_type, description, status, priority, due_date, outcome } = req.body;

    // Check if task exists
    const existingResult = await pool.query(
      'SELECT * FROM actions WHERE id = $1',
      [taskId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const existingTask = existingResult.rows[0];

    // Check permissions
    if (req.user.role === 'retentionOfficer' && existingTask.officer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this task'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (action_type !== undefined) {
      paramCount++;
      updates.push(`action_type = $${paramCount}`);
      params.push(action_type);
    }

    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description);
    }

    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (priority !== undefined) {
      paramCount++;
      updates.push(`priority = $${paramCount}`);
      params.push(priority);
    }

    if (due_date !== undefined) {
      paramCount++;
      updates.push(`due_date = $${paramCount}`);
      params.push(due_date || null);
    }

    if (outcome !== undefined) {
      paramCount++;
      updates.push(`outcome = $${paramCount}`);
      params.push(outcome || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    paramCount++;
    params.push(taskId);

    const updateQuery = `
      UPDATE actions 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    await pool.query(updateQuery, params);

    // Get full task with customer details
    const fullResult = await pool.query(
      `SELECT 
        a.*,
        c.customer_id as customer_customer_id,
        c.name as customer_name,
        u.name as officer_name
      FROM actions a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN users u ON a.officer_id = u.id
      WHERE a.id = $1`,
      [taskId]
    );

    res.json({
      success: true,
      task: {
        id: fullResult.rows[0].id,
        customer_id: fullResult.rows[0].customer_id,
        customer_customer_id: fullResult.rows[0].customer_customer_id,
        customer_name: fullResult.rows[0].customer_name,
        officer_id: fullResult.rows[0].officer_id,
        officer_name: fullResult.rows[0].officer_name,
        action_type: fullResult.rows[0].action_type,
        description: fullResult.rows[0].description,
        status: fullResult.rows[0].status,
        priority: fullResult.rows[0].priority,
        due_date: fullResult.rows[0].due_date,
        outcome: fullResult.rows[0].outcome,
        created_at: fullResult.rows[0].created_at,
        updated_at: fullResult.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;

    // Check if task exists
    const existingResult = await pool.query(
      'SELECT * FROM actions WHERE id = $1',
      [taskId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const existingTask = existingResult.rows[0];

    // Check permissions
    if (req.user.role === 'retentionOfficer' && existingTask.officer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this task'
      });
    }

    // Delete the task
    await pool.query('DELETE FROM actions WHERE id = $1', [taskId]);

    // If officer deleted the task, reactivate the assignment so customer goes back to Analysis page
    if (req.user.role === 'retentionOfficer' && existingTask.customer_id) {
      // Check if there's already an active assignment
      const activeAssignmentCheck = await pool.query(
        `SELECT id FROM customer_assignments 
         WHERE customer_id = $1 AND officer_id = $2 AND is_active = true
         LIMIT 1`,
        [existingTask.customer_id, req.user.id]
      );

      if (activeAssignmentCheck.rows.length === 0) {
        // No active assignment exists, check for expired one to reactivate
        const expiredAssignmentCheck = await pool.query(
          `SELECT id FROM customer_assignments 
           WHERE customer_id = $1 AND officer_id = $2 
           ORDER BY expires_at DESC LIMIT 1`,
          [existingTask.customer_id, req.user.id]
        );

        if (expiredAssignmentCheck.rows.length > 0) {
          // Reactivate the most recent assignment
          const assignedAt = new Date();
          const expiresAt = new Date(assignedAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
          
          await pool.query(
            `UPDATE customer_assignments 
             SET is_active = true, assigned_at = $1, expires_at = $2
             WHERE id = $3`,
            [assignedAt, expiresAt, expiredAssignmentCheck.rows[0].id]
          );
        } else {
          // Create a new assignment
          const assignedAt = new Date();
          const expiresAt = new Date(assignedAt.getTime() + 24 * 60 * 60 * 1000);
          
          await pool.query(
            `INSERT INTO customer_assignments (customer_id, officer_id, assigned_at, expires_at, is_active)
             VALUES ($1, $2, $3, $4, true)`,
            [existingTask.customer_id, req.user.id, assignedAt, expiresAt]
          );
        }
      }
      // If active assignment already exists, no need to do anything
    }

    res.json({
      success: true,
      message: 'Task deleted successfully. Customer has been returned to your Analysis page.'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
});

module.exports = router;

