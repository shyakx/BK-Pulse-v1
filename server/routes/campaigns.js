const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

/**
 * Check if campaigns table exists
 * @returns {Promise<boolean>} True if table exists, false otherwise
 */
async function campaignsTableExists() {
  try {
    await pool.query('SELECT 1 FROM campaigns LIMIT 1');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Build WHERE clause from target criteria for customer queries
 * @param {Object} criteria - Target criteria object
 * @param {Number} paramCount - Starting parameter count
 * @returns {Object} { whereClause, params, nextParamCount }
 */
function buildCriteriaWhereClause(criteria, paramCount = 1) {
  const conditions = [];
  const params = [];
  let count = paramCount;

  if (!criteria || typeof criteria !== 'object') {
    return { whereClause: '', params: [], nextParamCount: count };
  }

  if (criteria.risk_level && Array.isArray(criteria.risk_level) && criteria.risk_level.length > 0) {
    conditions.push(`risk_level = ANY($${count})`);
    params.push(criteria.risk_level);
    count++;
  }

  if (criteria.segment && Array.isArray(criteria.segment) && criteria.segment.length > 0) {
    conditions.push(`segment = ANY($${count})`);
    params.push(criteria.segment);
    count++;
  }

  if (criteria.min_churn_score !== undefined && criteria.min_churn_score !== null) {
    conditions.push(`churn_score >= $${count}`);
    params.push(criteria.min_churn_score);
    count++;
  }

  if (criteria.max_churn_score !== undefined && criteria.max_churn_score !== null) {
    conditions.push(`churn_score <= $${count}`);
    params.push(criteria.max_churn_score);
    count++;
  }

  if (criteria.min_balance !== undefined && criteria.min_balance !== null) {
    conditions.push(`account_balance >= $${count}`);
    params.push(criteria.min_balance);
    count++;
  }

  if (criteria.max_balance !== undefined && criteria.max_balance !== null) {
    conditions.push(`account_balance <= $${count}`);
    params.push(criteria.max_balance);
    count++;
  }

  if (criteria.branch && Array.isArray(criteria.branch) && criteria.branch.length > 0) {
    conditions.push(`branch = ANY($${count})`);
    params.push(criteria.branch);
    count++;
  }

  if (criteria.product_type && Array.isArray(criteria.product_type) && criteria.product_type.length > 0) {
    conditions.push(`product_type = ANY($${count})`);
    params.push(criteria.product_type);
    count++;
  }

  const whereClause = conditions.length > 0 ? ` AND ${conditions.join(' AND ')}` : '';
  return { whereClause, params, nextParamCount: count };
}

/**
 * Automatically assign customers to a campaign based on target criteria
 * @param {Number} campaignId - Campaign ID
 * @param {Object} targetCriteria - Target criteria object
 * @param {String} targetSegment - Target segment (optional)
 * @returns {Promise<Number>} Number of customers assigned
 */
async function assignCustomersToCampaign(campaignId, targetCriteria, targetSegment = null) {
  try {
    // Build WHERE clause from criteria
    let criteria = targetCriteria;
    if (typeof criteria === 'string') {
      try {
        criteria = JSON.parse(criteria);
      } catch (e) {
        console.error(`[Campaign Assignment] Failed to parse criteria:`, e);
        criteria = null;
      }
    }

    // Build query with CTE to get latest customer records
    let query = `
      WITH latest_customers AS (
        SELECT DISTINCT ON (customer_id) *
        FROM customers
        ORDER BY customer_id, updated_at DESC NULLS LAST, id DESC
      )
      SELECT id FROM latest_customers WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Add criteria filters first (includes segment from criteria if present)
    if (criteria) {
      const criteriaResult = buildCriteriaWhereClause(criteria, paramCount);
      query += criteriaResult.whereClause;
      params.push(...criteriaResult.params);
      paramCount = criteriaResult.nextParamCount;
    }

    // Add target_segment filter if provided and valid
    const validSegments = ['retail', 'institutional_banking', 'sme', 'corporate'];
    if (targetSegment && validSegments.includes(targetSegment.toLowerCase())) {
      // Check if segment filter is already in criteria
      const hasSegmentInCriteria = criteria && 
        Array.isArray(criteria.segment) && 
        criteria.segment.length > 0;
      
      if (!hasSegmentInCriteria) {
        query += ` AND segment = $${paramCount}`;
        params.push(targetSegment.toLowerCase());
        paramCount++;
      }
    }

    // Execute query to get matching customer IDs
    const customersResult = await pool.query(query, params);
    const customerIds = customersResult.rows.map(row => row.id);

    if (customerIds.length === 0) {
      return 0;
    }

    // Insert into campaign_targets using batch insert for better performance
    // Process in batches to avoid query size limits
    const BATCH_SIZE = 500;
    let assignedCount = 0;
    
    for (let i = 0; i < customerIds.length; i += BATCH_SIZE) {
      const batch = customerIds.slice(i, i + BATCH_SIZE);
      
      try {
        // Build VALUES clause for batch insert
        const values = batch.map((_, index) => {
          const paramIndex = index * 2 + 1;
          return `($1, $${paramIndex + 1}, 'targeted')`;
        }).join(', ');
        
        const params = [campaignId, ...batch];
        const query = `
          INSERT INTO campaign_targets (campaign_id, customer_id, status)
          VALUES ${values}
          ON CONFLICT (campaign_id, customer_id) DO NOTHING
          RETURNING id
        `;
        
        const result = await pool.query(query, params);
        assignedCount += result.rows.length;
      } catch (err) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1} into campaign ${campaignId}:`, err);
        // Fallback to individual inserts for this batch if batch fails
        for (const customerId of batch) {
          try {
            const result = await pool.query(
              `INSERT INTO campaign_targets (campaign_id, customer_id, status)
               VALUES ($1, $2, 'targeted')
               ON CONFLICT (campaign_id, customer_id) DO NOTHING
               RETURNING id`,
              [campaignId, customerId]
            );
            if (result.rows.length > 0) {
              assignedCount++;
            }
          } catch (individualErr) {
            // Skip this customer
          }
        }
      }
    }

    return assignedCount;
  } catch (error) {
    console.error('Error assigning customers to campaign:', error);
    return 0;
  }
}

