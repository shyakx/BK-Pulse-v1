const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// @route   GET /api/campaigns
// @desc    Get all campaigns with filters
// @access  Private (Analyst, Manager, Admin)
router.get('/', authenticateToken, requireRole(['retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
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
        c.*,
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

    query += ` GROUP BY c.id, u.name`;

    // Count total
    const countQuery = query.replace('SELECT c.*, u.name as created_by_name, COUNT(ct.id) as target_count, COUNT(CASE WHEN ct.status = \'converted\' THEN 1 END) as converted_count', 'SELECT COUNT(DISTINCT c.id)');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    paramCount++;
    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Format response
    const campaigns = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      campaign_type: row.campaign_type,
      status: row.status,
      target_segment: row.target_segment,
      target_criteria: row.target_criteria,
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
    }));

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
router.get('/:id/customers', authenticateToken, requireRole(['retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
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
router.get('/:id/performance', authenticateToken, requireRole(['retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
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
router.get('/:id', authenticateToken, requireRole(['retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
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

    const result = await pool.query(
      `INSERT INTO campaigns (name, description, campaign_type, status, target_segment, target_criteria, start_date, end_date, budget, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, description || null, campaign_type, status, target_segment || null, target_criteria || null, start_date || null, end_date || null, budget || null, req.user.id]
    );

    // Get full campaign with creator name
    const fullResult = await pool.query(
      `SELECT 
        c.*,
        u.name as created_by_name
      FROM campaigns c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1`,
      [result.rows[0].id]
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
        created_at: fullResult.rows[0].created_at,
        updated_at: fullResult.rows[0].updated_at
      }
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

    await pool.query(updateQuery, params);

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
      }
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

