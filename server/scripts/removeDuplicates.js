const pool = require('../config/database');

async function removeDuplicates() {
  console.log('🔍 Checking for and removing duplicate customers...\n');
  
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Find duplicate customer_id values
    console.log('1️⃣ Finding duplicate customer_id values...');
    const duplicateIds = await pool.query(`
      SELECT customer_id, COUNT(*) as count
      FROM customers
      GROUP BY customer_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    if (duplicateIds.rows.length > 0) {
      console.log(`⚠️  Found ${duplicateIds.rows.length} duplicate customer_id values`);
      
      for (const row of duplicateIds.rows) {
        console.log(`   Processing: ${row.customer_id} (${row.count} duplicates)`);
        
        // Get all duplicates, keep the one with the most recent updated_at
        const duplicates = await pool.query(`
          SELECT id, customer_id, updated_at, created_at
          FROM customers
          WHERE customer_id = $1
          ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
        `, [row.customer_id]);
        
        // Keep the first one (most recent), delete the rest
        const toKeep = duplicates.rows[0];
        const toDelete = duplicates.rows.slice(1);
        
        if (toDelete.length > 0) {
          const deleteIds = toDelete.map(d => d.id);
          await pool.query(`
            DELETE FROM customers
            WHERE id = ANY($1)
          `, [deleteIds]);
          
          console.log(`   ✅ Kept ID ${toKeep.id}, deleted ${toDelete.length} duplicates`);
        }
      }
      
      console.log('\n✅ Duplicate customer_id values removed\n');
    } else {
      console.log('✅ No duplicate customer_id values found\n');
    }
    
    // Find duplicate email addresses (keep one, delete others)
    console.log('2️⃣ Finding duplicate email addresses...');
    const duplicateEmails = await pool.query(`
      SELECT email, COUNT(*) as count
      FROM customers
      WHERE email IS NOT NULL AND email != ''
      GROUP BY email
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    if (duplicateEmails.rows.length > 0) {
      console.log(`⚠️  Found ${duplicateEmails.rows.length} duplicate email addresses`);
      
      for (const row of duplicateEmails.rows) {
        // Get all duplicates, keep the one with the most recent data
        const duplicates = await pool.query(`
          SELECT id, email, updated_at, created_at
          FROM customers
          WHERE email = $1
          ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
        `, [row.email]);
        
        // Keep the first one, delete the rest
        const toKeep = duplicates.rows[0];
        const toDelete = duplicates.rows.slice(1);
        
        if (toDelete.length > 0) {
          const deleteIds = toDelete.map(d => d.id);
          await pool.query(`
            DELETE FROM customers
            WHERE id = ANY($1)
          `, [deleteIds]);
          
          console.log(`   ✅ Kept ID ${toKeep.id} for ${row.email}, deleted ${toDelete.length} duplicates`);
        }
      }
      
      console.log('\n✅ Duplicate email addresses removed\n');
    } else {
      console.log('✅ No duplicate email addresses found\n');
    }
    
    // Final count
    const finalCount = await pool.query('SELECT COUNT(*) as count FROM customers');
    console.log(`📊 Final customer count: ${parseInt(finalCount.rows[0].count).toLocaleString()}\n`);
    
    console.log('✅ Duplicate removal complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the cleanup
removeDuplicates()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

