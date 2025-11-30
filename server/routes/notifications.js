const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Helper function to ensure notifications table exists
async function ensureNotificationsTable() {
  try {
    await pool.query('SELECT 1 FROM notifications LIMIT 1');
  } catch (tableError) {
    // Table doesn't exist, create it
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('success', 'warning', 'error', 'info')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    `);
    
    // Create trigger for updated_at if function exists
    try {
      await pool.query(`
        CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    } catch (triggerError) {
      // Function might not exist, that's okay
      console.log('Note: update_updated_at_column function not found, skipping trigger creation');
    }
  }
}

// @route   GET /api/notifications
// @desc    Get notifications for the current user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    await ensureNotificationsTable();
    
    const { 
      limit = 10, 
      unread_only = false 
    } = req.query;
    
    let query = `
      SELECT id, type, title, message, read, created_at
      FROM notifications
      WHERE user_id = $1
    `;
    const params = [req.user.id];
    let paramCount = 1;
    
    if (unread_only === 'true' || unread_only === true) {
      paramCount++;
      query += ` AND read = false`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    if (limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
    }
    
    const result = await pool.query(query, params);
    
    // Get unread count
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [req.user.id]
    );
    const unreadCount = parseInt(unreadResult.rows[0]?.count || 0);
    
    res.json({
      success: true,
      notifications: result.rows.map(row => ({
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        read: row.read,
        created_at: row.created_at
      })),
      unread_count: unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    await ensureNotificationsTable();
    
    const notificationId = req.params.id;
    
    // Check if notification exists and belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Update notification
    await pool.query(
      `UPDATE notifications 
       SET read = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2`,
      [notificationId, req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read for the current user
// @access  Private
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await ensureNotificationsTable();
    
    // Update all notifications for user
    const result = await pool.query(
      `UPDATE notifications 
       SET read = true, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND read = false
       RETURNING id`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      message: `Marked ${result.rows.length} notifications as read`,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

module.exports = router;

