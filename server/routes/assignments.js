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

    let query = `
      SELECT 
        c.*,
        ca.assigned_at,
        ca.expires_at
      FROM customer_assignments ca
      INNER JOIN customers c ON ca.customer_id = c.id
      WHERE ca.officer_id = $1 
        AND ca.is_active = true
        AND ca.expires_at > CURRENT_TIMESTAMP
        AND c.churn_score >= 70
    `;
    const params = [officerId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      query += ` AND (c.customer_id ILIKE $${paramCount} OR c.name ILIKE $${paramCount} OR c.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Count total
    const countQuery = query.replace('SELECT c.*, ca.assigned_at, ca.expires_at', 'SELECT COUNT(*) as count');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results, ordered by churn_score DESC
    paramCount++;
    query += ` ORDER BY c.churn_score DESC NULLS LAST, c.id ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      customers: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching assigned customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned customers',
      error: error.message
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

    const assignedAt = new Date();
    const expiresAt = new Date(assignedAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const assignments = [];
    for (const customerId of customer_ids) {
      try {
        await pool.query(
          `INSERT INTO customer_assignments (customer_id, officer_id, assigned_at, expires_at, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (customer_id, officer_id, expires_at) DO NOTHING`,
          [customerId, officer_id, assignedAt, expiresAt]
        );
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
// @desc    Auto-assign high-risk customers to officers (100 per officer, round-robin)
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

    if (availableCustomers.length === 0) {
      return res.json({
        success: true,
        message: 'No customers available for assignment',
        assigned_count: 0
      });
    }

    // Distribute customers round-robin among officers
    const assignedAt = new Date();
    const expiresAt = new Date(assignedAt.getTime() + 24 * 60 * 60 * 1000);
    let totalAssigned = 0;

    for (let i = 0; i < availableCustomers.length; i++) {
      const customer = availableCustomers[i];
      const officerIndex = i % officers.length;
      const officerId = officers[officerIndex].id;

      try {
        await pool.query(
          `INSERT INTO customer_assignments (customer_id, officer_id, assigned_at, expires_at, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (customer_id, officer_id, expires_at) DO NOTHING`,
          [customer.id, officerId, assignedAt, expiresAt]
        );
        totalAssigned++;
      } catch (err) {
        console.error(`Error assigning customer ${customer.customer_id}:`, err);
      }
    }

    res.json({
      success: true,
      message: `Auto-assigned ${totalAssigned} customers to ${officers.length} officers`,
      assigned_count: totalAssigned,
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

