const pool = require('../config/database');

async function checkDuplicates() {
  console.log('🔍 Checking for duplicates in customers table...\n');
  
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Check for duplicate customer_id
    console.log('1️⃣ Checking for duplicate customer_id values...');
    const duplicateIds = await pool.query(`
      SELECT customer_id, COUNT(*) as count
      FROM customers
      GROUP BY customer_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    if (duplicateIds.rows.length > 0) {
      console.log(`❌ Found ${duplicateIds.rows.length} duplicate customer_id values:`);
      duplicateIds.rows.slice(0, 10).forEach(row => {
        console.log(`   ${row.customer_id}: ${row.count} occurrences`);
      });
      if (duplicateIds.rows.length > 10) {
        console.log(`   ... and ${duplicateIds.rows.length - 10} more`);
      }
    } else {
      console.log('✅ No duplicate customer_id values found');
    }
    console.log();
    
    // Check for duplicate emails
    console.log('2️⃣ Checking for duplicate email addresses...');
    const duplicateEmails = await pool.query(`
      SELECT email, COUNT(*) as count
      FROM customers
      WHERE email IS NOT NULL AND email != ''
      GROUP BY email
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    if (duplicateEmails.rows.length > 0) {
      console.log(`⚠️  Found ${duplicateEmails.rows.length} duplicate email addresses:`);
      duplicateEmails.rows.slice(0, 10).forEach(row => {
        console.log(`   ${row.email}: ${row.count} occurrences`);
      });
      if (duplicateEmails.rows.length > 10) {
        console.log(`   ... and ${duplicateEmails.rows.length - 10} more`);
      }
    } else {
      console.log('✅ No duplicate email addresses found');
    }
    console.log();
    
    // Check total count
    console.log('3️⃣ Total customer count...');
    const totalCount = await pool.query('SELECT COUNT(*) as count FROM customers');
    console.log(`   Total customers: ${parseInt(totalCount.rows[0].count).toLocaleString()}`);
    console.log();
    
    // Check unique customer_id count
    const uniqueCount = await pool.query('SELECT COUNT(DISTINCT customer_id) as count FROM customers');
    console.log(`   Unique customer_id values: ${parseInt(uniqueCount.rows[0].count).toLocaleString()}`);
    console.log();
    
    // Check customer assignment distribution
    console.log('4️⃣ Customer assignment distribution...');
    const assignmentStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN assigned_officer_id IS NULL THEN 1 END) as unassigned,
        COUNT(CASE WHEN assigned_officer_id IS NOT NULL THEN 1 END) as assigned
      FROM customers
    `);
    
    const stats = assignmentStats.rows[0];
    console.log(`   Total customers: ${parseInt(stats.total).toLocaleString()}`);
    console.log(`   Assigned to officers: ${parseInt(stats.assigned).toLocaleString()}`);
    console.log(`   Unassigned: ${parseInt(stats.unassigned).toLocaleString()}`);
    console.log();
    
    // Check distribution by officer
    console.log('5️⃣ Distribution by officer...');
    const officerDistribution = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(c.id) as customer_count
      FROM users u
      LEFT JOIN customers c ON c.assigned_officer_id = u.id
      WHERE u.role = 'retentionOfficer'
      GROUP BY u.id, u.name, u.email
      ORDER BY customer_count DESC
    `);
    
    officerDistribution.rows.forEach(row => {
      console.log(`   ${row.name} (ID: ${row.id}): ${parseInt(row.customer_count).toLocaleString()} customers`);
    });
    console.log();
    
    // Check for customers with same name (might indicate duplicates)
    console.log('6️⃣ Checking for duplicate names (potential duplicates)...');
    const duplicateNames = await pool.query(`
      SELECT name, COUNT(*) as count
      FROM customers
      GROUP BY name
      HAVING COUNT(*) > 5
      ORDER BY count DESC
      LIMIT 20
    `);
    
    if (duplicateNames.rows.length > 0) {
      console.log(`⚠️  Found names that appear more than 5 times (might be duplicates):`);
      duplicateNames.rows.forEach(row => {
        console.log(`   "${row.name}": ${row.count} occurrences`);
      });
    } else {
      console.log('✅ No suspicious name duplicates found');
    }
    console.log();
    
    // Summary
    console.log('📊 Summary:');
    const hasDuplicateIds = duplicateIds.rows.length > 0;
    const hasDuplicateEmails = duplicateEmails.rows.length > 0;
    const total = parseInt(totalCount.rows[0].count);
    const unique = parseInt(uniqueCount.rows[0].count);
    const unassigned = parseInt(stats.unassigned);
    
    if (hasDuplicateIds) {
      console.log('❌ ACTION NEEDED: Duplicate customer_id values found!');
      console.log('   Run cleanup script to remove duplicates.');
    }
    
    if (total !== unique) {
      console.log(`⚠️  WARNING: Total count (${total.toLocaleString()}) doesn't match unique count (${unique.toLocaleString()})`);
      console.log(`   Difference: ${(total - unique).toLocaleString()} duplicate rows`);
    }
    
    if (unassigned > 0) {
      console.log(`ℹ️  INFO: ${unassigned.toLocaleString()} customers are not assigned to any officer`);
      console.log(`   This is why the dashboard shows fewer customers (only assigned ones are shown)`);
    }
    
    if (!hasDuplicateIds && !hasDuplicateEmails && total === unique) {
      console.log('✅ Database is clean - no duplicates found!');
      console.log(`   The dashboard shows ${parseInt(stats.assigned).toLocaleString()} customers because it only displays customers assigned to the logged-in user.`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the check
checkDuplicates()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });

