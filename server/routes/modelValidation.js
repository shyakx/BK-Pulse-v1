/**
 * Model Validation Routes
 * Compare predictions vs actual churn outcomes
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/model-validation/metrics
// @desc    Get model validation metrics comparing predictions vs actual outcomes
// @access  Private
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    // Get all customers with both churn_score and actual_churn_flag
    const result = await pool.query(`
      SELECT 
        customer_id,
        churn_score,
        risk_level,
        actual_churn_flag,
        segment,
        CASE 
          WHEN churn_score >= 50 THEN true
          ELSE false
        END as predicted_churn
      FROM customers
      WHERE churn_score IS NOT NULL 
        AND actual_churn_flag IS NOT NULL
    `);

    const customers = result.rows;
    const total = customers.length;

    if (total === 0) {
      return res.json({
        success: true,
        message: 'No customers with both predictions and actual outcomes',
        metrics: {
          total: 0,
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1_score: 0,
          confusion_matrix: {
            true_positive: 0,
            true_negative: 0,
            false_positive: 0,
            false_negative: 0
          }
        }
      });
    }

    // Calculate confusion matrix
    let truePositive = 0;  // Predicted churn, actually churned
    let trueNegative = 0;  // Predicted no churn, actually didn't churn
    let falsePositive = 0; // Predicted churn, actually didn't churn
    let falseNegative = 0; // Predicted no churn, actually churned

    customers.forEach(customer => {
      const predicted = customer.predicted_churn;
      const actual = customer.actual_churn_flag;

      if (predicted && actual) {
        truePositive++;
      } else if (!predicted && !actual) {
        trueNegative++;
      } else if (predicted && !actual) {
        falsePositive++;
      } else if (!predicted && actual) {
        falseNegative++;
      }
    });

    // Calculate metrics
    const accuracy = (truePositive + trueNegative) / total;
    const precision = truePositive / (truePositive + falsePositive) || 0;
    const recall = truePositive / (truePositive + falseNegative) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    // Calculate by risk level
    const byRiskLevel = {};
    ['low', 'medium', 'high'].forEach(risk => {
      const riskCustomers = customers.filter(c => c.risk_level === risk);
      if (riskCustomers.length > 0) {
        let tp = 0, tn = 0, fp = 0, fn = 0;
        riskCustomers.forEach(c => {
          const pred = c.predicted_churn;
          const act = c.actual_churn_flag;
          if (pred && act) tp++;
          else if (!pred && !act) tn++;
          else if (pred && !act) fp++;
          else if (!pred && act) fn++;
        });
        byRiskLevel[risk] = {
          total: riskCustomers.length,
          accuracy: (tp + tn) / riskCustomers.length,
          precision: tp / (tp + fp) || 0,
          recall: tp / (tp + fn) || 0,
          confusion_matrix: { tp, tn, fp, fn }
        };
      }
    });

    // Calculate by segment
    const bySegment = {};
    const segments = [...new Set(customers.map(c => c.segment))];
    segments.forEach(segment => {
      const segmentCustomers = customers.filter(c => c.segment === segment);
      if (segmentCustomers.length > 0) {
        let tp = 0, tn = 0, fp = 0, fn = 0;
        segmentCustomers.forEach(c => {
          const pred = c.predicted_churn;
          const act = c.actual_churn_flag;
          if (pred && act) tp++;
          else if (!pred && !act) tn++;
          else if (pred && !act) fp++;
          else if (!pred && act) fn++;
        });
        bySegment[segment] = {
          total: segmentCustomers.length,
          accuracy: (tp + tn) / segmentCustomers.length,
          precision: tp / (tp + fp) || 0,
          recall: tp / (tp + fn) || 0,
          confusion_matrix: { tp, tn, fp, fn }
        };
      }
    });

    // Calculate score distribution
    const scoreRanges = [
      { min: 0, max: 20, label: '0-20%' },
      { min: 20, max: 40, label: '20-40%' },
      { min: 40, max: 60, label: '40-60%' },
      { min: 60, max: 80, label: '60-80%' },
      { min: 80, max: 100, label: '80-100%' }
    ];

    const scoreDistribution = scoreRanges.map(range => {
      const rangeCustomers = customers.filter(c => {
        const score = parseFloat(c.churn_score) || 0;
        return score >= range.min && score < range.max;
      });
      const churned = rangeCustomers.filter(c => c.actual_churn_flag).length;
      return {
        range: range.label,
        total: rangeCustomers.length,
        churned: churned,
        churn_rate: rangeCustomers.length > 0 ? churned / rangeCustomers.length : 0
      };
    });

    res.json({
      success: true,
      metrics: {
        total,
        accuracy: Math.round(accuracy * 10000) / 100, // Percentage with 2 decimals
        precision: Math.round(precision * 10000) / 100,
        recall: Math.round(recall * 10000) / 100,
        f1_score: Math.round(f1Score * 10000) / 100,
        confusion_matrix: {
          true_positive: truePositive,
          true_negative: trueNegative,
          false_positive: falsePositive,
          false_negative: falseNegative
        },
        by_risk_level: byRiskLevel,
        by_segment: bySegment,
        score_distribution: scoreDistribution
      }
    });
  } catch (error) {
    console.error('Model validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate validation metrics',
      error: error.message
    });
  }
});

// @route   GET /api/model-validation/comparison
// @desc    Get detailed comparison of predictions vs actual for specific customers
// @access  Private
router.get('/comparison', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, offset = 0, segment = null, risk_level = null } = req.query;

    let query = `
      SELECT 
        customer_id,
        name,
        segment,
        churn_score,
        risk_level,
        actual_churn_flag,
        CASE 
          WHEN churn_score >= 50 THEN true
          ELSE false
        END as predicted_churn,
        CASE 
          WHEN (churn_score >= 50 AND actual_churn_flag = true) OR 
               (churn_score < 50 AND actual_churn_flag = false) THEN 'correct'
          ELSE 'incorrect'
        END as prediction_status
      FROM customers
      WHERE churn_score IS NOT NULL 
        AND actual_churn_flag IS NOT NULL
    `;

    const params = [];
    let paramCount = 0;

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

    query += ` ORDER BY churn_score DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM customers
      WHERE churn_score IS NOT NULL 
        AND actual_churn_flag IS NOT NULL
    `;
    const countParams = [];
    let countParamCount = 0;

    if (segment) {
      countParamCount++;
      countQuery += ` AND segment = $${countParamCount}`;
      countParams.push(segment);
    }

    if (risk_level) {
      countParamCount++;
      countQuery += ` AND risk_level = $${countParamCount}`;
      countParams.push(risk_level);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      comparisons: result.rows,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comparison data',
      error: error.message
    });
  }
});

module.exports = router;

