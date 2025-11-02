const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview data based on user role
// @access  Private
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;
    let overviewData = {};

    switch (role) {
      case 'retentionOfficer':
        overviewData = await getRetentionOfficerData(req.user.id);
        break;
      case 'retentionAnalyst':
        overviewData = await getRetentionAnalystData();
        break;
      case 'retentionManager':
        overviewData = await getRetentionManagerData();
        break;
      case 'admin':
        overviewData = await getAdminData();
        break;
      default:
        return res.status(403).json({ message: 'Invalid role' });
    }

    res.json(overviewData);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions for different roles
async function getRetentionOfficerData(userId) {
  // Get assigned customers count
  const customersResult = await pool.query(
    'SELECT COUNT(*) as count FROM customers WHERE assigned_officer_id = $1',
    [userId]
  );
  const assignedCustomers = parseInt(customersResult.rows[0]?.count || 0);

  // Get TOTAL customers count (all customers in system)
  const totalCustomersResult = await pool.query('SELECT COUNT(*) as count FROM customers');
  const totalCustomers = parseInt(totalCustomersResult.rows[0]?.count || 0);

  // Get high risk cases (assigned to this officer)
  const highRiskResult = await pool.query(
    'SELECT COUNT(*) as count FROM customers WHERE assigned_officer_id = $1 AND risk_level = $2',
    [userId, 'high']
  );
  const highRiskCases = parseInt(highRiskResult.rows[0]?.count || 0);

  // Get TOTAL high risk cases (all customers)
  const totalHighRiskResult = await pool.query(
    'SELECT COUNT(*) as count FROM customers WHERE risk_level = $1',
    ['high']
  );
  const totalHighRiskCases = parseInt(totalHighRiskResult.rows[0]?.count || 0);

  // Get medium and low risk counts
  const mediumRiskResult = await pool.query(
    'SELECT COUNT(*) as count FROM customers WHERE assigned_officer_id = $1 AND risk_level = $2',
    [userId, 'medium']
  );
  const lowRiskResult = await pool.query(
    'SELECT COUNT(*) as count FROM customers WHERE assigned_officer_id = $1 AND risk_level = $2',
    [userId, 'low']
  );
  const mediumRisk = parseInt(mediumRiskResult.rows[0]?.count || 0);
  const lowRisk = parseInt(lowRiskResult.rows[0]?.count || 0);

  // Get completed actions count
  const actionsResult = await pool.query(
    'SELECT COUNT(*) as count FROM actions WHERE officer_id = $1 AND status = $2',
    [userId, 'completed']
  );
  const actionsCompleted = parseInt(actionsResult.rows[0]?.count || 0);

  // Calculate retention rate based on customer risk levels
  // Retention rate = (Low Risk Customers / Total Assigned Customers) * 100
  // This represents how many customers are being successfully retained (low risk)
  const retentionRate = assignedCustomers > 0 
    ? Math.round((lowRisk / assignedCustomers) * 100) 
    : 0;

  // Get risk trend data - use both created_at and updated_at for better coverage
  // Get all months with customer data (last 6 months)
  const riskTrendResult = await pool.query(`
    SELECT 
      DATE_TRUNC('month', COALESCE(updated_at, created_at)) as month,
      COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk,
      COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk,
      COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk,
      COUNT(*) as total
    FROM customers
    WHERE assigned_officer_id = $1
      AND (updated_at >= CURRENT_DATE - INTERVAL '6 months' OR created_at >= CURRENT_DATE - INTERVAL '6 months')
      AND risk_level IS NOT NULL
    GROUP BY DATE_TRUNC('month', COALESCE(updated_at, created_at))
    ORDER BY month ASC
  `, [userId]);

  // Also get current month's latest data (regardless of when updated)
  const currentMonthData = await pool.query(`
    SELECT 
      COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk,
      COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk,
      COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk
    FROM customers
    WHERE assigned_officer_id = $1
      AND risk_level IS NOT NULL
  `, [userId]);

  // Generate labels for last 6 months
  const months = [];
  const monthDataMap = {};
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({ key: monthKey, label });
    monthDataMap[monthKey] = { high: 0, medium: 0, low: 0 };
  }

  // Fill in data from query results
  riskTrendResult.rows.forEach(row => {
    const monthKey = row.month.toISOString().slice(0, 7);
    if (monthDataMap[monthKey]) {
      monthDataMap[monthKey] = {
        high: parseInt(row.high_risk || 0),
        medium: parseInt(row.medium_risk || 0),
        low: parseInt(row.low_risk || 0)
      };
    }
  });

  // Add current month's latest snapshot
  const currentMonthKey = today.toISOString().slice(0, 7);
  if (monthDataMap[currentMonthKey] && currentMonthData.rows[0]) {
    monthDataMap[currentMonthKey] = {
      high: parseInt(currentMonthData.rows[0].high_risk || 0),
      medium: parseInt(currentMonthData.rows[0].medium_risk || 0),
      low: parseInt(currentMonthData.rows[0].low_risk || 0)
    };
  }

  // Format trend data for chart
  const riskTrend = {
    labels: months.map(m => m.label),
    datasets: {
      highRisk: months.map(m => monthDataMap[m.key].high),
      mediumRisk: months.map(m => monthDataMap[m.key].medium),
      lowRisk: months.map(m => monthDataMap[m.key].low)
    }
  };

  return {
    success: true,
    assignedCustomers,
    assignedCustomersChange: '+0 this week',
    totalCustomers, // Total customers in system (all officers)
    totalCustomersChange: '+0 this week',
    highRiskCases,
    highRiskChange: 'No change',
    totalHighRiskCases, // Total high risk cases (all customers)
    totalHighRiskChange: 'No change',
    retentionRate,
    retentionChange: '+0% this month',
    actionsCompleted,
    actionsChange: '+0 this week',
    alerts: {
      highRisk: highRiskCases,
      mediumRisk,
      lowRisk
    },
    riskTrend
  };
}

