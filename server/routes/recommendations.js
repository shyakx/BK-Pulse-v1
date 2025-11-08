const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// @route   GET /api/recommendations
// @desc    Get all recommendations with filters
// @access  Private (Officer, Analyst, Manager, Admin)
router.get('/', authenticateToken, requireRole(['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status = null,
      officer_id = null,
      min_confidence = null,
      search = ''
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        r.*,
        c.customer_id,
        c.name as customer_name,
        c.email,
        c.churn_score,
        c.risk_level,
        c.account_balance,
        u.name as officer_name,
        uo.name as approved_by_name
      FROM recommendations r
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN users u ON c.assigned_officer_id = u.id
      LEFT JOIN users uo ON r.approved_by = uo.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
    }

    if (officer_id) {
      paramCount++;
      query += ` AND c.assigned_officer_id = $${paramCount}`;
      params.push(officer_id);
    }

    if (min_confidence) {
      paramCount++;
      query += ` AND r.confidence_score >= $${paramCount}`;
      params.push(parseFloat(min_confidence));
    }

    if (search) {
      paramCount++;
      query += ` AND (c.name ILIKE $${paramCount} OR c.customer_id ILIKE $${paramCount} OR r.recommended_action ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Count total
    const countQuery = query.replace(
      'SELECT r.*, c.customer_id, c.name as customer_name, c.email, c.churn_score, c.risk_level, c.account_balance, u.name as officer_name, uo.name as approved_by_name',
      'SELECT COUNT(*)'
    );
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || 0);

    // Get paginated results
    paramCount++;
    query += ` ORDER BY r.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Get statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        AVG(confidence_score) as avg_confidence
      FROM recommendations
    `);

    const stats = statsResult.rows[0];

    res.json({
      success: true,
      recommendations: result.rows.map(row => ({
        id: row.id,
        customer_id: row.customer_id,
        customer_name: row.customer_name,
        customer_email: row.email,
        churn_score: parseFloat(row.churn_score) || 0,
        risk_level: row.risk_level,
        account_balance: parseFloat(row.account_balance) || 0,
        recommended_action: row.recommended_action,
        confidence_score: parseFloat(row.confidence_score) || 0,
        expected_impact: row.expected_impact,
        status: row.status,
        model_version: row.model_version,
        officer_name: row.officer_name,
        approved_by_name: row.approved_by_name,
        approved_at: row.approved_at,
        created_at: row.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      statistics: {
        total: parseInt(stats.total || 0),
        pending: parseInt(stats.pending || 0),
        approved: parseInt(stats.approved || 0),
        implemented: parseInt(stats.implemented || 0),
        rejected: parseInt(stats.rejected || 0),
        avg_confidence: parseFloat(stats.avg_confidence || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
});

// @route   PATCH /api/recommendations/:id/status
// @desc    Update recommendation status (approve/reject/implement)
// @access  Private (Manager, Admin)
router.patch('/:id/status', authenticateToken, requireRole(['retentionManager', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'implemented'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, or implemented'
      });
    }

    const updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];
    
    if (status === 'approved' || status === 'implemented') {
      updateFields.push('approved_by = $2', 'approved_at = CURRENT_TIMESTAMP');
      params.push(req.user.id);
    }

    params.push(id);

    const result = await pool.query(
      `UPDATE recommendations 
       SET ${updateFields.join(', ')}
       WHERE id = $${params.length}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    res.json({
      success: true,
      recommendation: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating recommendation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recommendation status',
      error: error.message
    });
  }
});

module.exports = router;

