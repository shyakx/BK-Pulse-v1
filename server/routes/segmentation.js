const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Helper function to build WHERE clause from criteria
function buildCriteriaWhereClause(criteria, paramCount = 1) {
  const conditions = [];
  const params = [];
  let count = paramCount;

  // Ensure criteria is an object
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

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params, nextParamCount: count };
}

// Helper function to calculate customer count for criteria
async function calculateCustomerCount(criteria) {
  // Handle null or undefined criteria
  if (!criteria || typeof criteria !== 'object') {
    return 0;
  }
  
  // Parse criteria if it's a string
  if (typeof criteria === 'string') {
    try {
      criteria = JSON.parse(criteria);
    } catch (parseError) {
      console.error('Error parsing criteria JSON in calculateCustomerCount:', parseError);
      return 0;
    }
  }
  
  const { whereClause, params } = buildCriteriaWhereClause(criteria);
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM customers ${whereClause}`,
    params
  ).catch(err => {
    console.error('Error in calculateCustomerCount query:', err);
    throw err;
  });
  return parseInt(result.rows[0]?.count || 0);
}

// @route   GET /api/segmentation
// @desc    Get all customer segments
// @access  Private (Analyst, Manager, Admin)
router.get('/', authenticateToken, requireRole(['retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    // Check if tables exist first
    try {
      await pool.query('SELECT 1 FROM customer_segments LIMIT 1');
    } catch (tableError) {
      // Table doesn't exist, return empty array
      return res.json({
        success: true,
        segments: []
      });
    }

    const query = `
      SELECT 
        cs.id,
        cs.name,
        cs.description,
        cs.criteria,
        cs.customer_count,
        cs.created_by,
        cs.created_at,
        cs.updated_at,
        u.name as created_by_name,
        COUNT(DISTINCT sc.customer_id) as actual_customer_count
      FROM customer_segments cs
      LEFT JOIN users u ON cs.created_by = u.id
      LEFT JOIN segment_customers sc ON cs.id = sc.segment_id
      GROUP BY cs.id, cs.name, cs.description, cs.criteria, cs.customer_count, cs.created_by, cs.created_at, cs.updated_at, u.name
      ORDER BY cs.created_at DESC
    `;

    const result = await pool.query(query).catch(err => {
      console.error('Query error:', err);
      throw err;
    });

    const segments = result.rows.map(row => {
      // Parse criteria if it's a string
      let criteria = row.criteria;
      if (typeof criteria === 'string') {
        try {
          criteria = JSON.parse(criteria);
        } catch (parseError) {
          console.error('Error parsing criteria JSON:', parseError);
          criteria = {};
        }
      }

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        criteria: criteria,
        customer_count: row.actual_customer_count || row.customer_count || 0,
        created_by: row.created_by,
        created_by_name: row.created_by_name,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    });

    res.json({
      success: true,
      segments
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch segments',
      error: error.message
    });
  }
});

// @route   GET /api/segmentation/:id
// @desc    Get a single segment with customers
// @access  Private (Analyst, Manager, Admin)
router.get('/:id', authenticateToken, requireRole(['retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { include_customers = 'false', page = 1, limit = 50 } = req.query;

    // Get segment info
    const segmentResult = await pool.query(
      `SELECT cs.*, u.name as created_by_name 
       FROM customer_segments cs
       LEFT JOIN users u ON cs.created_by = u.id
       WHERE cs.id = $1`,
      [id]
    );

    if (segmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Segment not found'
      });
    }

    const segment = segmentResult.rows[0];
    // Parse criteria if it's a string
    let criteria = segment.criteria;
    if (typeof criteria === 'string') {
      try {
        criteria = JSON.parse(criteria);
      } catch (parseError) {
        console.error('Error parsing criteria JSON:', parseError);
        criteria = {};
      }
    }

    // Calculate current customer count based on criteria
    const customerCount = await calculateCustomerCount(criteria).catch(err => {
      console.error('Error calculating customer count:', err);
      return 0;
    });

    const segmentData = {
      id: segment.id,
      name: segment.name,
      description: segment.description,
      criteria: criteria,
      customer_count: customerCount,
      created_by: segment.created_by,
      created_by_name: segment.created_by_name,
      created_at: segment.created_at,
      updated_at: segment.updated_at
    };

    // Optionally include customers matching the criteria
    if (include_customers === 'true') {
      try {
        const offset = (page - 1) * limit;
        const { whereClause, params } = buildCriteriaWhereClause(criteria, 1);
        
        const customersResult = await pool.query(
          `SELECT c.*, u.name as assigned_officer_name
           FROM customers c
           LEFT JOIN users u ON c.assigned_officer_id = u.id
           ${whereClause}
           ORDER BY c.churn_score DESC, c.name ASC
           LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
          [...params, limit, offset]
        ).catch(err => {
          console.error('Error fetching customers for segment:', err);
          return { rows: [] };
        });

        const totalResult = await pool.query(
          `SELECT COUNT(*) as total FROM customers ${whereClause}`,
          params
        ).catch(err => {
          console.error('Error counting customers for segment:', err);
          return { rows: [{ total: 0 }] };
        });

        segmentData.customers = customersResult.rows || [];
        segmentData.pagination = {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(totalResult.rows[0]?.total || 0),
          pages: Math.ceil(parseInt(totalResult.rows[0]?.total || 0) / limit)
        };
      } catch (err) {
        console.error('Error including customers in segment:', err);
        segmentData.customers = [];
        segmentData.pagination = {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        };
      }
    }

    res.json({
      success: true,
      segment: segmentData
    });
  } catch (error) {
    console.error('Error fetching segment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch segment',
      error: error.message
    });
  }
});