async function getRetentionAnalystData() {
  // Get total customers
  const totalCustomersResult = await pool.query('SELECT COUNT(*) as count FROM customers');
  const totalCustomers = parseInt(totalCustomersResult.rows[0]?.count || 0);

  // Get average churn rate
  const churnRateResult = await pool.query(
    'SELECT AVG(churn_score) as avg_churn FROM customers WHERE churn_score IS NOT NULL'
  );
  const avgChurnRate = parseFloat(churnRateResult.rows[0]?.avg_churn || 0);

  // Get segments analyzed (from customer_segments table)
  const segmentsResult = await pool.query('SELECT COUNT(*) as count FROM customer_segments');
  const segmentsAnalyzed = parseInt(segmentsResult.rows[0]?.count || 0);

  // Get model accuracy from model_performance table
  const modelAccuracyResult = await pool.query(`
    SELECT metric_value 
    FROM model_performance 
    WHERE metric_name = 'accuracy' 
    ORDER BY evaluation_date DESC 
    LIMIT 1
  `);
  const modelAccuracy = modelAccuracyResult.rows[0] 
    ? parseFloat(modelAccuracyResult.rows[0].metric_value * 100).toFixed(1) 
    : 0;

  // Get segment performance
  const segmentPerfResult = await pool.query(`
    SELECT 
      segment,
      COUNT(*) as customers,
      AVG(churn_score) as avg_churn_rate
    FROM customers
    WHERE segment IS NOT NULL AND churn_score IS NOT NULL
    GROUP BY segment
    ORDER BY customers DESC
  `);

  const segmentPerformance = segmentPerfResult.rows.map(row => ({
    segment: row.segment,
    churnRate: parseFloat(row.avg_churn_rate || 0).toFixed(1),
    customers: parseInt(row.customers || 0)
  }));

  // Get risk distribution
  const riskDistResult = await pool.query(`
    SELECT risk_level, COUNT(*) as count
    FROM customers
    WHERE risk_level IS NOT NULL
    GROUP BY risk_level
  `);

  const riskDistribution = riskDistResult.rows.map(row => ({
    label: row.risk_level,
    value: parseInt(row.count || 0)
  }));

  return {
    success: true,
    totalCustomers,
    totalCustomersChange: '+0 this week',
    churnRate: parseFloat(avgChurnRate).toFixed(1),
    churnRateChange: '-0% this month',
    segmentsAnalyzed,
    segmentsChange: '+0 this week',
    modelAccuracy: parseFloat(modelAccuracy),
    modelAccuracyChange: '+0% this month',
    segmentPerformance,
    riskDistribution
  };
}

