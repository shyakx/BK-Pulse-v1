/**
 * Generate 170,000 diverse customers for BK Pulse
 * Run with: node server/scripts/generateCustomers.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

// Configuration
const TOTAL_CUSTOMERS = 123000; // Updated to match current dataset size
const BATCH_SIZE = 1000; // Insert in batches for performance

// Data pools for diversity
const FIRST_NAMES = [
  'Jean', 'Marie', 'Paul', 'Claire', 'Eric', 'Grace', 'David', 'Ange',
  'Peter', 'Vestine', 'Felix', 'Immaculee', 'John', 'Sarah', 'James',
  'Alice', 'Robert', 'Mary', 'Michael', 'Patricia', 'William', 'Jennifer',
  'Richard', 'Linda', 'Joseph', 'Elizabeth', 'Thomas', 'Barbara', 'Charles',
  'Susan', 'Christopher', 'Jessica', 'Daniel', 'Sarah', 'Matthew', 'Karen',
  'Anthony', 'Nancy', 'Mark', 'Betty', 'Donald', 'Margaret', 'Steven', 'Lisa',
  'Andrew', 'Dorothy', 'Joshua', 'Sandra', 'Kenneth', 'Ashley', 'Kevin', 'Kimberly',
  'Brian', 'Emily', 'George', 'Donna', 'Edward', 'Michelle', 'Ronald', 'Carol',
  'Timothy', 'Amanda', 'Jason', 'Melissa', 'Jeffrey', 'Deborah', 'Ryan', 'Stephanie',
  'Jacob', 'Rebecca', 'Gary', 'Sharon', 'Nicholas', 'Laura', 'Eric', 'Cynthia',
  'Jonathan', 'Kathleen', 'Stephen', 'Amy', 'Larry', 'Angela', 'Justin', 'Shirley',
  'Scott', 'Anna', 'Brandon', 'Brenda', 'Benjamin', 'Pamela', 'Samuel', 'Emma',
  'Frank', 'Nicole', 'Gregory', 'Helen', 'Raymond', 'Samantha', 'Alexander', 'Katherine',
  'Patrick', 'Christine', 'Jack', 'Debra', 'Dennis', 'Rachel', 'Jerry', 'Carolyn'
];

const LAST_NAMES = [
  'MUGISHA', 'UWIMANA', 'KAYITARE', 'MUKAMANA', 'HABIMANA', 'BAPTISTE', 'RUTAGANDA',
  'UWERA', 'MUNYANEZA', 'NYIRAHABIMANA', 'KAMANZI', 'MUKAMUSONI', 'NGIRIMANA',
  'NKURUNZIZA', 'NDAYISENGA', 'MURENZI', 'NSHIMIYIMANA', 'UWIMANA', 'NYAMURENZI',
  'MUKANKUSI', 'MUTSINZI', 'NTAWUKIRIYAYO', 'NYIRAMWIZA', 'HAGENIMANA', 'MUKARUGWIZA',
  'NTABOMVURA', 'NSENGIYUMVA', 'MUNYANDINDU', 'GATETE', 'MUKANKUSI', 'NDAYISHIMIYE',
  'MUKAMANA', 'UWERA', 'NSHIMIYIMANA', 'HAGENIMANA', 'NKURUNZIZA', 'MUKANKUSI',
  'UWIMANA', 'RUTAGANDA', 'MUGISHA', 'KAYITARE', 'HABIMANA', 'BAPTISTE', 'UWERA',
  'MUNYANEZA', 'NYIRAHABIMANA', 'KAMANZI', 'MUKAMUSONI', 'NGIRIMANA', 'NKURUNZIZA',
  'NDAYISENGA', 'MURENZI', 'NSHIMIYIMANA', 'Smith', 'Johnson', 'Williams', 'Brown',
  'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez',
  'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

const SEGMENTS = ['retail', 'sme', 'corporate', 'institutional_banking'];
const SEGMENT_WEIGHTS = [0.60, 0.25, 0.12, 0.03]; // 60% retail, 25% SME, 12% corporate, 3% institutional

const BRANCHES = [
  'Kigali Main', 'Nyarugenge', 'Kimisagara', 'Kacyiru', 'Remera', 'Gikondo',
  'Kicukiro', 'Gasabo', 'Nyabugogo', 'Kicukiro', 'Kanombe', 'Gisozi',
  'Kinyinya', 'Gatenga', 'Nyamirambo', 'Muhima', 'Kabuga', 'Kabarondo'
];

const PRODUCT_TYPES = [
  'Savings', 'Current', 'Investment', 'Business Account', 'Corporate Banking',
  'Treasury', 'Premium', 'Basic', 'Gold', 'Platinum'
];

const GENDERS = ['Male', 'Female', 'Other'];
const NATIONALITIES = ['Rwandan', 'Kenyan', 'Tanzanian', 'Ugandan', 'Burundian', 'Other'];

// Helper function to get random element with weights
function getWeightedRandom(items, weights) {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Generate random customer data
function generateCustomer(index, officerIds) {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const name = `${firstName} ${lastName}`;
  const segment = getWeightedRandom(SEGMENTS, SEGMENT_WEIGHTS);
  
  // Generate customer ID
  const customerId = `CUST${String(index + 1).padStart(7, '0')}`;
  
  // Generate email
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@email.com`;
  
  // Generate phone
  const phone = `+250788${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
  
  // Generate account balance based on segment
  let accountBalance;
  switch (segment) {
    case 'institutional_banking':
      accountBalance = Math.floor(Math.random() * 100000000) + 10000000; // 10M - 110M
      break;
    case 'corporate':
      accountBalance = Math.floor(Math.random() * 20000000) + 1000000; // 1M - 21M
      break;
    case 'sme':
      accountBalance = Math.floor(Math.random() * 5000000) + 100000; // 100K - 5.1M
      break;
    default: // retail
      accountBalance = Math.floor(Math.random() * 3000000) + 50000; // 50K - 3.05M
  }
  
  // Generate churn score with realistic distribution
  // Higher churn for lower balances, newer accounts
  let baseChurnScore = Math.random() * 100;
  
  // Adjust based on balance (lower balance = higher churn risk)
  if (accountBalance < 200000) baseChurnScore += 20;
  else if (accountBalance < 500000) baseChurnScore += 10;
  else if (accountBalance > 10000000) baseChurnScore -= 15;
  
  // Adjust based on segment (institutional lower risk)
  if (segment === 'institutional_banking') baseChurnScore -= 20;
  else if (segment === 'corporate') baseChurnScore -= 10;
  
  // Ensure score is between 0-100
  const churnScore = Math.max(0, Math.min(100, Math.round(baseChurnScore * 10) / 10));
  
  // Determine risk level
  let riskLevel;
  if (churnScore >= 70) riskLevel = 'high';
  else if (churnScore >= 40) riskLevel = 'medium';
  else riskLevel = 'low';
  
  // Random branch
  const branch = BRANCHES[Math.floor(Math.random() * BRANCHES.length)];
  
  // Product type based on segment
  let productType;
  if (segment === 'institutional_banking') {
    productType = PRODUCT_TYPES[Math.random() < 0.5 ? 5 : 9]; // Treasury or Corporate Banking
  } else if (segment === 'corporate') {
    productType = PRODUCT_TYPES[Math.random() < 0.7 ? 4 : 2]; // Corporate Banking or Investment
  } else if (segment === 'sme') {
    productType = PRODUCT_TYPES[Math.random() < 0.6 ? 3 : 7]; // Business Account or Premium
  } else {
    productType = PRODUCT_TYPES[Math.floor(Math.random() * 4)]; // Savings, Current, Investment, or Basic
  }
  
  // Random officer assignment (if officers exist)
  const assignedOfficerId = officerIds.length > 0 
    ? officerIds[Math.floor(Math.random() * officerIds.length)] 
    : null;
  
  // Generate random created_at date (within last 24 months)
  const monthsAgo = Math.floor(Math.random() * 24);
  const daysAgo = Math.floor(Math.random() * 30);
  const createdDate = new Date();
  createdDate.setMonth(createdDate.getMonth() - monthsAgo);
  createdDate.setDate(createdDate.getDate() - daysAgo);
  
  // Updated_at can be same or more recent
  const updatedDate = new Date(createdDate);
  const updateDaysAgo = Math.floor(Math.random() * 90); // Updated within last 90 days
  updatedDate.setDate(updatedDate.getDate() - updateDaysAgo);
  
  return {
    customer_id: customerId,
    name,
    email,
    phone,
    segment,
    branch,
    product_type: productType,
    account_balance: accountBalance,
    churn_score: churnScore,
    risk_level: riskLevel,
    assigned_officer_id: assignedOfficerId,
    created_at: createdDate.toISOString(),
    updated_at: updatedDate.toISOString()
  };
}

// Insert customers in batches
async function insertBatch(customers) {
  if (customers.length === 0) return;
  
  // Insert with created_at and updated_at
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

async function generateCustomers() {
  console.log('🚀 Starting customer generation...\n');
  
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Get existing officer IDs
    const officersResult = await pool.query(
      "SELECT id FROM users WHERE role = 'retentionOfficer'"
    );
    const officerIds = officersResult.rows.map(row => row.id);
    console.log(`📋 Found ${officerIds.length} retention officers\n`);
    
    // Check existing customer count
    const existingCountResult = await pool.query('SELECT COUNT(*) as count FROM customers');
    const existingCount = parseInt(existingCountResult.rows[0].count || 0);
    console.log(`📊 Existing customers: ${existingCount.toLocaleString()}\n`);
    
    const customersToGenerate = TOTAL_CUSTOMERS - existingCount;
    
    if (customersToGenerate <= 0) {
      console.log(`✅ Already have ${existingCount.toLocaleString()} customers. Target reached!`);
      return;
    }
    
    console.log(`🎯 Generating ${customersToGenerate.toLocaleString()} new customers...\n`);
    console.log(`📦 Batch size: ${BATCH_SIZE}\n`);
    
    let totalGenerated = 0;
    const startTime = Date.now();
    
    // Start from existing count + 1
    for (let i = existingCount; i < TOTAL_CUSTOMERS; i += BATCH_SIZE) {
      const batch = [];
      const batchSize = Math.min(BATCH_SIZE, TOTAL_CUSTOMERS - i);
      
      for (let j = 0; j < batchSize; j++) {
        batch.push(generateCustomer(i + j, officerIds));
      }
      
      await insertBatch(batch);
      totalGenerated += batch.length;
      
      // Progress update
      const progress = ((totalGenerated / customersToGenerate) * 100).toFixed(1);
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = totalGenerated / elapsed;
      const remaining = (customersToGenerate - totalGenerated) / rate;
      
      console.log(
        `\r⏳ Progress: ${totalGenerated.toLocaleString()}/${customersToGenerate.toLocaleString()} ` +
        `(${progress}%) | Rate: ${Math.round(rate)}/sec | ETA: ${Math.round(remaining)}s`
      );
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n\n✅ Successfully generated ${totalGenerated.toLocaleString()} customers!`);
    console.log(`⏱️  Total time: ${totalTime} seconds`);
    console.log(`⚡ Average rate: ${Math.round(totalGenerated / totalTime)} customers/second\n`);
    
    // Get final statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk,
        COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk,
        segment,
        COUNT(*) as segment_count
      FROM customers
      GROUP BY segment
    `);
    
    console.log('📈 Customer Distribution by Segment:');
    statsResult.rows.forEach(row => {
      console.log(`   ${row.segment}: ${parseInt(row.segment_count).toLocaleString()}`);
    });
    
    const riskStats = await pool.query(`
      SELECT 
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk,
        COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk
      FROM customers
    `);
    
    console.log('\n📊 Risk Level Distribution:');
    console.log(`   High Risk: ${parseInt(riskStats.rows[0].high_risk).toLocaleString()}`);
    console.log(`   Medium Risk: ${parseInt(riskStats.rows[0].medium_risk).toLocaleString()}`);
    console.log(`   Low Risk: ${parseInt(riskStats.rows[0].low_risk).toLocaleString()}`);
    
  } catch (error) {
    console.error('\n❌ Error generating customers:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Database connection refused. Please:');
      console.error('   1. Ensure PostgreSQL is running');
      console.error('   2. Check server/.env file for correct database credentials');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
generateCustomers()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

