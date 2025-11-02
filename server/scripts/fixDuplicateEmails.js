/**
 * Fix duplicate emails by making them unique
 * Usage: node server/scripts/fixDuplicateEmails.js
 */

const pool = require('../config/database');

async function fixDuplicateEmails() {
  try {
    console.log('🔍 Finding and fixing duplicate emails...\n');
    
    // Find customers with duplicate emails
    const duplicateEmails = await pool.query(`
      SELECT email, COUNT(*) as count, ARRAY_AGG(id ORDER BY id) as ids
      FROM customers
      WHERE email IS NOT NULL
      GROUP BY email
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    if (duplicateEmails.rows.length === 0) {
      console.log('✅ No duplicate emails found!\n');
      await pool.end();
      return;
    }
    
    console.log(`⚠️  Found ${duplicateEmails.rows.length} duplicate email groups\n`);
    console.log('🔧 Fixing duplicates (keeping first occurrence, updating rest)...\n');
    
    let totalFixed = 0;
    
    for (const row of duplicateEmails.rows) {
      const email = row.email;
      const ids = row.ids;
      const count = parseInt(row.count);
      
      // Keep the first ID, update the rest
      for (let i = 1; i < ids.length; i++) {
        const customerId = ids[i];
        const newEmail = email.replace('@email.com', `+${customerId}@email.com`);
        
        await pool.query(
          'UPDATE customers SET email = $1 WHERE id = $2',
          [newEmail, customerId]
        );
        
        totalFixed++;
        
        if (totalFixed % 1000 === 0) {
          console.log(`⏳ Fixed ${totalFixed.toLocaleString()} emails...`);
        }
      }
    }
    
    console.log(`\n✅ Fixed ${totalFixed.toLocaleString()} duplicate emails\n`);
    
    // Verify
    const verifyDuplicates = await pool.query(`
      SELECT email, COUNT(*) as count
      FROM customers
      WHERE email IS NOT NULL
      GROUP BY email
      HAVING COUNT(*) > 1
    `);
    
    if (verifyDuplicates.rows.length === 0) {
      console.log('✅ Verification: All emails are now unique!\n');
    } else {
      console.log(`⚠️  Warning: ${verifyDuplicates.rows.length} duplicate emails still exist\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixDuplicateEmails();

