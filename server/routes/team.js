const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// @route   GET /api/team
// @desc    Get all team members with their activities and customer assignments
// @access  Private (Manager, Admin)
router.get('/', authenticateToken, requireRole(['retentionManager', 'admin']), async (req, res) => {
  try {
    // Get all active team members
    const usersResult = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at
      FROM users u
      WHERE u.is_active = true
      AND u.role IN ('retentionOfficer', 'retentionAnalyst')
      ORDER BY u.name ASC
    `);

    const teamMembers = await Promise.all(usersResult.rows.map(async (user) => {
      // Get assigned customers count
      const customersResult = await pool.query(
        'SELECT COUNT(*) as count FROM customers WHERE assigned_officer_id = $1',
        [user.id]
      );
      const assignedCustomers = parseInt(customersResult.rows[0]?.count || 0);

      // Get high risk customers
      const highRiskResult = await pool.query(
        'SELECT COUNT(*) as count FROM customers WHERE assigned_officer_id = $1 AND risk_level = $2',
        [user.id, 'high']
      );
      const highRiskCustomers = parseInt(highRiskResult.rows[0]?.count || 0);

      // Get completed tasks count
      const tasksResult = await pool.query(
        'SELECT COUNT(*) as count FROM actions WHERE officer_id = $1 AND status = $2',
        [user.id, 'completed']
      );
      const completedTasks = parseInt(tasksResult.rows[0]?.count || 0);

      // Get pending tasks count
      const pendingTasksResult = await pool.query(
        'SELECT COUNT(*) as count FROM actions WHERE officer_id = $1 AND status IN ($2, $3)',
        [user.id, 'pending', 'in_progress']
      );
      const pendingTasks = parseInt(pendingTasksResult.rows[0]?.count || 0);

      // Get retention notes count
      const notesResult = await pool.query(
        'SELECT COUNT(*) as count FROM retention_notes WHERE officer_id = $1',
        [user.id]
      );
      const notesCount = parseInt(notesResult.rows[0]?.count || 0);

      // Calculate retention rate (low risk / total assigned)
      const retentionRate = assignedCustomers > 0 
        ? Math.round(((assignedCustomers - highRiskCustomers) / assignedCustomers) * 100)
        : 0;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role === 'retentionOfficer' ? 'Retention Officer' : 'Retention Analyst',
        assignedCustomers,
        highRiskCustomers,
        completedTasks,
        pendingTasks,
        notesCount,
        retentionRate,
        joinedDate: user.created_at
      };
    }));

    res.json({
      success: true,
      team: teamMembers
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team data',
      error: error.message
    });
  }
});

// @route   GET /api/team/:id/activities
// @desc    Get activities for a specific team member
// @access  Private (Manager, Admin)
router.get('/:id/activities', authenticateToken, requireRole(['retentionManager', 'admin']), async (req, res) => {
  try {
    const userId = req.params.id;

    // Get recent actions
    const actionsResult = await pool.query(`
      SELECT 
        a.*,
        c.customer_id,
        c.name as customer_name
      FROM actions a
      LEFT JOIN customers c ON a.customer_id = c.id
      WHERE a.officer_id = $1
      ORDER BY a.created_at DESC
      LIMIT 50
    `, [userId]);

    // Get recent retention notes
    const notesResult = await pool.query(`
      SELECT 
        rn.*,
        c.customer_id,
        c.name as customer_name
      FROM retention_notes rn
      LEFT JOIN customers c ON rn.customer_id = c.id
      WHERE rn.officer_id = $1
      ORDER BY rn.created_at DESC
      LIMIT 50
    `, [userId]);

    res.json({
      success: true,
      activities: {
        actions: actionsResult.rows.map(row => ({
          id: row.id,
          type: row.action_type,
          description: row.description,
          status: row.status,
          priority: row.priority,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          due_date: row.due_date,
          created_at: row.created_at
        })),
        notes: notesResult.rows.map(row => ({
          id: row.id,
          note: row.note,
          priority: row.priority,
          status: row.status,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          created_at: row.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching team activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team activities',
      error: error.message
    });
  }
});

// @route   GET /api/team/:id/customers
// @desc    Get customers assigned to a team member
// @access  Private (Manager, Admin)
router.get('/:id/customers', authenticateToken, requireRole(['retentionManager', 'admin']), async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const customersResult = await pool.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT a.id) as actions_count,
        COUNT(DISTINCT rn.id) as notes_count
      FROM customers c
      LEFT JOIN actions a ON c.id = a.customer_id
      LEFT JOIN retention_notes rn ON c.id = rn.customer_id
      WHERE c.assigned_officer_id = $1
      GROUP BY c.id
      ORDER BY c.churn_score DESC, c.name ASC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit), offset]);

    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM customers WHERE assigned_officer_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0]?.count || 0);

    res.json({
      success: true,
      customers: customersResult.rows.map(row => ({
        id: row.id,
        customer_id: row.customer_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        segment: row.segment,
        branch: row.branch,
        churn_score: parseFloat(row.churn_score) || 0,
        risk_level: row.risk_level,
        account_balance: parseFloat(row.account_balance) || 0,
        actions_count: parseInt(row.actions_count) || 0,
        notes_count: parseInt(row.notes_count) || 0
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching team customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team customers',
      error: error.message
    });
  }
});

module.exports = router;

