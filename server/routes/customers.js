const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { transformCustomerForPrediction } = require('../utils/mlPredictor');
const { predictChurn } = require('../utils/mlPredictor');

// @route   GET /api/customers
// @desc    Get all customers with filters
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      segment = null,
      risk_level = null,
      branch = null,
      min_churn_score = null,
      max_churn_score = null
    } = req.query;

    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (customer_id ILIKE $${paramCount} OR name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (segment) {
      paramCount++;
      query += ` AND segment = $${paramCount}`;
      params.push(segment);
    }

    if (risk_level) {
      paramCount++;
      query += ` AND risk_level = $${paramCount}`;
      params.push(risk_level);
    }

    if (branch) {
      paramCount++;
      query += ` AND branch = $${paramCount}`;
      params.push(branch);
    }

    if (min_churn_score !== null) {
      paramCount++;
      query += ` AND churn_score >= $${paramCount}`;
      params.push(parseFloat(min_churn_score));
    }

    if (max_churn_score !== null) {
      paramCount++;
      query += ` AND churn_score <= $${paramCount}`;
      params.push(parseFloat(max_churn_score));
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    paramCount++;
    query += ` ORDER BY churn_score DESC NULLS LAST, id ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
});

// @route   GET /api/customers/stats/summary
// @desc    Get customer statistics summary
// @access  Private
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk,
        COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk,
        AVG(churn_score) as avg_churn_score
      FROM customers
      WHERE churn_score IS NOT NULL
    `);

    res.json({
      success: true,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// @route   GET /api/customers/:id/shap
// @desc    Get SHAP values for a customer prediction
// @access  Private
router.get('/:id/shap', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.id;

    const result = await pool.query(
      'SELECT * FROM customers WHERE customer_id = $1 OR id::text = $1',
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const dbCustomer = result.rows[0];
    const customerData = transformCustomerForPrediction(dbCustomer);

    // Get prediction with SHAP values
    const prediction = await predictChurn(customerData, true); // include_shap = true

    res.json({
      success: true,
      customer_id: dbCustomer.customer_id,
      shap_values: prediction.shap_values || []
    });
  } catch (error) {
    console.error('SHAP calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate SHAP values',
      error: error.message
    });
  }
});

// @route   GET /api/customers/:id/recommendations
// @desc    Get ML-based recommendations for a customer
// @access  Private
router.get('/:id/recommendations', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.id;

    const result = await pool.query(
      'SELECT * FROM customers WHERE customer_id = $1 OR id::text = $1',
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Customer not found' 
      });
    }

    const dbCustomer = result.rows[0];
    const customerData = transformCustomerForPrediction(dbCustomer);

    // Get prediction with SHAP values
    const prediction = await predictChurn(customerData, true);
    
    // Generate recommendations based on prediction and SHAP values
    const { generateRecommendations } = require('../utils/recommendationEngine');
    const recommendations = generateRecommendations(
      dbCustomer,
      prediction,
      prediction.shap_values || []
    );

    // Optionally save recommendations to database
    if (recommendations.length > 0) {
      // Delete old recommendations for this customer
      await pool.query(
        'DELETE FROM recommendations WHERE customer_id = $1 AND status = $2',
        [dbCustomer.id, 'pending']
      );

      // Insert new recommendations
      for (const rec of recommendations) {
        await pool.query(
          `INSERT INTO recommendations 
           (customer_id, model_version, recommended_action, confidence_score, expected_impact, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            dbCustomer.id,
            'v2.1',
            rec.action,
            rec.confidence,
            rec.priority,
            'pending'
          ]
        );
      }
    }

    res.json({
      success: true,
      customer_id: dbCustomer.customer_id,
      recommendations: recommendations,
      prediction: {
        churn_score: prediction.churn_score,
        risk_level: prediction.risk_level
      }
    });
  } catch (error) {
    console.error('Recommendation generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message
    });
  }
});

// @route   GET /api/customers/:id
// @desc    Get customer by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.id;

    // Try to match by customer_id first (string), then by id (integer cast to text)
    const result = await pool.query(
      'SELECT * FROM customers WHERE customer_id = $1 OR id::text = $1',
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      customer: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
});

// @route   POST /api/customers/:id/predict
// @desc    Update customer prediction
// @access  Private (Officer, Analyst, Manager, Admin)
router.post('/:id/predict', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.id;

    const result = await pool.query(
      'SELECT * FROM customers WHERE customer_id = $1 OR id::text = $1',
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const dbCustomer = result.rows[0];
    const customerData = transformCustomerForPrediction(dbCustomer);

    const prediction = await predictChurn(customerData);

    await pool.query(
      'UPDATE customers SET churn_score = $1, risk_level = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [prediction.churn_score, prediction.risk_level, dbCustomer.id]
    );

    res.json({
      success: true,
      customer_id: dbCustomer.customer_id,
      prediction
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate prediction',
      error: error.message
    });
  }
});


module.exports = router;