async function getRetentionManagerData() {
  // Get ALL customers count (not filtered by assigned officer)
  const customersResult = await pool.query('SELECT COUNT(*) as count FROM customers');
  const assignedCustomers = parseInt(customersResult.rows[0]?.count || 0);

  // Get high risk cases (ALL customers)
  const highRiskResult = await pool.query(
    'SELECT COUNT(*) as count FROM customers WHERE risk_level = $1',
    ['high']
  );
  const highRiskCases = parseInt(highRiskResult.rows[0]?.count || 0);

  // Get team performance (average completion rate)
  const teamPerfResult = await pool.query(`
    SELECT 
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(*) as total
    FROM actions
  `);
  const completed = parseInt(teamPerfResult.rows[0]?.completed || 0);
  const total = parseInt(teamPerfResult.rows[0]?.total || 0);
  const teamPerformance = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Get unique branches count
  const branchResult = await pool.query(
    'SELECT COUNT(DISTINCT branch) as count FROM customers WHERE branch IS NOT NULL'
  );
  const branchMetrics = parseInt(branchResult.rows[0]?.count || 0);

  // Get pending approvals (from recommendations table)
  const approvalsResult = await pool.query(
    "SELECT COUNT(*) as count FROM recommendations WHERE status = 'pending'"
  );
  const approvalsPending = parseInt(approvalsResult.rows[0]?.count || 0);

  // Calculate revenue impact (sum of retained customer balances)
  const revenueResult = await pool.query(`
    SELECT COALESCE(SUM(account_balance), 0) as total_revenue
    FROM customers
    WHERE risk_level = 'low' AND account_balance IS NOT NULL
  `);
  const revenueImpact = parseFloat(revenueResult.rows[0]?.total_revenue || 0);

  // Get risk trend data for ALL customers (last 6 months)
  const riskTrendResult = await pool.query(`
    SELECT 
      DATE_TRUNC('month', COALESCE(updated_at, created_at)) as month,
      COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk,
      COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk,
      COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk,
      COUNT(*) as total
    FROM customers
    WHERE (updated_at >= CURRENT_DATE - INTERVAL '6 months' OR created_at >= CURRENT_DATE - INTERVAL '6 months')
      AND risk_level IS NOT NULL
    GROUP BY DATE_TRUNC('month', COALESCE(updated_at, created_at))
    ORDER BY month ASC
  `);

  // Generate labels for last 6 months
  const months = [];
  const monthDataMap = {};
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({ key: monthKey, label });
    monthDataMap[monthKey] = { high: 0, medium: 0, low: 0 };
  }

  // Fill in data from query results
  riskTrendResult.rows.forEach(row => {
    const monthKey = row.month.toISOString().slice(0, 7);
    if (monthDataMap[monthKey]) {
      monthDataMap[monthKey] = {
        high: parseInt(row.high_risk || 0),
        medium: parseInt(row.medium_risk || 0),
        low: parseInt(row.low_risk || 0)
      };
    }
  });

  // Get current month data
  const currentMonthData = await pool.query(`
    SELECT 
      COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk,
      COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk,
      COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk
    FROM customers
    WHERE risk_level IS NOT NULL
  `);

  const currentHigh = parseInt(currentMonthData.rows[0]?.high_risk || 0);
  const currentMedium = parseInt(currentMonthData.rows[0]?.medium_risk || 0);
  const currentLow = parseInt(currentMonthData.rows[0]?.low_risk || 0);

  // Build risk trend data
  const riskTrend = {
    labels: months.map(m => m.label),
    datasets: {
      highRisk: months.map(m => monthDataMap[m.key]?.high || 0),
      mediumRisk: months.map(m => monthDataMap[m.key]?.medium || 0),
      lowRisk: months.map(m => monthDataMap[m.key]?.low || 0)
    }
  };

  // Get alerts data (risk distribution)
  const alerts = [
    { label: 'High Risk', value: currentHigh, color: '#ef4444' },
    { label: 'Medium Risk', value: currentMedium, color: '#f59e0b' },
    { label: 'Low Risk', value: currentLow, color: '#10b981' }
  ];

  // Get team distribution
  const teamDistResult = await pool.query(`
    SELECT role, COUNT(*) as count
    FROM users
    WHERE is_active = true
    GROUP BY role
  `);

  const teamDistribution = teamDistResult.rows.map(row => ({
    role: row.role === 'retentionOfficer' ? 'Officers' :
          row.role === 'retentionAnalyst' ? 'Analysts' :
          row.role === 'retentionManager' ? 'Managers' : row.role,
    count: parseInt(row.count || 0)
  }));

  return {
    success: true,
    // Customer stats (ALL customers)
    assignedCustomers,
    assignedCustomersChange: '+0 this week',
    highRiskCases,
    highRiskChange: 'No change',
    // Risk trend data
    riskTrend,
    alerts,
    // Team metrics
    teamPerformance,
    teamPerformanceChange: '+0% this month',
    branchMetrics,
    branchMetricsChange: '+0 new branches',
    approvalsPending,
    approvalsChange: '-0 from yesterday',
    revenueImpact,
    revenueChange: '+$0 this month',
    teamDistribution
  };
}