/**
 * Automatically create campaigns tables if they don't exist
 * @returns {Promise<void>}
 */
async function ensureCampaignsTables() {
  const exists = await campaignsTableExists();
  if (exists) {
    return;
  }

  try {
    // Create campaigns table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        campaign_type VARCHAR(100) NOT NULL CHECK (campaign_type IN ('retention', 'win_back', 'upsell', 'cross_sell', 'preventive')),
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
        target_segment VARCHAR(100),
        target_criteria JSONB,
        start_date DATE,
        end_date DATE,
        budget DECIMAL(15,2),
        allocated_budget DECIMAL(15,2) DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create campaign_targets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_targets (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'targeted' CHECK (status IN ('targeted', 'contacted', 'responded', 'converted', 'rejected')),
        contacted_at TIMESTAMP,
        responded_at TIMESTAMP,
        converted_at TIMESTAMP,
        outcome TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(campaign_id, customer_id)
      )
    `);

    // Create campaign_performance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_performance (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
        metric_date DATE NOT NULL,
        targets_count INTEGER DEFAULT 0,
        contacted_count INTEGER DEFAULT 0,
        responded_count INTEGER DEFAULT 0,
        converted_count INTEGER DEFAULT 0,
        conversion_rate DECIMAL(5,2) DEFAULT 0,
        cost_per_conversion DECIMAL(10,2),
        revenue_generated DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(campaign_id, metric_date)
      )
    `);

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_campaign_targets_campaign_id ON campaign_targets(campaign_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_campaign_targets_customer_id ON campaign_targets(customer_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_campaign_targets_status ON campaign_targets(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_campaign_performance_campaign_id ON campaign_performance(campaign_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_campaign_performance_metric_date ON campaign_performance(metric_date)`);

    // Create trigger for updated_at (if function exists)
    try {
      await pool.query(`
        CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);
    } catch (triggerError) {
      // Trigger function might not exist, that's okay
    }
  } catch (error) {
    console.error('Error creating campaigns tables:', error);
    throw error;
  }
}

// @route   GET /api/campaigns
// @desc    Get all campaigns with filters
// @access  Private (Officer, Analyst, Manager, Admin)
router.get('/', authenticateToken, requireRole(['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    // Ensure campaigns tables exist
    await ensureCampaignsTables();

    const { 
      page = 1, 
      limit = 10, 
      status = null,
      campaign_type = null,
      search = ''
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.campaign_type,
        c.status,
        c.target_segment,
        c.target_criteria,
        c.start_date,
        c.end_date,
        c.budget,
        c.allocated_budget,
        c.created_by,
        c.created_at,
        c.updated_at,
        u.name as created_by_name,
        COUNT(ct.id) as target_count,
        COUNT(CASE WHEN ct.status = 'converted' THEN 1 END) as converted_count
      FROM campaigns c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN campaign_targets ct ON c.id = ct.campaign_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
    }

    if (campaign_type) {
      paramCount++;
      query += ` AND c.campaign_type = $${paramCount}`;
      params.push(campaign_type);
    }

    if (search) {
      paramCount++;
      query += ` AND (c.name ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY c.id, c.name, c.description, c.campaign_type, c.status, c.target_segment, c.target_criteria, c.start_date, c.end_date, c.budget, c.allocated_budget, c.created_by, c.created_at, c.updated_at, u.name`;

    // Build separate count query
    let countQuery = `
      SELECT COUNT(DISTINCT c.id) as count
      FROM campaigns c
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND c.status = $${countParamCount}`;
      countParams.push(status);
    }

    if (campaign_type) {
      countParamCount++;
      countQuery += ` AND c.campaign_type = $${countParamCount}`;
      countParams.push(campaign_type);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (c.name ILIKE $${countParamCount} OR c.description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams).catch(err => {
      console.error('Error counting campaigns:', err);
      return { rows: [{ count: 0 }] };
    });
    const total = parseInt(countResult.rows[0]?.count || 0);

    // Get paginated results
    paramCount++;
    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params).catch(err => {
      console.error('Error fetching campaigns:', err);
      throw err;
    });

    // Format response
    const campaigns = (result.rows || []).map(row => {
      // Parse target_criteria if it's a string
      let target_criteria = row.target_criteria;
      if (typeof target_criteria === 'string') {
        try {
          target_criteria = JSON.parse(target_criteria);
        } catch (parseError) {
          console.error('Error parsing target_criteria JSON:', parseError);
          target_criteria = null;
        }
      }

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        campaign_type: row.campaign_type,
        status: row.status,
        target_segment: row.target_segment,
        target_criteria: target_criteria,
        start_date: row.start_date,
        end_date: row.end_date,
        budget: parseFloat(row.budget) || 0,
        allocated_budget: parseFloat(row.allocated_budget) || 0,
        created_by: row.created_by,
        created_by_name: row.created_by_name,
        target_count: parseInt(row.target_count) || 0,
        converted_count: parseInt(row.converted_count) || 0,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    });

    res.json({
      success: true,
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message
    });
  }
});

// @route   GET /api/campaigns/:id/customers
// @desc    Get customers targeted by a campaign
// @access  Private (Analyst, Manager, Admin)
router.get('/:id/customers', authenticateToken, requireRole(['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    // Ensure campaigns tables exist
    await ensureCampaignsTables();

    const campaignId = req.params.id;
    const { page = 1, limit = 50, status = null } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        ct.customer_id as customer_db_id,
        c.customer_id,
        c.name as customer_name,
        c.email,
        c.phone,
        c.churn_score,
        c.risk_level,
        c.account_balance,
        ct.status,
        ct.contacted_at,
        ct.responded_at,
        ct.converted_at,
        ct.outcome,
        ct.created_at
      FROM campaign_targets ct
      INNER JOIN customers c ON ct.customer_id = c.id
      WHERE ct.campaign_id = $1
    `;
    const params = [campaignId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND ct.status = $${paramCount}`;
      params.push(status);
    }

    // Count total
    const countQuery = query.replace(
      'SELECT ct.customer_id as customer_db_id, c.customer_id, c.name as customer_name, c.email, c.phone, c.churn_score, c.risk_level, c.account_balance, ct.status, ct.contacted_at, ct.responded_at, ct.converted_at, ct.outcome, ct.created_at',
      'SELECT COUNT(*)'
    );
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || 0);

    // Get paginated results
    paramCount++;
    query += ` ORDER BY ct.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      customers: result.rows.map(row => ({
        id: row.customer_db_id,
        customer_id: row.customer_id,
        customer_name: row.customer_name,
        email: row.email,
        phone: row.phone,
        churn_score: parseFloat(row.churn_score) || 0,
        risk_level: row.risk_level,
        account_balance: parseFloat(row.account_balance) || 0,
        status: row.status,
        contacted_at: row.contacted_at,
        responded_at: row.responded_at,
        converted_at: row.converted_at,
        outcome: row.outcome
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching campaign customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign customers',
      error: error.message
    });
  }
});

// @route   GET /api/campaigns/:id/performance
// @desc    Get campaign performance metrics
// @access  Private (Analyst, Manager, Admin)
router.get('/:id/performance', authenticateToken, requireRole(['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    // Ensure campaigns tables exist
    await ensureCampaignsTables();

    const campaignId = req.params.id;
    const { startDate, endDate } = req.query;

    // Check if campaign exists
    const campaignResult = await pool.query(
      'SELECT * FROM campaigns WHERE id = $1',
      [campaignId]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Get campaign targets summary
    const targetsSummary = await pool.query(
      `SELECT 
        COUNT(*) as total_targets,
        COUNT(CASE WHEN status = 'targeted' THEN 1 END) as targeted_count,
        COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_count,
        COUNT(CASE WHEN status = 'responded' THEN 1 END) as responded_count,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
      FROM campaign_targets
      WHERE campaign_id = $1`,
      [campaignId]
    );

    // Get daily performance metrics
    let performanceQuery = `
      SELECT 
        metric_date,
        targets_count,
        contacted_count,
        responded_count,
        converted_count,
        conversion_rate,
        cost_per_conversion,
        revenue_generated
      FROM campaign_performance
      WHERE campaign_id = $1
    `;
    const perfParams = [campaignId];

    if (startDate && endDate) {
      performanceQuery += ` AND metric_date BETWEEN $2 AND $3`;
      perfParams.push(startDate, endDate);
    }

    performanceQuery += ` ORDER BY metric_date DESC LIMIT 30`;

    const performanceResult = await pool.query(performanceQuery, perfParams);

    // Calculate overall metrics
    const summary = targetsSummary.rows[0];
    const totalTargets = parseInt(summary.total_targets) || 0;
    const converted = parseInt(summary.converted_count) || 0;
    const contacted = parseInt(summary.contacted_count) || 0;
    const responded = parseInt(summary.responded_count) || 0;
    
    const conversionRate = contacted > 0 ? ((converted / contacted) * 100).toFixed(2) : 0;
    const responseRate = contacted > 0 ? ((responded / contacted) * 100).toFixed(2) : 0;

    const campaign = campaignResult.rows[0];
    const budget = parseFloat(campaign.budget) || 0;
    const costPerConversion = converted > 0 ? (budget / converted).toFixed(2) : 0;

    res.json({
      success: true,
      performance: {
        campaign_id: parseInt(campaignId),
        campaign_name: campaign.name,
        summary: {
          total_targets: totalTargets,
          targeted: parseInt(summary.targeted_count) || 0,
          contacted: contacted,
          responded: responded,
          converted: converted,
          rejected: parseInt(summary.rejected_count) || 0,
          conversion_rate: parseFloat(conversionRate),
          response_rate: parseFloat(responseRate),
          cost_per_conversion: parseFloat(costPerConversion)
        },
        daily_metrics: performanceResult.rows.map(row => ({
          date: row.metric_date,
          targets: parseInt(row.targets_count) || 0,
          contacted: parseInt(row.contacted_count) || 0,
          responded: parseInt(row.responded_count) || 0,
          converted: parseInt(row.converted_count) || 0,
          conversion_rate: parseFloat(row.conversion_rate) || 0,
          cost_per_conversion: parseFloat(row.cost_per_conversion) || 0,
          revenue: parseFloat(row.revenue_generated) || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching campaign performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign performance',
      error: error.message
    });
  }
});

// @route   GET /api/campaigns/:id
// @desc    Get campaign by ID
// @access  Private (Analyst, Manager, Admin)
router.get('/:id', authenticateToken, requireRole(['retentionOfficer', 'retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    // Ensure campaigns tables exist
    await ensureCampaignsTables();

    const campaignId = req.params.id;

    const result = await pool.query(
      `SELECT 
        c.*,
        u.name as created_by_name,
        COUNT(DISTINCT ct.id) as target_count,
        COUNT(DISTINCT CASE WHEN ct.status = 'contacted' THEN ct.id END) as contacted_count,
        COUNT(DISTINCT CASE WHEN ct.status = 'responded' THEN ct.id END) as responded_count,
        COUNT(DISTINCT CASE WHEN ct.status = 'converted' THEN ct.id END) as converted_count
      FROM campaigns c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN campaign_targets ct ON c.id = ct.campaign_id
      WHERE c.id = $1
      GROUP BY c.id, u.name`,
      [campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    const campaign = result.rows[0];

    res.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        campaign_type: campaign.campaign_type,
        status: campaign.status,
        target_segment: campaign.target_segment,
        target_criteria: campaign.target_criteria,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        budget: parseFloat(campaign.budget) || 0,
        allocated_budget: parseFloat(campaign.allocated_budget) || 0,
        created_by: campaign.created_by,
        created_by_name: campaign.created_by_name,
        target_count: parseInt(campaign.target_count) || 0,
        contacted_count: parseInt(campaign.contacted_count) || 0,
        responded_count: parseInt(campaign.responded_count) || 0,
        converted_count: parseInt(campaign.converted_count) || 0,
        created_at: campaign.created_at,
        updated_at: campaign.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign',
      error: error.message
    });
  }
});

// @route   POST /api/campaigns
// @desc    Create a new campaign
// @access  Private (Analyst, Manager, Admin)
router.post('/', authenticateToken, requireRole(['retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    const {
      name,
      description,
      campaign_type,
      status = 'draft',
      target_segment,
      target_criteria,
      start_date,
      end_date,
      budget
    } = req.body;

    if (!name || !campaign_type) {
      return res.status(400).json({
        success: false,
        message: 'Campaign name and type are required'
      });
    }

    // Ensure campaigns tables exist
    await ensureCampaignsTables();

    const result = await pool.query(
      `INSERT INTO campaigns (name, description, campaign_type, status, target_segment, target_criteria, start_date, end_date, budget, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, description || null, campaign_type, status, target_segment || null, target_criteria || null, start_date || null, end_date || null, budget || null, req.user.id]
    );

    const campaignId = result.rows[0].id;

    // If campaign is launched immediately (status = 'active'), assign customers automatically
    let assignedCount = 0;
    if (status === 'active' && (target_criteria || target_segment)) {
      assignedCount = await assignCustomersToCampaign(campaignId, target_criteria, target_segment);
    }

    // Get full campaign with creator name and target count
    const fullResult = await pool.query(
      `SELECT 
        c.*,
        u.name as created_by_name,
        COUNT(DISTINCT ct.id) as target_count,
        COUNT(DISTINCT CASE WHEN ct.status = 'converted' THEN ct.id END) as converted_count
      FROM campaigns c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN campaign_targets ct ON c.id = ct.campaign_id
      WHERE c.id = $1
      GROUP BY c.id, u.name`,
      [campaignId]
    );

    res.status(201).json({
      success: true,
      campaign: {
        id: fullResult.rows[0].id,
        name: fullResult.rows[0].name,
        description: fullResult.rows[0].description,
        campaign_type: fullResult.rows[0].campaign_type,
        status: fullResult.rows[0].status,
        target_segment: fullResult.rows[0].target_segment,
        target_criteria: fullResult.rows[0].target_criteria,
        start_date: fullResult.rows[0].start_date,
        end_date: fullResult.rows[0].end_date,
        budget: parseFloat(fullResult.rows[0].budget) || 0,
        allocated_budget: parseFloat(fullResult.rows[0].allocated_budget) || 0,
        created_by: fullResult.rows[0].created_by,
        created_by_name: fullResult.rows[0].created_by_name,
        target_count: parseInt(fullResult.rows[0].target_count) || 0,
        converted_count: parseInt(fullResult.rows[0].converted_count) || 0,
        created_at: fullResult.rows[0].created_at,
        updated_at: fullResult.rows[0].updated_at
      },
      message: status === 'active' && assignedCount > 0 
        ? `Campaign created and ${assignedCount} customers assigned automatically`
        : status === 'active' 
          ? 'Campaign created. No customers matched the target criteria.'
          : 'Campaign created as draft'
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error.message
    });
  }
});

