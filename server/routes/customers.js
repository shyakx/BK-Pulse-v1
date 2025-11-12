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
    
    // Use CTE to get the most recent customer record for each customer_id
    // This ensures we get the latest churn_score and risk_level, matching the detail page logic
    let query = `
      WITH latest_customers AS (
        SELECT DISTINCT ON (customer_id) *
        FROM customers
        ORDER BY customer_id, updated_at DESC NULLS LAST, id DESC
      )
      SELECT * FROM latest_customers WHERE 1=1
    `;
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

    // Count total - need to adjust for CTE
    const countQuery = query.replace('SELECT * FROM latest_customers', 'SELECT COUNT(*) FROM latest_customers');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    paramCount++;
    query += ` ORDER BY churn_score DESC NULLS LAST, id ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Add metadata to indicate prediction freshness
    // Predictions updated within last 7 days are likely from ML model
    const customersWithMetadata = result.rows.map(customer => {
      const updatedAt = customer.updated_at ? new Date(customer.updated_at) : null;
      const now = new Date();
      const daysSinceUpdate = updatedAt ? Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24)) : null;
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
    const { refresh } = req.query; // Optional: refresh prediction

    // Try to match by customer_id first (string), then by id (integer cast to text)
    // Order by updated_at DESC to get the most recent record if duplicates exist
    const result = await pool.query(
      'SELECT * FROM customers WHERE customer_id = $1 OR id::text = $1 ORDER BY updated_at DESC, id DESC LIMIT 1',
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    let customer = result.rows[0];

    // If refresh parameter is provided, update the prediction
    if (refresh === 'true' || refresh === '1') {
      try {
        const customerData = transformCustomerForPrediction(customer);
        const prediction = await predictChurn(customerData);

        // Log prediction details for debugging
        console.log(`[Prediction Refresh] Customer: ${customer.customer_id}`);
        console.log(`  - Old churn_score: ${customer.churn_score}`);
        console.log(`  - New churn_score: ${prediction.churn_score}`);
        console.log(`  - Old risk_level: ${customer.risk_level}`);
        console.log(`  - New risk_level: ${prediction.risk_level}`);
        console.log(`  - Prediction details:`, JSON.stringify(prediction, null, 2));

        // Ensure churn_score is a number (handle both integer and decimal)
        const churnScore = typeof prediction.churn_score === 'number' 
          ? prediction.churn_score 
          : parseFloat(prediction.churn_score) || 0;

        await pool.query(
          'UPDATE customers SET churn_score = $1, risk_level = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [churnScore, prediction.risk_level, customer.id]
        );

        // Fetch updated customer data
        const updatedResult = await pool.query(
          'SELECT * FROM customers WHERE id = $1',
          [customer.id]
        );
        if (updatedResult.rows.length > 0) {
          customer = updatedResult.rows[0];
          console.log(`  - Stored churn_score: ${customer.churn_score}`);
        }
      } catch (predictError) {
        console.error('Error refreshing prediction:', predictError);
        // Continue with existing data if prediction fails
      }
    }

    // Disable caching for customer data (especially when refreshed)
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({
      success: true,
      customer: customer
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

    // Get the most recent record (matching detail page logic)
    const result = await pool.query(
      'SELECT * FROM customers WHERE customer_id = $1 OR id::text = $1 ORDER BY updated_at DESC, id DESC LIMIT 1',
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Customer not found' 
      });
    }

    const dbCustomer = result.rows[0];
    
    // Validate customer data before transformation
    if (!dbCustomer.customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer data: missing customer_id'
      });
    }

    let customerData;
    try {
      customerData = transformCustomerForPrediction(dbCustomer);
    } catch (transformError) {
      console.error('Error transforming customer data:', transformError);
      return res.status(400).json({
        success: false,
        message: 'Failed to transform customer data for prediction',
        error: transformError.message
      });
    }

    // Validate transformed data
    if (!customerData || !customerData.Customer_ID) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transformed customer data'
      });
    }

    let prediction;
    try {
      prediction = await predictChurn(customerData);
    } catch (predictError) {
      console.error('Prediction error details:', {
        error: predictError.message,
        stack: predictError.stack,
        customerId: dbCustomer.customer_id,
        customerData: JSON.stringify(customerData, null, 2)
      });
      
      // Return more detailed error information
      return res.status(500).json({
        success: false,
        message: 'Failed to generate prediction',
        error: predictError.message,
        details: process.env.NODE_ENV === 'development' ? predictError.stack : undefined
      });
    }

    // Validate prediction result
    if (!prediction || prediction.churn_score === undefined) {
      console.error('Invalid prediction result:', prediction);
      return res.status(500).json({
        success: false,
        message: 'Prediction returned invalid result',
        prediction: prediction
      });
    }

    // Log prediction details for debugging
    console.log(`[Customer Predict API] Customer: ${dbCustomer.customer_id}`);
    console.log(`  - Old churn_score: ${dbCustomer.churn_score}`);
    console.log(`  - New churn_score: ${prediction.churn_score}`);
    console.log(`  - Risk level: ${prediction.risk_level || 'unknown'}`);

    // Ensure churn_score is a number (handle both integer and decimal)
    const churnScore = typeof prediction.churn_score === 'number' 
      ? prediction.churn_score 
      : parseFloat(prediction.churn_score) || 0;

    // Validate risk_level
    let riskLevel = prediction.risk_level || 'medium';
    if (!['low', 'medium', 'high'].includes(riskLevel)) {
      console.warn(`Invalid risk_level: ${riskLevel}, defaulting to medium`);
      riskLevel = 'medium';
    }

    try {
      await pool.query(
        'UPDATE customers SET churn_score = $1, risk_level = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [churnScore, riskLevel, dbCustomer.id]
      );
      
      // Verify the update
      const verifyResult = await pool.query(
        'SELECT churn_score, risk_level FROM customers WHERE id = $1',
        [dbCustomer.id]
      );
      if (verifyResult.rows.length > 0) {
        console.log(`  - Stored churn_score: ${verifyResult.rows[0].churn_score}`);
        console.log(`  - Stored risk_level: ${verifyResult.rows[0].risk_level}`);
      }
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Prediction generated but failed to update database',
        error: dbError.message,
        prediction: prediction
      });
    }

    res.json({
      success: true,
      customer_id: dbCustomer.customer_id,
      prediction: {
        churn_score: churnScore,
        churn_probability: prediction.churn_probability,
        risk_level: riskLevel
      }
    });
  } catch (error) {
    console.error('Unexpected error in prediction endpoint:', {
      error: error.message,
      stack: error.stack,
      customerId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: 'Failed to generate prediction',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


module.exports = router;
