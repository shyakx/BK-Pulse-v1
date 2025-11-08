const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// @route   GET /api/reports/performance
// @desc    Generate performance report
// @access  Private (Officer, Manager, Admin)
router.get('/performance', authenticateToken, requireRole(['retentionOfficer', 'retentionManager', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate, officer_id } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (startDate && endDate) {
      paramCount++;
      whereClause += ` AND a.created_at BETWEEN $${paramCount} AND $${paramCount + 1}`;
      params.push(startDate, endDate);
      paramCount++;
    }

    if (officer_id) {
      paramCount++;
      whereClause += ` AND a.officer_id = $${paramCount}`;
      params.push(officer_id);
    }

    // Get actions summary
    const actionsSummary = await pool.query(`
      SELECT 
        COUNT(*) as total_actions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority
      FROM actions a
      ${whereClause}
    `, params);

    // Get customer retention summary
    const retentionSummary = await pool.query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk,
        COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk,
        AVG(churn_score) as avg_churn_score,
        SUM(account_balance) as total_balance
      FROM customers c
      ${officer_id ? `WHERE assigned_officer_id = $1` : ''}
    `, officer_id ? [officer_id] : []);

    // Get recommendations summary
    const recommendationsSummary = await pool.query(`
      SELECT 
        COUNT(*) as total_recommendations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented,
        AVG(confidence_score) as avg_confidence
      FROM recommendations
    `);

    res.json({
      success: true,
      report: {
        type: 'performance',
        period: {
          start: startDate || null,
          end: endDate || null
        },
        actions: actionsSummary.rows[0],
        retention: retentionSummary.rows[0],
        recommendations: recommendationsSummary.rows[0],
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate performance report',
      error: error.message
    });
  }
});

// @route   GET /api/reports/customer
// @desc    Generate customer churn report
// @access  Private (Officer, Analyst, Manager, Admin)
router.get('/customer', authenticateToken, requireRole(['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    const { segment, branch, risk_level } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (segment) {
      paramCount++;
      whereClause += ` AND segment = $${paramCount}`;
      params.push(segment);
    }

    if (branch) {
      paramCount++;
      whereClause += ` AND branch = $${paramCount}`;
      params.push(branch);
    }

    if (risk_level) {
      paramCount++;
      whereClause += ` AND risk_level = $${paramCount}`;
      params.push(risk_level);
    }

    const customersReport = await pool.query(`
      SELECT 
        customer_id,
        name,
        email,
        phone,
        segment,
        branch,
        product_type,
        account_balance,
        churn_score,
        risk_level,
        created_at
      FROM customers
      ${whereClause}
      ORDER BY churn_score DESC
      LIMIT 1000
    `, params);

    res.json({
      success: true,
      report: {
        type: 'customer',
        filters: { segment, branch, risk_level },
        customers: customersReport.rows.map(row => ({
          customer_id: row.customer_id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          segment: row.segment,
          branch: row.branch,
          product_type: row.product_type,
          account_balance: parseFloat(row.account_balance) || 0,
          churn_score: parseFloat(row.churn_score) || 0,
          risk_level: row.risk_level,
          created_at: row.created_at
        })),
        total: customersReport.rows.length,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating customer report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate customer report',
      error: error.message
    });
  }
});

module.exports = router;

