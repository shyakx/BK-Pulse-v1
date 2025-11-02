/**
 * Seed Retention Notes
 * Adds sample retention notes to the database for testing
 */

require('dotenv').config();
const pool = require('../config/database');

async function seedRetentionNotes() {
  try {
    console.log('🌱 Seeding retention notes...');

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'retention_notes'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚠️  retention_notes table does not exist. Creating...');
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
      console.log('✅ Table created');
    }

    // Check if notes already exist
    const existingNotes = await pool.query('SELECT COUNT(*) as count FROM retention_notes');
    const count = parseInt(existingNotes.rows[0].count);

    if (count > 0) {
      console.log(`ℹ️  Found ${count} existing notes. Skipping seed.`);
      console.log('   To re-seed, delete existing notes first.');
      return;
    }

    // Get customer and user IDs
    const customers = await pool.query('SELECT id, customer_id FROM customers LIMIT 10');
    const users = await pool.query('SELECT id FROM users WHERE role = \'retentionOfficer\' LIMIT 2');

    if (customers.rows.length === 0) {
      console.log('⚠️  No customers found. Please seed customers first.');
      return;
    }

    if (users.rows.length === 0) {
      console.log('⚠️  No officers found. Please seed users first.');
      return;
    }

    const sampleNotes = [
      {
        customer_id: customers.rows[0].id,
        officer_id: users.rows[0].id,
        note: 'Customer expressed concerns about account fees. Discussed fee waiver options for next quarter.',
        priority: 'high',
        follow_up_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        tags: ['Call']
      },
      {
        customer_id: customers.rows[1]?.id || customers.rows[0].id,
        officer_id: users.rows[0].id,
        note: 'Followed up on previous conversation about savings products. Customer showed interest in premium account.',
        priority: 'medium',
        follow_up_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        tags: ['Call']
      },
      {
        customer_id: customers.rows[2]?.id || customers.rows[0].id,
        officer_id: users.rows[1]?.id || users.rows[0].id,
        note: 'High-value customer requested meeting to discuss investment opportunities. Scheduled for next week.',
        priority: 'high',
        follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        tags: ['Meeting']
      },
      {
        customer_id: customers.rows[0].id,
        officer_id: users.rows[0].id,
        note: 'Sent personalized email with account analysis and recommendations. Waiting for response.',
        priority: 'medium',
        follow_up_date: null,
        status: 'active',
        tags: ['Email']
      },
      {
        customer_id: customers.rows[3]?.id || customers.rows[0].id,
        officer_id: users.rows[1]?.id || users.rows[0].id,
        note: 'Customer called regarding account upgrade inquiry. Provided detailed information about premium benefits.',
        priority: 'medium',
        follow_up_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        tags: ['Call']
      },
      {
        customer_id: customers.rows[4]?.id || customers.rows[0].id,
        officer_id: users.rows[1]?.id || users.rows[0].id,
        note: 'Regular check-in call completed. Customer satisfied with current services. No immediate concerns.',
        priority: 'low',
        follow_up_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'resolved',
        tags: ['Call']
      },
      {
        customer_id: customers.rows[2]?.id || customers.rows[0].id,
        officer_id: users.rows[0].id,
        note: 'Follow-up required on fee waiver offer. Customer needs to review and respond.',
        priority: 'medium',
        follow_up_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        tags: ['Call']
      }
    ];

    for (const note of sampleNotes) {
      await pool.query(
        `INSERT INTO retention_notes (customer_id, officer_id, note, priority, follow_up_date, status, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [note.customer_id, note.officer_id, note.note, note.priority, note.follow_up_date, note.status, note.tags]
      );
    }

    const finalCount = await pool.query('SELECT COUNT(*) as count FROM retention_notes');
    console.log(`✅ Successfully seeded ${finalCount.rows[0].count} retention notes!`);
    console.log('   Refresh the Retention Notes page to see them.');

  } catch (error) {
    console.error('❌ Error seeding retention notes:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedRetentionNotes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = seedRetentionNotes;

