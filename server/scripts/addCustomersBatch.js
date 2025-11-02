/**
 * Add customers in smaller batches via Render database
 * Usage: node server/scripts/addCustomersBatch.js [count]
 * Example: node server/scripts/addCustomersBatch.js 5000
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

// Get count from command line or default to 1000
const TOTAL_CUSTOMERS = parseInt(process.argv[2]) || 1000;
const BATCH_SIZE = 500; // Smaller batches for reliability

// Same data pools as generateCustomers.js
const FIRST_NAMES = ['Jean', 'Marie', 'Paul', 'Claire', 'Eric', 'Grace', 'David', 'Ange', 'Peter', 'Vestine', 'Felix', 'Immaculee', 'John', 'Sarah', 'James', 'Alice', 'Robert', 'Mary', 'Michael', 'Patricia', 'William', 'Jennifer', 'Richard', 'Linda', 'Joseph', 'Elizabeth', 'Thomas', 'Barbara'];
const LAST_NAMES = ['MUGISHA', 'UWIMANA', 'KAYITARE', 'MUKAMANA', 'HABIMANA', 'BAPTISTE', 'RUTAGANDA', 'UWERA', 'MUNYANEZA', 'NYIRAHABIMANA', 'KAMANZI', 'MUKAMUSONI', 'NGIRIMANA', 'NKURUNZIZA', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
const SEGMENTS = ['retail', 'sme', 'corporate', 'institutional_banking'];
const BRANCHES = ['Kigali Main', 'Nyarugenge', 'Kimisagara', 'Kacyiru', 'Remera', 'Gikondo', 'Nyamirambo', 'Muhima'];
const PRODUCT_TYPES = ['Savings', 'Current', 'Investment', 'Fixed Deposit', 'Treasury', 'Corporate Banking'];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateCustomerId(index) {
  const prefix = 'CUST';
  const padded = String(index + 1).padStart(6, '0');
  return `${prefix}${padded}`;
}

function generateCustomer(index, officerIds) {
  const firstName = randomElement(FIRST_NAMES);
  const lastName = randomElement(LAST_NAMES);
  const segment = randomElement(SEGMENTS);
  
  // Generate churn score and risk level
  let churnScore, riskLevel;
  const rand = Math.random();
  if (rand < 0.25) {
    churnScore = Math.random() * 30 + 5; // 5-35 (low)
    riskLevel = 'low';
  } else if (rand < 0.65) {
    churnScore = Math.random() * 30 + 35; // 35-65 (medium)
    riskLevel = 'medium';
  } else {
    churnScore = Math.random() * 30 + 65; // 65-95 (high)
    riskLevel = 'high';
  }
  
  const balance = segment === 'institutional_banking' 
    ? Math.random() * 50000000 + 10000000  // 10M - 60M
    : segment === 'corporate'
    ? Math.random() * 10000000 + 1000000   // 1M - 11M
    : Math.random() * 2000000 + 50000;     // 50K - 2.05M
  
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`;
  const phone = `+250788${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
  
  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 365));
  const updatedDate = new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
  
  return {
    customer_id: generateCustomerId(index),
    name: `${firstName} ${lastName}`,
    email: email,
    phone: phone,
    segment: segment,
    branch: randomElement(BRANCHES),
    product_type: randomElement(PRODUCT_TYPES),
    account_balance: parseFloat(balance.toFixed(2)),
    churn_score: parseFloat(churnScore.toFixed(2)),
    risk_level: riskLevel,
    assigned_officer_id: officerIds.length > 0 ? randomElement(officerIds) : null,
    created_at: createdDate.toISOString(),
    updated_at: updatedDate.toISOString()
  };
}

async function insertBatch(customers) {
  if (customers.length === 0) return;
  
  const values = customers.map((c, index) => {
    const base = index * 13;
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13})`;
  }).join(', ');
  
  const params = customers.flatMap(c => [
    c.customer_id, c.name, c.email, c.phone, c.segment, c.branch,
    c.product_type, c.account_balance, c.churn_score, c.risk_level,
    c.assigned_officer_id, c.created_at, c.updated_at
  ]);
  
  const query = `
    INSERT INTO customers (
      customer_id, name, email, phone, segment, branch,
      product_type, account_balance, churn_score, risk_level,
      assigned_officer_id, created_at, updated_at
    ) VALUES ${values}
    ON CONFLICT (customer_id) DO NOTHING
  `;
  
  await pool.query(query, params);
}

async function addCustomers() {
  console.log(`🚀 Adding ${TOTAL_CUSTOMERS} customers...\n`);
  
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    const officersResult = await pool.query("SELECT id FROM users WHERE role = 'retentionOfficer'");
    const officerIds = officersResult.rows.map(row => row.id);
    console.log(`📋 Found ${officerIds.length} retention officers\n`);
    
    const existingResult = await pool.query('SELECT COUNT(*) as count FROM customers');
    const existingCount = parseInt(existingResult.rows[0].count || 0);
    console.log(`📊 Existing customers: ${existingCount.toLocaleString()}\n`);
    
    let totalAdded = 0;
    const startTime = Date.now();
    const startIndex = existingCount;
    
    for (let i = 0; i < TOTAL_CUSTOMERS; i += BATCH_SIZE) {
      const batch = [];
      const batchSize = Math.min(BATCH_SIZE, TOTAL_CUSTOMERS - i);
      
      for (let j = 0; j < batchSize; j++) {
        batch.push(generateCustomer(startIndex + i + j, officerIds));
      }
      
      await insertBatch(batch);
      totalAdded += batch.length;
      
      const progress = ((totalAdded / TOTAL_CUSTOMERS) * 100).toFixed(1);
      console.log(`⏳ Progress: ${totalAdded}/${TOTAL_CUSTOMERS} (${progress}%)`);
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Successfully added ${totalAdded.toLocaleString()} customers!`);
    console.log(`⏱️  Time: ${totalTime} seconds\n`);
    
    const finalResult = await pool.query('SELECT COUNT(*) as count FROM customers');
    console.log(`📊 Total customers now: ${parseInt(finalResult.rows[0].count).toLocaleString()}\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addCustomers();

