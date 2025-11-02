const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// @route   GET /api/admin/maintenance
// @desc    Get system maintenance information
// @access  Private (Admin only)
router.get('/maintenance', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get database information
    const dbInfo = await pool.query(`
      SELECT 
        pg_database.datname,
        pg_size_pretty(pg_database_size(pg_database.datname)) AS size
      FROM pg_database
      WHERE datname = current_database()
    `);

    // Get table sizes
    const tableSizes = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);

    // Get row counts for major tables
    const rowCounts = await pool.query(`
      SELECT 
        'customers' as table_name, COUNT(*) as row_count FROM customers
      UNION ALL
      SELECT 'actions', COUNT(*) FROM actions
      UNION ALL
      SELECT 'retention_notes', COUNT(*) FROM retention_notes
      UNION ALL
      SELECT 'campaigns', COUNT(*) FROM campaigns
      UNION ALL
      SELECT 'users', COUNT(*) FROM users
    `);

    // Get last backup info (if backup system exists)
    const lastBackup = await pool.query(`
      SELECT MAX(created_at) as last_backup
      FROM audit_logs
      WHERE action = 'database_backup'
      LIMIT 1
    `);

    // Get system version from package.json
    let systemVersion = '1.0.0';
    try {
      const packagePath = path.join(__dirname, '../../package.json');
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        systemVersion = packageJson.version || '1.0.0';
      }
    } catch (err) {
      console.error('Error reading package.json:', err);
    }

    res.json({
      success: true,
      maintenance: {
        database: {
          name: dbInfo.rows[0]?.datname || 'unknown',
          size: dbInfo.rows[0]?.size || 'unknown',
          tables: tableSizes.rows.map(row => ({
            name: row.tablename,
            size: row.size,
            size_bytes: parseInt(row.size_bytes) || 0
          })),
          row_counts: rowCounts.rows.map(row => ({
            table: row.table_name,
            count: parseInt(row.row_count) || 0
          }))
        },
        system: {
          version: systemVersion,
          last_backup: lastBackup.rows[0]?.last_backup || null,
          uptime: process.uptime(),
          node_version: process.version
        }
      }
    });
  } catch (error) {
    console.error('Error fetching maintenance info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance information',
      error: error.message
    });
  }
});