// @route   PATCH /api/campaigns/:id
// @desc    Update a campaign
// @access  Private (Analyst, Manager, Admin)
router.patch('/:id', authenticateToken, requireRole(['retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    // Ensure campaigns tables exist
    await ensureCampaignsTables();

    const campaignId = req.params.id;
    const {
      name,
      description,
      campaign_type,
      status,
      target_segment,
      target_criteria,
      start_date,
      end_date,
      budget,
      allocated_budget
    } = req.body;

    // Check if campaign exists
    const existingResult = await pool.query(
      'SELECT * FROM campaigns WHERE id = $1',
      [campaignId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }

    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description || null);
    }

    if (campaign_type !== undefined) {
      paramCount++;
      updates.push(`campaign_type = $${paramCount}`);
      params.push(campaign_type);
    }

    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (target_segment !== undefined) {
      paramCount++;
      updates.push(`target_segment = $${paramCount}`);
      params.push(target_segment || null);
    }

    if (target_criteria !== undefined) {
      paramCount++;
      updates.push(`target_criteria = $${paramCount}`);
      params.push(target_criteria || null);
    }

    if (start_date !== undefined) {
      paramCount++;
      updates.push(`start_date = $${paramCount}`);
      params.push(start_date || null);
    }

    if (end_date !== undefined) {
      paramCount++;
      updates.push(`end_date = $${paramCount}`);
      params.push(end_date || null);
    }

    if (budget !== undefined) {
      paramCount++;
      updates.push(`budget = $${paramCount}`);
      params.push(budget || null);
    }

    if (allocated_budget !== undefined) {
      paramCount++;
      updates.push(`allocated_budget = $${paramCount}`);
      params.push(allocated_budget || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    paramCount++;
    params.push(campaignId);

    const updateQuery = `
      UPDATE campaigns 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, params);
    const updatedCampaign = updateResult.rows[0];

    // Check if status is being changed to 'active' and campaign didn't have targets yet
    let assignedCount = 0;
    if (status === 'active') {
      const oldStatus = existingResult.rows[0].status;
      const hasExistingTargets = await pool.query(
        'SELECT COUNT(*) as count FROM campaign_targets WHERE campaign_id = $1',
        [campaignId]
      );
      const targetCount = parseInt(hasExistingTargets.rows[0]?.count || 0);

      // If status changed to 'active' and no customers assigned yet, assign them
      if (oldStatus !== 'active' && targetCount === 0) {
        const targetCriteria = target_criteria !== undefined ? target_criteria : existingResult.rows[0].target_criteria;
        const targetSegment = target_segment !== undefined ? target_segment : existingResult.rows[0].target_segment;
        
        // Check if we have valid criteria or segment
        let hasCriteria = false;
        if (targetCriteria) {
          let parsedCriteria = targetCriteria;
          if (typeof parsedCriteria === 'string') {
            try {
              parsedCriteria = JSON.parse(parsedCriteria);
            } catch (e) {
              parsedCriteria = null;
            }
          }
          if (parsedCriteria && typeof parsedCriteria === 'object') {
            hasCriteria = (
              (Array.isArray(parsedCriteria.risk_level) && parsedCriteria.risk_level.length > 0) ||
              (Array.isArray(parsedCriteria.segment) && parsedCriteria.segment.length > 0) ||
              (parsedCriteria.min_churn_score !== null && parsedCriteria.min_churn_score !== undefined) ||
              (parsedCriteria.max_churn_score !== null && parsedCriteria.max_churn_score !== undefined) ||
              (Array.isArray(parsedCriteria.branch) && parsedCriteria.branch.length > 0) ||
              (Array.isArray(parsedCriteria.product_type) && parsedCriteria.product_type.length > 0)
            );
          }
        }
        const hasSegment = targetSegment && targetSegment.trim() !== '';
        
        if (hasCriteria || hasSegment) {
          assignedCount = await assignCustomersToCampaign(campaignId, targetCriteria, targetSegment);
        }
      }
    }

    // Get full campaign with creator name
    const fullResult = await pool.query(
      `SELECT 
        c.*,
        u.name as created_by_name,
        COUNT(DISTINCT ct.id) as target_count,
        COUNT(DISTINCT CASE WHEN ct.status = 'converted' THEN ct.id END) as converted_count
      FROM campaigns c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN campaign_targets ct ON c.id = ct.campaign_id
      WHERE c.id = $1
      GROUP BY c.id, u.name`,
      [campaignId]
    );

    res.json({
      success: true,
      campaign: {
        id: fullResult.rows[0].id,
        name: fullResult.rows[0].name,
        description: fullResult.rows[0].description,
        campaign_type: fullResult.rows[0].campaign_type,
        status: fullResult.rows[0].status,
        target_segment: fullResult.rows[0].target_segment,
        target_criteria: fullResult.rows[0].target_criteria,
        start_date: fullResult.rows[0].start_date,
        end_date: fullResult.rows[0].end_date,
        budget: parseFloat(fullResult.rows[0].budget) || 0,
        allocated_budget: parseFloat(fullResult.rows[0].allocated_budget) || 0,
        created_by: fullResult.rows[0].created_by,
        created_by_name: fullResult.rows[0].created_by_name,
        target_count: parseInt(fullResult.rows[0].target_count) || 0,
        converted_count: parseInt(fullResult.rows[0].converted_count) || 0,
        created_at: fullResult.rows[0].created_at,
        updated_at: fullResult.rows[0].updated_at
      },
      message: status === 'active' && assignedCount > 0 
        ? `Campaign launched and ${assignedCount} customers assigned automatically`
        : status === 'active' && assignedCount === 0 && existingResult.rows[0].status !== 'active'
          ? 'Campaign launched. No customers matched the target criteria.'
          : undefined
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update campaign',
      error: error.message
    });
  }
});

// @route   DELETE /api/campaigns/:id
// @desc    Delete a campaign
// @access  Private (Analyst, Manager, Admin)
router.delete('/:id', authenticateToken, requireRole(['retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    // Ensure campaigns tables exist
    await ensureCampaignsTables();

    const campaignId = req.params.id;

    // Check if campaign exists
    const existingResult = await pool.query(
      'SELECT * FROM campaigns WHERE id = $1',
      [campaignId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    await pool.query('DELETE FROM campaigns WHERE id = $1', [campaignId]);

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete campaign',
      error: error.message
    });
  }
});

module.exports = router;

