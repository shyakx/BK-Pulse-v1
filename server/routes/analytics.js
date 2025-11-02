const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// @route   GET /api/analytics/strategic
// @desc    Get strategic analytics (CLV, cohort analysis, scenarios)
// @access  Private (Manager, Admin)
router.get('/strategic', authenticateToken, requireRole(['retentionManager', 'admin']), async (req, res) => {
  try {
    const { period = 'quarter' } = req.query;

    // Calculate Customer Lifetime Value (CLV) by segment
    const clvBySegment = await pool.query(`
      SELECT 
        segment,
        COUNT(*) as customer_count,
        AVG(account_balance) as avg_balance,
        AVG(churn_score) as avg_churn_score,
        SUM(account_balance) as total_value,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as retained_customers,
        COUNT(CASE WHEN risk_level IN ('high', 'medium') THEN 1 END) as at_risk_customers
      FROM customers
      WHERE account_balance IS NOT NULL
      GROUP BY segment
      ORDER BY total_value DESC
    `);

    // Cohort analysis - customers by acquisition period (using created_at as proxy)
    const cohortAnalysis = await pool.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as cohort_month,
        COUNT(*) as customers_acquired,
        AVG(churn_score) as avg_churn_score,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as retained,
        COUNT(CASE WHEN risk_level IN ('high', 'medium') THEN 1 END) as at_risk
      FROM customers
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY cohort_month DESC
    `);

    // Predictive scenarios
    const scenarios = {
      conservative: {
        retention_rate: 0.85,
        estimated_revenue_retained: 0,
        estimated_customers_lost: 0
      },
      moderate: {
        retention_rate: 0.90,
        estimated_revenue_retained: 0,
        estimated_customers_lost: 0
      },
      aggressive: {
        retention_rate: 0.95,
        estimated_revenue_retained: 0,
        estimated_customers_lost: 0
      }
    };

    // Calculate scenario estimates based on current high-risk customers
    const highRiskStats = await pool.query(`
      SELECT 
        COUNT(*) as high_risk_count,
        SUM(account_balance) as high_risk_value
      FROM customers
      WHERE risk_level = 'high' AND churn_score >= 70
    `);

    const highRiskCount = parseInt(highRiskStats.rows[0].high_risk_count) || 0;
    const highRiskValue = parseFloat(highRiskStats.rows[0].high_risk_value) || 0;

    Object.keys(scenarios).forEach(key => {
      const retentionRate = scenarios[key].retention_rate;
      scenarios[key].estimated_customers_lost = Math.round(highRiskCount * (1 - retentionRate));
      scenarios[key].estimated_revenue_retained = highRiskValue * retentionRate;
    });

    // Churn trend over time
    const churnTrend = await pool.query(`
      SELECT 
        DATE_TRUNC('month', updated_at) as month,
        AVG(churn_score) as avg_churn_score,
        COUNT(CASE WHEN churn_score >= 70 THEN 1 END) as high_risk_count
      FROM customers
      WHERE updated_at >= CURRENT_DATE - INTERVAL '6 months'
        AND churn_score IS NOT NULL
      GROUP BY DATE_TRUNC('month', updated_at)
      ORDER BY month DESC
    `);

    res.json({
      success: true,
      analytics: {
        customer_lifetime_value: clvBySegment.rows.map(row => ({
          segment: row.segment,
          customer_count: parseInt(row.customer_count) || 0,
          avg_balance: parseFloat(row.avg_balance) || 0,
          avg_churn_score: parseFloat(row.avg_churn_score) || 0,
          total_value: parseFloat(row.total_value) || 0,
          retained_customers: parseInt(row.retained_customers) || 0,
          at_risk_customers: parseInt(row.at_risk_customers) || 0
        })),
        cohort_analysis: cohortAnalysis.rows.map(row => ({
          cohort_month: row.cohort_month,
          customers_acquired: parseInt(row.customers_acquired) || 0,
          avg_churn_score: parseFloat(row.avg_churn_score) || 0,
          retained: parseInt(row.retained) || 0,
          at_risk: parseInt(row.at_risk) || 0
        })),
        predictive_scenarios: scenarios,
        churn_trend: churnTrend.rows.map(row => ({
          month: row.month,
          avg_churn_score: parseFloat(row.avg_churn_score) || 0,
          high_risk_count: parseInt(row.high_risk_count) || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching strategic analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch strategic analytics',
      error: error.message
    });
  }
});

// @route   GET /api/analytics/budget-roi
// @desc    Get budget and ROI analytics
// @access  Private (Manager, Admin)
router.get('/budget-roi', authenticateToken, requireRole(['retentionManager', 'admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = '';

    if (startDate && endDate) {
      dateFilter = `AND c.created_at BETWEEN '${startDate}' AND '${endDate}'`;
    } else {
      dateFilter = `AND c.created_at >= CURRENT_DATE - INTERVAL '3 months'`;
    }

    // Campaign ROI summary
    const campaignROI = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.budget,
        c.allocated_budget,
        COUNT(DISTINCT ct.id) as targets,
        COUNT(DISTINCT CASE WHEN ct.status = 'converted' THEN ct.id END) as conversions,
        SUM(cp.revenue_generated) as revenue
      FROM campaigns c
      LEFT JOIN campaign_targets ct ON c.id = ct.campaign_id
      LEFT JOIN campaign_performance cp ON c.id = cp.campaign_id
      WHERE c.status != 'draft' ${dateFilter}
      GROUP BY c.id, c.name, c.budget, c.allocated_budget
    `);

    // Calculate overall budget and ROI metrics
    const totalBudget = campaignROI.rows.reduce((sum, row) => sum + (parseFloat(row.budget) || 0), 0);
    const totalAllocated = campaignROI.rows.reduce((sum, row) => sum + (parseFloat(row.allocated_budget) || 0), 0);
    const totalRevenue = campaignROI.rows.reduce((sum, row) => sum + (parseFloat(row.revenue) || 0), 0);
    const totalConversions = campaignROI.rows.reduce((sum, row) => sum + (parseInt(row.conversions) || 0), 0);

    const roi = totalBudget > 0 ? (((totalRevenue - totalBudget) / totalBudget) * 100).toFixed(2) : 0;
    const costPerConversion = totalConversions > 0 ? (totalBudget / totalConversions).toFixed(2) : 0;

    // Retention actions cost (using actions and retention notes as proxy)
    const retentionActionsCost = await pool.query(`
      SELECT 
        COUNT(DISTINCT a.id) as actions_count,
        COUNT(DISTINCT rn.id) as notes_count
      FROM actions a
      FULL OUTER JOIN retention_notes rn ON a.officer_id = rn.officer_id
      WHERE 1=1 ${dateFilter.replace('c.created_at', 'COALESCE(a.created_at, rn.created_at)')}
    `);

    // Estimated value at risk
    const valueAtRisk = await pool.query(`
      SELECT 
        COUNT(*) as high_risk_count,
        SUM(account_balance) as total_value_at_risk
      FROM customers
      WHERE risk_level = 'high' AND churn_score >= 70
    `);

    res.json({
      success: true,
      budget_roi: {
        campaigns: campaignROI.rows.map(row => {
          const budget = parseFloat(row.budget) || 0;
          const revenue = parseFloat(row.revenue) || 0;
          const conversions = parseInt(row.conversions) || 0;
          const campaignROI = budget > 0 ? (((revenue - budget) / budget) * 100).toFixed(2) : 0;
          
          return {
            campaign_id: row.id,
            campaign_name: row.name,
            budget: budget,
            allocated: parseFloat(row.allocated_budget) || 0,
            targets: parseInt(row.targets) || 0,
            conversions: conversions,
            revenue: revenue,
            roi: parseFloat(campaignROI),
            cost_per_conversion: conversions > 0 ? (budget / conversions).toFixed(2) : 0
          };
        }),
        summary: {
          total_budget: totalBudget,
          total_allocated: totalAllocated,
          total_revenue: totalRevenue,
          total_conversions: totalConversions,
          overall_roi: parseFloat(roi),
          cost_per_conversion: parseFloat(costPerConversion),
          retention_actions: parseInt(retentionActionsCost.rows[0].actions_count) || 0,
          retention_notes: parseInt(retentionActionsCost.rows[0].notes_count) || 0,
          value_at_risk: {
            customers: parseInt(valueAtRisk.rows[0].high_risk_count) || 0,
            total_value: parseFloat(valueAtRisk.rows[0].total_value_at_risk) || 0
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching budget ROI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget ROI analytics',
      error: error.message
    });
  }
});

module.exports = router;