async function getAdminData() {
  // Get ALL customers count
  const customersResult = await pool.query('SELECT COUNT(*) as count FROM customers');
  const assignedCustomers = parseInt(customersResult.rows[0]?.count || 0);

  // Get high risk cases (ALL customers)
  const highRiskResult = await pool.query(
    'SELECT COUNT(*) as count FROM customers WHERE risk_level = $1',
    ['high']
  );
  const highRiskCases = parseInt(highRiskResult.rows[0]?.count || 0);

  // Calculate system health based on various factors
  // For now, we'll use a simple calculation based on data completeness
  const dataQualityResult = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN churn_score IS NOT NULL THEN 1 END) as with_scores,
      COUNT(CASE WHEN account_balance IS NOT NULL THEN 1 END) as with_balance
    FROM customers
  `);
  const total = parseInt(dataQualityResult.rows[0]?.total || 0);
  const withScores = parseInt(dataQualityResult.rows[0]?.with_scores || 0);
  const withBalance = parseInt(dataQualityResult.rows[0]?.with_balance || 0);
  
  const dataQuality = total > 0 
    ? Math.round(((withScores + withBalance) / (total * 2)) * 100 * 10) / 10
    : 0;

  // System health is based on data quality and system uptime
  const systemHealth = Math.min(dataQuality + 1, 99.9); // Add 1% for system uptime assumption

  // Get risk trend data for ALL customers (last 6 months)
  const riskTrendResult = await pool.query(`
    SELECT 
      DATE_TRUNC('month', COALESCE(updated_at, created_at)) as month,
      COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk,
      COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk,
      COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk,
      COUNT(*) as total
    FROM customers
    WHERE (updated_at >= CURRENT_DATE - INTERVAL '6 months' OR created_at >= CURRENT_DATE - INTERVAL '6 months')
      AND risk_level IS NOT NULL
    GROUP BY DATE_TRUNC('month', COALESCE(updated_at, created_at))
    ORDER BY month ASC
  `);

  // Generate labels for last 6 months
  const months = [];
  const monthDataMap = {};
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({ key: monthKey, label });
    monthDataMap[monthKey] = { high: 0, medium: 0, low: 0 };
  }

  // Fill in data from query results
  riskTrendResult.rows.forEach(row => {
    const monthKey = row.month.toISOString().slice(0, 7);
    if (monthDataMap[monthKey]) {
      monthDataMap[monthKey] = {
        high: parseInt(row.high_risk || 0),
        medium: parseInt(row.medium_risk || 0),
        low: parseInt(row.low_risk || 0)
      };
    }
  });

  // Get current month data
  const currentMonthData = await pool.query(`
    SELECT 
      COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk,
      COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk,
      COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk
    FROM customers
    WHERE risk_level IS NOT NULL
  `);

  const currentHigh = parseInt(currentMonthData.rows[0]?.high_risk || 0);
  const currentMedium = parseInt(currentMonthData.rows[0]?.medium_risk || 0);
  const currentLow = parseInt(currentMonthData.rows[0]?.low_risk || 0);

  // Build risk trend data
  const riskTrend = {
    labels: months.map(m => m.label),
    datasets: {
      highRisk: months.map(m => monthDataMap[m.key]?.high || 0),
      mediumRisk: months.map(m => monthDataMap[m.key]?.medium || 0),
      lowRisk: months.map(m => monthDataMap[m.key]?.low || 0)
    }
  };

  // Get alerts data (risk distribution)
  const alerts = [
    { label: 'High Risk', value: currentHigh, color: '#ef4444' },
    { label: 'Medium Risk', value: currentMedium, color: '#f59e0b' },
    { label: 'Low Risk', value: currentLow, color: '#10b981' }
  ];

  // Get active users (users who have logged in recently - last 7 days)
  // For now, count all active users
  const activeUsersResult = await pool.query(
    'SELECT COUNT(*) as count FROM users WHERE is_active = true'
  );
  const activeUsers = parseInt(activeUsersResult.rows[0]?.count || 0);

  // ETL jobs count (placeholder - would come from job scheduler in production)
  const etlJobs = 12; // Static for now

  // Get user activity by role
  const userActivityResult = await pool.query(`
    SELECT role, COUNT(*) as active
    FROM users
    WHERE is_active = true
    GROUP BY role
  `);

  const userActivity = userActivityResult.rows.map(row => ({
    role: row.role,
    active: parseInt(row.active || 0)
  }));

  // Get system performance metrics
  const systemPerformance = {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };

  return {
    success: true,
    // Customer stats (ALL customers)
    assignedCustomers,
    assignedCustomersChange: '+0 this week',
    highRiskCases,
    highRiskChange: 'No change',
    // Risk trend data
    riskTrend,
    alerts,
    // System metrics
    systemHealth: parseFloat(systemHealth.toFixed(1)),
    systemHealthChange: '+0% this week',
    activeUsers,
    activeUsersChange: '+0 this week',
    etlJobs,
    etlJobsStatus: 'All running',
    dataQuality: parseFloat(dataQuality.toFixed(1)),
    dataQualityChange: '+0% this month',
    userActivity,
    systemPerformance
  };
}

module.exports = router;

