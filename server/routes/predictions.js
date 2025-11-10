const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  predictChurn, 
  predictChurnBatch, 
  transformCustomerForPrediction 
} = require('../utils/mlPredictor');

// @route   POST /api/predictions/single
// @desc    Predict churn for a single customer
// @access  Private (Analyst, Manager, Admin)
router.post('/single', authenticateToken, requireRole(['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    const customerData = req.body.customer_data || req.body;
    const includeShap = req.body.include_shap === true;
    
    if (!customerData) {
      return res.status(400).json({ message: 'Customer data is required' });
    }
    
    const prediction = await predictChurn(customerData, includeShap);
    
    res.json({
      success: true,
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

// @route   POST /api/predictions/customer/:id
// @desc    Predict churn for a customer by ID
// @access  Private
router.post('/customer/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // Fetch customer from database - get the most recent record (matching detail page logic)
    const result = await pool.query(
      'SELECT * FROM customers WHERE customer_id = $1 OR id::text = $1 ORDER BY updated_at DESC, id DESC LIMIT 1',
      [customerId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const dbCustomer = result.rows[0];
    const customerData = transformCustomerForPrediction(dbCustomer);
    
    // Check if SHAP values are requested
    const includeShap = req.query.include_shap === 'true' || req.body.include_shap === true;
    const prediction = await predictChurn(customerData, includeShap);
    
    // Log prediction details for debugging
    console.log(`[Prediction API] Customer: ${dbCustomer.customer_id}`);
    console.log(`  - Old churn_score: ${dbCustomer.churn_score}`);
    console.log(`  - New churn_score: ${prediction.churn_score}`);
    console.log(`  - Prediction details:`, JSON.stringify({
      churn_probability: prediction.churn_probability,
      churn_score: prediction.churn_score,
      risk_level: prediction.risk_level
    }, null, 2));
    
    // Ensure churn_score is a number (handle both integer and decimal)
    const churnScore = typeof prediction.churn_score === 'number' 
      ? prediction.churn_score 
      : parseFloat(prediction.churn_score) || 0;
    
    // Update customer churn score in database
    await pool.query(
      'UPDATE customers SET churn_score = $1, risk_level = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [churnScore, prediction.risk_level, dbCustomer.id]
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

// @route   POST /api/predictions/batch
// @desc    Predict churn for multiple customers
// @access  Private (Analyst, Manager, Admin)
router.post('/batch', authenticateToken, requireRole(['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  // Increase timeout for batch operations (5 minutes)
  req.setTimeout(300000);
  
  try {
    const { customer_ids, limit = 100 } = req.body;
    
    // Limit maximum batch size to prevent timeouts
    const maxLimit = Math.min(limit, 100);
    
    let query, params = [];
    
    if (customer_ids && Array.isArray(customer_ids) && customer_ids.length > 0) {
      // Get the most recent record for each customer_id (matching detail page logic)
      query = `
        WITH latest_customers AS (
          SELECT DISTINCT ON (customer_id) *
          FROM customers
          WHERE customer_id = ANY($1)
          ORDER BY customer_id, updated_at DESC NULLS LAST, id DESC
        )
        SELECT * FROM latest_customers
      `;
      params.push(customer_ids);
    } else {
      // Get the most recent record for customers that need updating
      query = `
        WITH latest_customers AS (
          SELECT DISTINCT ON (customer_id) *
          FROM customers
          WHERE churn_score IS NULL OR updated_at < CURRENT_DATE - INTERVAL '1 day'
          ORDER BY customer_id, updated_at DESC NULLS LAST, id DESC
        )
        SELECT * FROM latest_customers
        ORDER BY id
        LIMIT $1
      `;
      params.push(maxLimit);
    }
    
    const result = await pool.query(query, params);
    const customers = result.rows;
    
    if (customers.length === 0) {
      return res.json({
        success: true,
        message: 'No customers found to predict',
        predictions: [],
        updated: 0
      });
    }
    
    // Transform and predict
    const customersData = customers.map(transformCustomerForPrediction);
    console.log(`[Batch Prediction] Processing ${customersData.length} customers`);
    const predictions = await predictChurnBatch(customersData);
    console.log(`[Batch Prediction] Received ${predictions.length} prediction results`);
    
    // Log prediction results summary for debugging
    const successCount = predictions.filter(p => !p.error && p.churn_score !== undefined).length;
    const errorCount = predictions.filter(p => p.error).length;
    const noScoreCount = predictions.filter(p => !p.error && (p.churn_score === undefined || p.churn_score === null)).length;
    console.log(`[Batch Prediction] Summary: ${successCount} successful, ${errorCount} errors, ${noScoreCount} without scores`);
    
    // Update database with predictions
    let updatedCount = 0;
    for (const pred of predictions) {
      if (!pred.error && pred.customer_id && pred.churn_score !== undefined && pred.churn_score !== null) {
        try {
          // Ensure churn_score is a number (handle both integer and decimal)
          const churnScore = typeof pred.churn_score === 'number' 
            ? pred.churn_score 
            : parseFloat(pred.churn_score) || 0;
          
          // Log first few updates for debugging
          if (updatedCount < 3) {
            console.log(`[Batch Prediction] Customer: ${pred.customer_id}`);
            console.log(`  - Predicted churn_score: ${churnScore}`);
            console.log(`  - Risk_level: ${pred.risk_level}`);
          }
          
          // Update ALL records with this customer_id to keep them in sync
          // This ensures consistency across all records for the same customer
          await pool.query(
            'UPDATE customers SET churn_score = $1, risk_level = $2, updated_at = CURRENT_TIMESTAMP WHERE customer_id = $3',
            [churnScore, pred.risk_level, pred.customer_id]
          );
          
          // Log which record was updated (for debugging)
          if (updatedCount < 3) {
            const updateCheck = await pool.query(
              'SELECT COUNT(*) as count FROM customers WHERE customer_id = $1',
              [pred.customer_id]
            );
            console.log(`  - Updated ${updateCheck.rows[0].count} record(s) for customer_id: ${pred.customer_id}`);
          }
          updatedCount++;
        } catch (dbError) {
          console.error(`Failed to update customer ${pred.customer_id}:`, dbError);
        }
      }
    }
    
    res.json({
      success: true,
      predictions,
      updated: updatedCount,
      total: customers.length,
      summary: {
        total: predictions.length,
        successful: successCount,
        errors: errorCount,
        noScore: noScoreCount
      }
    });
  } catch (error) {
    console.error('Batch prediction error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate batch predictions',
      error: error.message 
    });
  }
});

// @route   GET /api/predictions/model-info
// @desc    Get model information and metrics
// @access  Private (Analyst, Manager, Admin)
router.get('/model-info', authenticateToken, requireRole(['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Try to load model metrics (using latest LightGBM model)
    const metricsPath = path.join(__dirname, '../../data/models/metrics/lightgbm_best.json');
    
    let metrics = null;
    if (fs.existsSync(metricsPath)) {
      metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    }
    
    // Get model performance from database
    const perfResult = await pool.query(
      'SELECT * FROM model_performance ORDER BY evaluation_date DESC LIMIT 10'
    );
    
    // Try to get feature importance from model file if available
    let featureImportance = [];
    try {
      const modelPath = path.join(__dirname, '../../data/models/lightgbm_best.pkl');
      if (fs.existsSync(modelPath)) {
        // Load model to get feature importance (this would require Python or reading pickle)
        // For now, we'll use a placeholder that can be enhanced later
        // In production, you'd want to extract this from the actual model
        if (metrics && metrics.classification_report) {
          // Extract top features from metrics if available
          // This is a placeholder - actual feature importance should come from the model
          featureImportance = [];
        }
      }
    } catch (err) {
      // Feature importance extraction failed, continue without it
      console.warn('Could not extract feature importance:', err.message);
    }

    res.json({
      success: true,
      model: {
        name: 'Gradient Boosting',
        version: 'best',
        metrics: metrics ? {
          accuracy: metrics.test_accuracy,
          precision: metrics.test_precision,
          recall: metrics.test_recall,
          f1_score: metrics.test_f1,
          roc_auc: metrics.test_roc_auc
        } : null,
        performance_history: perfResult.rows,
        feature_importance: featureImportance
      }
    });
  } catch (error) {
    console.error('Model info error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve model information',
      error: error.message 
    });
  }
});

module.exports = router;

