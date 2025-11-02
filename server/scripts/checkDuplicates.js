/**
 * Check for duplicate customers in the database
 * Usage: node server/scripts/checkDuplicates.js
 */

const pool = require('../config/database');

async function checkDuplicates() {
  try {
    console.log('🔍 Checking for duplicate customers...\n');
    
    // Check for duplicate customer_id
    const duplicateIds = await pool.query(`
      SELECT customer_id, COUNT(*) as count
      FROM customers
      GROUP BY customer_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 20
    `);
    
    if (duplicateIds.rows.length > 0) {
      console.log(`❌ Found ${duplicateIds.rows.length} duplicate customer_id values:\n`);
      duplicateIds.rows.forEach(row => {
        console.log(`   customer_id: ${row.customer_id} - appears ${row.count} times`);
      });
      console.log('\n');
    } else {
      console.log('✅ No duplicate customer_id values found\n');
    }
    
    // Check for duplicate emails
    const duplicateEmails = await pool.query(`
      SELECT email, COUNT(*) as count
      FROM customers
      WHERE email IS NOT NULL
      GROUP BY email
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 20
    `);
    
    if (duplicateEmails.rows.length > 0) {
      console.log(`❌ Found ${duplicateEmails.rows.length} duplicate email values:\n`);
      duplicateEmails.rows.forEach(row => {
        console.log(`   email: ${row.email} - appears ${row.count} times`);
      });
      console.log('\n');
    } else {
      console.log('✅ No duplicate email values found\n');
    }
    
    // Get total count
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM customers');
    const totalCount = parseInt(totalResult.rows[0].count || 0);
    
    // Get unique count by customer_id
    const uniqueResult = await pool.query('SELECT COUNT(DISTINCT customer_id) as count FROM customers');
    const uniqueCount = parseInt(uniqueResult.rows[0].count || 0);
    
    console.log(`📊 Total records: ${totalCount.toLocaleString()}`);
    console.log(`📊 Unique customer_id: ${uniqueCount.toLocaleString()}`);
    
    if (totalCount !== uniqueCount) {
      const duplicates = totalCount - uniqueCount;
      console.log(`\n⚠️  Found ${duplicates.toLocaleString()} duplicate records (by customer_id)`);
      console.log(`   You can remove duplicates to reduce to ${uniqueCount.toLocaleString()} customers\n`);
    } else {
      console.log('\n✅ All customer_id values are unique!\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDuplicates();
