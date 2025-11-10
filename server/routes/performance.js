const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/performance
// @desc    Get performance metrics for the current user (officer)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only retention officers have personal performance metrics
    if (userRole !== 'retentionOfficer') {
      return res.status(403).json({
        success: false,
        message: 'Performance metrics are only available for retention officers'
      });
    }

    // Get date range (default to last 30 days)
    const { startDate, endDate } = req.query;
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `AND a.created_at BETWEEN $2 AND $3`;
    } else {
      dateFilter = `AND a.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    // Get task completion stats
    let taskStats;
    if (startDate && endDate) {
      taskStats = await pool.query(`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN 1 END) as overdue_tasks,
          COUNT(CASE WHEN status = 'pending' AND due_date = CURRENT_DATE THEN 1 END) as due_today
        FROM actions
        WHERE officer_id = $1 AND created_at BETWEEN $2 AND $3
      `, [userId, startDate, endDate]);
    } else {
      taskStats = await pool.query(`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN 1 END) as overdue_tasks,
          COUNT(CASE WHEN status = 'pending' AND due_date = CURRENT_DATE THEN 1 END) as due_today
        FROM actions
        WHERE officer_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      `, [userId]);
    }

    // Get retention notes count
    let notesStats;
    if (startDate && endDate) {
      notesStats = await pool.query(`
        SELECT COUNT(*) as total_notes
        FROM retention_notes
        WHERE officer_id = $1 AND created_at BETWEEN $2 AND $3
      `, [userId, startDate, endDate]);
    } else {
      notesStats = await pool.query(`
        SELECT COUNT(*) as total_notes
        FROM retention_notes
        WHERE officer_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      `, [userId]);
    }

    // Get customer retention stats (customers assigned to this officer)
    const retentionStats = await pool.query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN churn_score >= 70 THEN 1 END) as high_risk_customers,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_count,
        AVG(churn_score) as avg_churn_score
      FROM customers
      WHERE assigned_officer_id = $1
    `, [userId]);

    // Get monthly trend data (last 6 months)
    const monthlyTrend = await pool.query(`
      SELECT 
        DATE_TRUNC('month', a.created_at) as month,
        COUNT(*) as tasks_completed
      FROM actions a
      WHERE a.officer_id = $1 
        AND a.status = 'completed'
        AND a.created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', a.created_at)
      ORDER BY month ASC
    `, [userId]);

    // Calculate success rate (completed / total tasks)
    const taskData = taskStats.rows[0];
    const completionRate = taskData.total_tasks > 0 
      ? ((taskData.completed_tasks / taskData.total_tasks) * 100).toFixed(1)
      : 0;

    // Get recent successful retentions (customers with reduced churn risk)
    const recentSuccesses = await pool.query(`
      SELECT 
        c.customer_id,
        c.name as customer_name,
        c.churn_score,
        c.risk_level,
        a.created_at as action_date,
        a.action_type,
        a.description
      FROM customers c
      LEFT JOIN actions a ON c.id = a.customer_id AND a.officer_id = $1
      WHERE c.assigned_officer_id = $1
        AND c.churn_score < 50
        AND c.risk_level IN ('low', 'medium')
      ORDER BY a.created_at DESC
      LIMIT 5
    `, [userId]);

    res.json({
      success: true,
      performance: {
        tasks: {
          total: parseInt(taskData.total_tasks) || 0,
          completed: parseInt(taskData.completed_tasks) || 0,
          overdue: parseInt(taskData.overdue_tasks) || 0,
          dueToday: parseInt(taskData.due_today) || 0,
          completionRate: parseFloat(completionRate)
        },
        notes: {
          total: parseInt(notesStats.rows[0].total_notes) || 0
        },
        customers: {
          total: parseInt(retentionStats.rows[0].total_customers) || 0,
          highRisk: parseInt(retentionStats.rows[0].high_risk_count) || 0,
          avgChurnScore: parseFloat(retentionStats.rows[0].avg_churn_score) || 0
        },
        monthlyTrend: monthlyTrend.rows.map(row => ({
          month: row.month,
          tasksCompleted: parseInt(row.tasks_completed) || 0
        })),
        recentSuccesses: recentSuccesses.rows.map(row => ({
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          churn_score: parseFloat(row.churn_score) || 0,
          risk_level: row.risk_level,
          action_date: row.action_date,
          action_type: row.action_type,
          description: row.description
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance data',
      error: error.message
    });
  }
});

// @route   GET /api/performance/leaderboard
// @desc    Get leaderboard for retention officers
// @access  Private (Officer, Manager, Admin)
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;

    // Only officers, managers, and admins can see leaderboard
    if (!['retentionOfficer', 'retentionManager', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view the leaderboard'
      });
    }

    // Get date range (default to last 30 days)
    const { period = 'month' } = req.query;
    
    // Determine date interval based on period
    let intervalDays = 30;
    switch (period) {
      case 'week':
        intervalDays = 7;
        break;
      case 'month':
        intervalDays = 30;
        break;
      case 'quarter':
        intervalDays = 90;
        break;
      default:
        intervalDays = 30;
    }

    // Get leaderboard data - optimized with subqueries for better performance
    // Using parameterized queries for date filtering
    const leaderboard = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COALESCE(task_stats.tasks_completed, 0) as tasks_completed,
        COALESCE(task_stats.total_tasks, 0) as total_tasks,
        COALESCE(note_stats.notes_count, 0) as notes_count,
        COALESCE(customer_stats.customers_retained, 0) as customers_retained,
        CASE 
          WHEN COALESCE(task_stats.total_tasks, 0) > 0 
          THEN ROUND((COALESCE(task_stats.tasks_completed, 0)::DECIMAL / task_stats.total_tasks * 100), 1)
          ELSE 0
        END as completion_rate
      FROM users u
      LEFT JOIN (
        SELECT 
          officer_id,
          COUNT(*) FILTER (WHERE status = 'completed') as tasks_completed,
          COUNT(*) as total_tasks
        FROM actions
        WHERE created_at >= CURRENT_DATE - INTERVAL '${intervalDays} days'
        GROUP BY officer_id
      ) task_stats ON u.id = task_stats.officer_id
      LEFT JOIN (
        SELECT 
          officer_id,
          COUNT(*) as notes_count
        FROM retention_notes
        WHERE created_at >= CURRENT_DATE - INTERVAL '${intervalDays} days'
        GROUP BY officer_id
      ) note_stats ON u.id = note_stats.officer_id
      LEFT JOIN (
        SELECT 
          assigned_officer_id,
          COUNT(*) FILTER (WHERE risk_level = 'low') as customers_retained
        FROM customers
        WHERE assigned_officer_id IS NOT NULL
        GROUP BY assigned_officer_id
      ) customer_stats ON u.id = customer_stats.assigned_officer_id
      WHERE u.role = 'retentionOfficer'
      ORDER BY COALESCE(task_stats.tasks_completed, 0) DESC, 
               CASE 
                 WHEN COALESCE(task_stats.total_tasks, 0) > 0 
                 THEN (COALESCE(task_stats.tasks_completed, 0)::DECIMAL / task_stats.total_tasks * 100)
                 ELSE 0
               END DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      leaderboard: leaderboard.rows.map((row, index) => ({
        rank: index + 1,
        officer_id: row.id,
        officer_name: row.name || row.email || 'Unknown',
        email: row.email,
        tasks_completed: parseInt(row.tasks_completed) || 0,
        notes_count: parseInt(row.notes_count) || 0,
        customers_retained: parseInt(row.customers_retained) || 0,
        completion_rate: parseFloat(row.completion_rate) || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
});

module.exports = router;