// @route   POST /api/admin/backup
// @desc    Create a database backup (logs the action)
// @access  Private (Admin only)
router.post('/backup', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // In a real application, this would trigger an actual backup process
    // For now, we'll just log the action
    
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, table_name, ip_address, user_agent)
       VALUES ($1, 'database_backup', 'database', $2, $3)`,
      [req.user.id, req.ip, req.get('user-agent') || 'unknown']
    );

    res.json({
      success: true,
      message: 'Backup process initiated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error initiating backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate backup',
      error: error.message
    });
  }
});

// @route   POST /api/admin/optimize
// @desc    Optimize database (run VACUUM ANALYZE)
// @access  Private (Admin only)
router.post('/optimize', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Run VACUUM ANALYZE on all tables
    await pool.query('VACUUM ANALYZE');

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, table_name, ip_address, user_agent)
       VALUES ($1, 'database_optimize', 'database', $2, $3)`,
      [req.user.id, req.ip, req.get('user-agent') || 'unknown']
    );

    res.json({
      success: true,
      message: 'Database optimization completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error optimizing database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize database',
      error: error.message
    });
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard overview
// @access  Private (Admin only)
router.get('/dashboard', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get system health metrics
    const activeUsers = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE is_active = true"
    );
    const totalCustomers = await pool.query(
      "SELECT COUNT(*) as count FROM customers"
    );
    const highRiskCustomers = await pool.query(
      "SELECT COUNT(*) as count FROM customers WHERE risk_level = 'high'"
    );
    
    // Get recent activity
    const recentLogs = await pool.query(`
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    // Get data quality metrics
    const dataQuality = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN churn_score IS NULL THEN 1 END) as missing_churn,
        COUNT(CASE WHEN account_balance IS NULL THEN 1 END) as missing_balance,
        COUNT(CASE WHEN assigned_officer_id IS NULL THEN 1 END) as unassigned
      FROM customers
    `);

    res.json({
      success: true,
      dashboard: {
        systemHealth: {
          status: 'healthy',
          activeUsers: parseInt(activeUsers.rows[0]?.count || 0),
          totalCustomers: parseInt(totalCustomers.rows[0]?.count || 0),
          highRiskCustomers: parseInt(highRiskCustomers.rows[0]?.count || 0)
        },
        dataQuality: {
          totalCustomers: parseInt(dataQuality.rows[0]?.total || 0),
          missingChurn: parseInt(dataQuality.rows[0]?.missing_churn || 0),
          missingBalance: parseInt(dataQuality.rows[0]?.missing_balance || 0),
          unassigned: parseInt(dataQuality.rows[0]?.unassigned || 0)
        },
        recentActivity: recentLogs.rows.map(row => ({
          id: row.id,
          user: row.user_name || 'System',
          action: row.action,
          table_name: row.table_name,
          created_at: row.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard',
      error: error.message
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT 
        id,
        email,
        name,
        role,
        is_active,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM customers WHERE assigned_officer_id = users.id) as assigned_customers
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      users: users.rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        is_active: row.is_active,
        assigned_customers: parseInt(row.assigned_customers || 0),
        created_at: row.created_at,
        updated_at: row.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// @route   POST /api/admin/users
// @desc    Create a new user
// @access  Private (Admin only)
router.post('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { email, name, role, password } = req.body;

    if (!email || !name || !role || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, name, role, and password are required'
      });
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, name, role, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, is_active, created_at`,
      [email, name, role, hashedPassword]
    );

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES ($1, 'create_user', 'users', $2, $3, $4, $5)`,
      [req.user.id, result.rows[0].id, JSON.stringify({ email, name, role }), req.ip, req.get('user-agent') || 'unknown']
    );

    res.status(201).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// @route   PATCH /api/admin/users/:id
// @desc    Update a user
// @access  Private (Admin only)
router.patch('/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, is_active, password } = req.body;

    // Get old values for audit log
    const oldUser = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (oldUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updates = [];
    const params = [];
    let paramCount = 0;

    if (email !== undefined) {
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email);
    }

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }

    if (role !== undefined) {
      paramCount++;
      updates.push(`role = $${paramCount}`);
      params.push(role);
    }

    if (is_active !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(is_active);
    }

    if (password !== undefined) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      paramCount++;
      updates.push(`password = $${paramCount}`);
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    paramCount++;
    params.push(id);
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      params
    );

    // Get updated user
    const updatedUser = await pool.query('SELECT id, email, name, role, is_active, updated_at FROM users WHERE id = $1', [id]);

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, 'update_user', 'users', $2, $3, $4, $5, $6)`,
      [req.user.id, id, JSON.stringify(oldUser.rows[0]), JSON.stringify(updatedUser.rows[0]), req.ip, req.get('user-agent') || 'unknown']
    );

    res.json({
      success: true,
      user: updatedUser.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// @route   GET /api/admin/models
// @desc    Get model registry and performance
// @access  Private (Admin only)
router.get('/models', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get model versions
    const modelVersions = await pool.query(`
      SELECT DISTINCT model_version, MAX(created_at) as last_evaluated
      FROM model_performance
      GROUP BY model_version
      ORDER BY MAX(created_at) DESC
    `);

    // Get latest performance metrics for each model
    const modelMetrics = await Promise.all(modelVersions.rows.map(async (version) => {
      const metrics = await pool.query(
        `SELECT metric_name, metric_value, evaluation_date, segment
         FROM model_performance
         WHERE model_version = $1
         AND evaluation_date = (SELECT MAX(evaluation_date) FROM model_performance WHERE model_version = $1)
         ORDER BY metric_name, segment`,
        [version.model_version]
      );

      return {
        version: version.model_version,
        last_evaluated: version.last_evaluated,
        metrics: metrics.rows.map(row => ({
          name: row.metric_name,
          value: parseFloat(row.metric_value),
          segment: row.segment,
          date: row.evaluation_date
        }))
      };
    }));

    res.json({
      success: true,
      models: modelMetrics
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch models',
      error: error.message
    });
  }
});

// @route   GET /api/admin/audit
// @desc    Get audit logs
// @access  Private (Admin only)
router.get('/audit', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id, action, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (user_id) {
      paramCount++;
      query += ` AND al.user_id = $${paramCount}`;
      params.push(user_id);
    }

    if (action) {
      paramCount++;
      query += ` AND al.action = $${paramCount}`;
      params.push(action);
    }

    if (startDate) {
      paramCount++;
      query += ` AND al.created_at >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND al.created_at <= $${paramCount}`;
      params.push(endDate);
    }

    // Count total
    const countQuery = query.replace(
      'SELECT al.*, u.name as user_name, u.email as user_email',
      'SELECT COUNT(*)'
    );
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || 0);

    // Get paginated results
    paramCount++;
    query += ` ORDER BY al.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      logs: result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        user_name: row.user_name,
        user_email: row.user_email,
        action: row.action,
        table_name: row.table_name,
        record_id: row.record_id,
        old_values: row.old_values,
        new_values: row.new_values,
        ip_address: row.ip_address,
        user_agent: row.user_agent,
        created_at: row.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

// @route   GET /api/admin/settings
// @desc    Get system settings
// @access  Private (Admin only)
router.get('/settings', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const settings = await pool.query(`
      SELECT 
        s.*,
        u.name as updated_by_name
      FROM system_settings s
      LEFT JOIN users u ON s.updated_by = u.id
      ORDER BY s.setting_key
    `);

    res.json({
      success: true,
      settings: settings.rows.map(row => ({
        id: row.id,
        key: row.setting_key,
        value: row.setting_value,
        description: row.description,
        updated_by: row.updated_by,
        updated_by_name: row.updated_by_name,
        updated_at: row.updated_at
      }))
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
});

// @route   PATCH /api/admin/settings/:key
// @desc    Update a system setting
// @access  Private (Admin only)
router.patch('/settings/:key', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    // Get old value for audit
    const oldSetting = await pool.query('SELECT * FROM system_settings WHERE setting_key = $1', [key]);

    const result = await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value, description, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (setting_key) 
       DO UPDATE SET setting_value = EXCLUDED.setting_value, 
                     description = COALESCE(EXCLUDED.description, system_settings.description),
                     updated_by = EXCLUDED.updated_by,
                     updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, value, description || null, req.user.id]
    );

    // Log the action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, 'update_setting', 'system_settings', $2, $3, $4, $5, $6)`,
      [req.user.id, result.rows[0].id, oldSetting.rows[0] ? JSON.stringify(oldSetting.rows[0]) : null, JSON.stringify(result.rows[0]), req.ip, req.get('user-agent') || 'unknown']
    );

    res.json({
      success: true,
      setting: {
        key: result.rows[0].setting_key,
        value: result.rows[0].setting_value,
        description: result.rows[0].description,
        updated_at: result.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting',
      error: error.message
    });
  }
});

// @route   GET /api/admin/data
// @desc    Get ETL pipeline and data management info
// @access  Private (Admin only)
router.get('/data', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get data source info
    const dataSources = await pool.query(`
      SELECT 
        table_name,
        COUNT(*) as row_count,
        MAX(updated_at) as last_updated
      FROM (
        SELECT 'customers' as table_name, updated_at FROM customers
        UNION ALL
        SELECT 'actions', updated_at FROM actions
        UNION ALL
        SELECT 'retention_notes', updated_at FROM retention_notes
      ) t
      GROUP BY table_name
    `);

    // Get table sizes
    const tableSizes = await pool.query(`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS size,
        pg_total_relation_size('public.' || tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size('public.' || tablename) DESC
    `);

    res.json({
      success: true,
      data: {
        sources: dataSources.rows.map(row => ({
          name: row.table_name,
          row_count: parseInt(row.row_count || 0),
          last_updated: row.last_updated
        })),
        table_sizes: tableSizes.rows.map(row => ({
          name: row.tablename,
          size: row.size,
          size_bytes: parseInt(row.size_bytes || 0)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching data info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data information',
      error: error.message
    });
  }
});

module.exports = router;