// @route   POST /api/segmentation
// @desc    Create a new customer segment
// @access  Private (Analyst, Manager, Admin)
router.post('/', authenticateToken, requireRole(['retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    const { name, description, criteria } = req.body;

    // Validate required fields
    if (!name || !criteria) {
      return res.status(400).json({
        success: false,
        message: 'Name and criteria are required'
      });
    }

    // Calculate customer count based on criteria
    const customerCount = await calculateCustomerCount(criteria);

    // Insert segment
    const result = await pool.query(
      `INSERT INTO customer_segments (name, description, criteria, customer_count, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description || null, JSON.stringify(criteria), customerCount, req.user.id]
    );

    const segment = result.rows[0];

    // Optionally add customers to segment_customers table
    if (customerCount > 0) {
      const { whereClause, params } = buildCriteriaWhereClause(criteria, 1);
      const customersResult = await pool.query(
        `SELECT id FROM customers ${whereClause}`,
        params
      );

      if (customersResult.rows.length > 0) {
        const insertValues = customersResult.rows.map((row, index) => {
          const paramIndex = index * 2 + 1;
          return `($1, $${paramIndex + 1})`;
        }).join(', ');

        const customerIds = customersResult.rows.map(row => row.id);
        const insertParams = [segment.id, ...customerIds];

        await pool.query(
          `INSERT INTO segment_customers (segment_id, customer_id)
           SELECT * FROM UNNEST($1::INTEGER[], $2::INTEGER[])
           ON CONFLICT (segment_id, customer_id) DO NOTHING`,
          [[segment.id], customerIds]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Segment created successfully',
      segment: {
        id: segment.id,
        name: segment.name,
        description: segment.description,
        criteria: segment.criteria,
        customer_count: segment.customer_count,
        created_by: segment.created_by,
        created_at: segment.created_at
      }
    });
  } catch (error) {
    console.error('Error creating segment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create segment',
      error: error.message
    });
  }
});

// @route   DELETE /api/segmentation/:id
// @desc    Delete a customer segment
// @access  Private (Analyst, Manager, Admin)
router.delete('/:id', authenticateToken, requireRole(['retentionAnalyst', 'retentionManager', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if segment exists
    const segmentResult = await pool.query(
      'SELECT id FROM customer_segments WHERE id = $1',
      [id]
    );

    if (segmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Segment not found'
      });
    }

    // Delete segment (cascade will delete segment_customers)
    await pool.query('DELETE FROM customer_segments WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Segment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting segment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete segment',
      error: error.message
    });
  }
});

module.exports = router;

