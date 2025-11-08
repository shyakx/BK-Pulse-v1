const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/retention-notes
// @desc    Get all retention notes with filters
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if retention_notes table exists, create if not
    try {
      await pool.query('SELECT 1 FROM retention_notes LIMIT 1');
    } catch (tableError) {
      // Table doesn't exist, create it
      await pool.query(`
        CREATE TABLE IF NOT EXISTS retention_notes (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
          officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          note TEXT NOT NULL,
          priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
          follow_up_date DATE,
          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'resolved')),
          tags TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create indexes
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_retention_notes_customer_id ON retention_notes(customer_id);
        CREATE INDEX IF NOT EXISTS idx_retention_notes_officer_id ON retention_notes(officer_id);
        CREATE INDEX IF NOT EXISTS idx_retention_notes_status ON retention_notes(status);
        CREATE INDEX IF NOT EXISTS idx_retention_notes_created_at ON retention_notes(created_at);
      `);
      
      // Create trigger for updated_at if function exists
      try {
        await pool.query(`
          CREATE TRIGGER update_retention_notes_updated_at 
          BEFORE UPDATE ON retention_notes
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
        `);
      } catch (triggerError) {
        // Trigger might already exist or function doesn't exist - not critical
      }
    }

    const { 
      page = 1, 
      limit = 10, 
      customer_id = null,
      status = null,
      priority = null,
      search = ''
    } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        rn.*,
        c.customer_id as customer_customer_id,
        c.name as customer_name,
        u.name as officer_name
      FROM retention_notes rn
      LEFT JOIN customers c ON rn.customer_id = c.id
      LEFT JOIN users u ON rn.officer_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filter by officer (users can only see their own notes unless they're managers/admins)
    if (req.user.role === 'retentionOfficer') {
      paramCount++;
      query += ` AND rn.officer_id = $${paramCount}`;
      params.push(req.user.id);
    }

    if (customer_id) {
      paramCount++;
      // Handle both numeric ID and string customer_id - cast appropriately
      const isNumeric = /^\d+$/.test(String(customer_id));
      if (isNumeric) {
        query += ` AND (rn.customer_id = $${paramCount}::integer OR c.customer_id::text = $${paramCount}::text)`;
      } else {
        query += ` AND (rn.customer_id::text = $${paramCount} OR c.customer_id = $${paramCount})`;
      }
      params.push(customer_id);
    }

    if (status) {
      paramCount++;
      query += ` AND rn.status = $${paramCount}`;
      params.push(status);
    }

    if (priority) {
      paramCount++;
      query += ` AND rn.priority = $${paramCount}`;
      params.push(priority);
    }

    if (search) {
      paramCount++;
      query += ` AND (rn.note ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Count total (build separate count query to avoid issues with complex SELECT)
    let countQuery = `
      SELECT COUNT(*) as count
      FROM retention_notes rn
      LEFT JOIN customers c ON rn.customer_id = c.id
      LEFT JOIN users u ON rn.officer_id = u.id
      WHERE 1=1
    `;
    
    // Apply same filters to count query
    const countParams = [];
    let countParamCount = 0;
    
    if (req.user.role === 'retentionOfficer') {
      countParamCount++;
      countQuery += ` AND rn.officer_id = $${countParamCount}`;
      countParams.push(req.user.id);
    }
    
    if (customer_id) {
      countParamCount++;
      // Handle both numeric ID and string customer_id - cast appropriately
      const isNumeric = /^\d+$/.test(String(customer_id));
      if (isNumeric) {
        countQuery += ` AND (rn.customer_id = $${countParamCount}::integer OR c.customer_id::text = $${countParamCount}::text)`;
      } else {
        countQuery += ` AND (rn.customer_id::text = $${countParamCount} OR c.customer_id = $${countParamCount})`;
      }
      countParams.push(customer_id);
    }
    
    if (status) {
      countParamCount++;
      countQuery += ` AND rn.status = $${countParamCount}`;
      countParams.push(status);
    }
    
    if (priority) {
      countParamCount++;
      countQuery += ` AND rn.priority = $${countParamCount}`;
      countParams.push(priority);
    }
    
    if (search) {
      countParamCount++;
      countQuery += ` AND (rn.note ILIKE $${countParamCount} OR c.name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.count || 0);

    // Get paginated results
    paramCount++;
    query += ` ORDER BY rn.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);

    // Format response
    const notes = result.rows.map(row => ({
      id: row.id,
      customer_id: row.customer_id,
      customer_customer_id: row.customer_customer_id,
      customer_name: row.customer_name,
      officer_id: row.officer_id,
      officer_name: row.officer_name,
      note: row.note,
      priority: row.priority,
      follow_up_date: row.follow_up_date,
      status: row.status,
      tags: row.tags || [],
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    res.json({
      success: true,
      notes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching retention notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch retention notes',
      error: error.message
    });
  }
});

// @route   GET /api/retention-notes/:id
// @desc    Get retention note by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const noteId = req.params.id;

    const result = await pool.query(
      `SELECT 
        rn.*,
        c.customer_id as customer_customer_id,
        c.name as customer_name,
        u.name as officer_name
      FROM retention_notes rn
      LEFT JOIN customers c ON rn.customer_id = c.id
      LEFT JOIN users u ON rn.officer_id = u.id
      WHERE rn.id = $1`,
      [noteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Retention note not found'
      });
    }

    const note = result.rows[0];

    // Check permissions
    if (req.user.role === 'retentionOfficer' && note.officer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this note'
      });
    }

    res.json({
      success: true,
      note: {
        id: note.id,
        customer_id: note.customer_id,
        customer_customer_id: note.customer_customer_id,
        customer_name: note.customer_name,
        officer_id: note.officer_id,
        officer_name: note.officer_name,
        note: note.note,
        priority: note.priority,
        follow_up_date: note.follow_up_date,
        status: note.status,
        tags: note.tags || [],
        created_at: note.created_at,
        updated_at: note.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching retention note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch retention note',
      error: error.message
    });
  }
});

// @route   POST /api/retention-notes
// @desc    Create a new retention note
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customer_id, note, priority = 'medium', follow_up_date, status = 'active', tags = [] } = req.body;

    if (!note || !customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID and note are required'
      });
    }

    // Resolve customer_id (could be customer.id or customer.customer_id)
    let customerDbId = null;
    if (typeof customer_id === 'string') {
      // Try to find by customer_id first
      let customerResult = await pool.query(
        'SELECT id FROM customers WHERE customer_id = $1',
        [customer_id]
      ).catch(err => {
        console.error('Error querying by customer_id:', err);
        return { rows: [] };
      });
      
      // If not found, try by id (in case customer_id is actually numeric string)
      if (customerResult.rows.length === 0 && /^\d+$/.test(customer_id)) {
        customerResult = await pool.query(
          'SELECT id FROM customers WHERE id = $1',
          [parseInt(customer_id)]
        ).catch(err => {
          console.error('Error querying by id:', err);
          return { rows: [] };
        });
      }
      
      if (customerResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
      customerDbId = customerResult.rows[0].id;
    } else {
      customerDbId = customer_id;
    }

    const result = await pool.query(
      `INSERT INTO retention_notes (customer_id, officer_id, note, priority, follow_up_date, status, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [customerDbId, req.user.id, note, priority, follow_up_date || null, status, tags]
    );

    // Get full note with customer details
    const fullResult = await pool.query(
      `SELECT 
        rn.*,
        c.customer_id as customer_customer_id,
        c.name as customer_name,
        u.name as officer_name
      FROM retention_notes rn
      LEFT JOIN customers c ON rn.customer_id = c.id
      LEFT JOIN users u ON rn.officer_id = u.id
      WHERE rn.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      success: true,
      note: {
        id: fullResult.rows[0].id,
        customer_id: fullResult.rows[0].customer_id,
        customer_customer_id: fullResult.rows[0].customer_customer_id,
        customer_name: fullResult.rows[0].customer_name,
        officer_id: fullResult.rows[0].officer_id,
        officer_name: fullResult.rows[0].officer_name,
        note: fullResult.rows[0].note,
        priority: fullResult.rows[0].priority,
        follow_up_date: fullResult.rows[0].follow_up_date,
        status: fullResult.rows[0].status,
        tags: fullResult.rows[0].tags || [],
        created_at: fullResult.rows[0].created_at,
        updated_at: fullResult.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Error creating retention note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create retention note',
      error: error.message
    });
  }
});

// @route   PATCH /api/retention-notes/:id
// @desc    Update a retention note
// @access  Private
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const noteId = req.params.id;
    const { note, priority, follow_up_date, status, tags } = req.body;

    // Check if note exists and user has permission
    const existingResult = await pool.query(
      'SELECT * FROM retention_notes WHERE id = $1',
      [noteId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Retention note not found'
      });
    }

    const existingNote = existingResult.rows[0];

    // Check permissions
    if (req.user.role === 'retentionOfficer' && existingNote.officer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this note'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;

    if (note !== undefined) {
      paramCount++;
      updates.push(`note = $${paramCount}`);
      params.push(note);
    }

    if (priority !== undefined) {
      paramCount++;
      updates.push(`priority = $${paramCount}`);
      params.push(priority);
    }

    if (follow_up_date !== undefined) {
      paramCount++;
      updates.push(`follow_up_date = $${paramCount}`);
      params.push(follow_up_date || null);
    }

    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      params.push(status);
    }

    if (tags !== undefined) {
      paramCount++;
      updates.push(`tags = $${paramCount}`);
      params.push(tags);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    paramCount++;
    params.push(noteId);

    const updateQuery = `
      UPDATE retention_notes 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, params);

    // Get full note with customer details
    const fullResult = await pool.query(
      `SELECT 
        rn.*,
        c.customer_id as customer_customer_id,
        c.name as customer_name,
        u.name as officer_name
      FROM retention_notes rn
      LEFT JOIN customers c ON rn.customer_id = c.id
      LEFT JOIN users u ON rn.officer_id = u.id
      WHERE rn.id = $1`,
      [noteId]
    );

    res.json({
      success: true,
      note: {
        id: fullResult.rows[0].id,
        customer_id: fullResult.rows[0].customer_id,
        customer_customer_id: fullResult.rows[0].customer_customer_id,
        customer_name: fullResult.rows[0].customer_name,
        officer_id: fullResult.rows[0].officer_id,
        officer_name: fullResult.rows[0].officer_name,
        note: fullResult.rows[0].note,
        priority: fullResult.rows[0].priority,
        follow_up_date: fullResult.rows[0].follow_up_date,
        status: fullResult.rows[0].status,
        tags: fullResult.rows[0].tags || [],
        created_at: fullResult.rows[0].created_at,
        updated_at: fullResult.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Error updating retention note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update retention note',
      error: error.message
    });
  }
});

// @route   DELETE /api/retention-notes/:id
// @desc    Delete a retention note
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const noteId = req.params.id;

    // Check if note exists and user has permission
    const existingResult = await pool.query(
      'SELECT * FROM retention_notes WHERE id = $1',
      [noteId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Retention note not found'
      });
    }

    const existingNote = existingResult.rows[0];

    // Check permissions
    if (req.user.role === 'retentionOfficer' && existingNote.officer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this note'
      });
    }

    await pool.query('DELETE FROM retention_notes WHERE id = $1', [noteId]);

    res.json({
      success: true,
      message: 'Retention note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting retention note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete retention note',
      error: error.message
    });
  }
});

module.exports = router;

