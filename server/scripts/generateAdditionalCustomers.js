/**
 * Generate Additional Customers to Reach 500,000
 * 
 * Generates new customers while maintaining:
 * - 70% Current accounts
 * - 23% Savings accounts
 * - 7% Fixed Deposit accounts
 * - 25.06% churn (Dormant status)
 * - All Savings and Fixed Deposit must be Active
 * - Only Current accounts can have all statuses
 * 
 * Usage:
 *   node server/scripts/generateAdditionalCustomers.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

const TARGET_TOTAL = 500000;
const BATCH_SIZE = 1000;

// Name pools
const RWANDAN_FIRST_NAMES = ['Jean', 'Marie', 'Paul', 'Claire', 'Eric', 'Grace', 'David', 'Ange', 'Peter', 'Vestine', 'Felix', 'Immaculee', 'Emmanuel', 'Aline', 'Theophile', 'Josiane', 'Pacifique', 'Chantal', 'Innocent', 'Mukamana', 'Yves', 'Francoise', 'Alexis', 'Beatrice', 'Patrick', 'Julienne', 'Andre', 'Therese', 'Joseph', 'Agnes', 'Charles', 'Jeanne', 'Pierre', 'Clementine', 'Antoine', 'Rose'];
const RWANDAN_LAST_NAMES = ['MUGISHA', 'UWIMANA', 'KAYITARE', 'MUKAMANA', 'HABIMANA', 'BAPTISTE', 'RUTAGANDA', 'UWERA', 'MUNYANEZA', 'NYIRAHABIMANA', 'KAMANZI', 'MUKAMUSONI', 'NGIRIMANA', 'NKURUNZIZA', 'NDAYISENGA', 'MURENZI', 'NSHIMIYIMANA', 'NYAMURENZI', 'MUKANKUSI', 'MUTSINZI', 'NTAWUKIRIYAYO', 'NYIRAMWIZA', 'HAGENIMANA', 'MUKARUGWIZA', 'NTABOMVURA', 'NSENGIYUMVA', 'MUNYANDINDU', 'GATETE', 'NDAYISHIMIYE', 'MUKAMANA', 'UWERA', 'NSHIMIYIMANA', 'HAGENIMANA', 'NKURUNZIZA', 'MUKANKUSI', 'UWIMANA', 'RUTAGANDA', 'MUGISHA', 'KAYITARE', 'HABIMANA'];

const SEGMENTS = ['retail', 'sme', 'corporate', 'institutional_banking'];
const BRANCHES = ['Kigali Main', 'Nyarugenge', 'Kimisagara', 'Kacyiru', 'Remera', 'Nyabugogo', 'Gikondo', 'Kicukiro', 'Kanombe', 'Kimisagara'];
const GENDERS = ['Male', 'Female'];
const NATIONALITIES = ['Rwandan', 'Kenyan', 'Tanzanian', 'Ugandan'];
const CURRENCIES = ['RWF', 'USD', 'EUR'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function generateName(gender, index) {
  const firstNameIndex = index % RWANDAN_FIRST_NAMES.length;
  const lastNameIndex = (index * 7) % RWANDAN_LAST_NAMES.length;
  const firstName = RWANDAN_FIRST_NAMES[firstNameIndex];
  const lastName = RWANDAN_LAST_NAMES[lastNameIndex];
  return `${firstName} ${lastName}`;
}

function getRandomDaysInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCustomer(customerId, productType, accountStatus, daysSinceLastTransaction, index) {
  const gender = getRandomElement(GENDERS);
  const name = generateName(gender, index);
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}${customerId}@email.com`;
  const phone = `+250788${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
  
  // Calculate account_open_date based on account_age_months
  const accountAgeMonths = getRandomInt(6, 120);
  const accountOpenDate = new Date();
  accountOpenDate.setMonth(accountOpenDate.getMonth() - accountAgeMonths);
  
  // Calculate last_transaction_date based on days_since_last_transaction
  const lastTransactionDate = new Date();
  lastTransactionDate.setDate(lastTransactionDate.getDate() - daysSinceLastTransaction);
  
  const accountBalance = getRandomFloat(10000, 10000000);
  const averageTransactionValue = accountBalance * getRandomFloat(0.01, 0.10);
  
  // Set actual_churn_flag: true only for Current accounts with Dormant status
  const actualChurnFlag = productType === 'Current' && accountStatus === 'Dormant';
  
  return {
    customer_id: String(customerId),
    name: name,
    email: email,
    phone: phone,
    segment: getRandomElement(SEGMENTS),
    branch: getRandomElement(BRANCHES),
    product_type: productType,
    account_balance: Math.round(accountBalance * 100) / 100,
    churn_score: null, // Will be calculated by ML model later
    risk_level: null, // Will be calculated by ML model later
    assigned_officer_id: null, // Will be assigned later
    gender: gender,
    nationality: getRandomElement(NATIONALITIES),
    currency: getRandomElement(CURRENCIES),
    account_status: accountStatus,
    age: getRandomInt(18, 80),
    tenure_months: accountAgeMonths,
    num_products: getRandomInt(1, 5),
    has_credit_card: Math.random() > 0.7,
    transaction_frequency: getRandomInt(0, 50),
    average_transaction_value: Math.round(averageTransactionValue * 100) / 100,
    mobile_banking_usage: getRandomInt(0, 100),
    branch_visits: getRandomInt(0, 20),
    complaint_history: getRandomInt(0, 5),
    account_age_months: accountAgeMonths,
    days_since_last_transaction: daysSinceLastTransaction,
    activity_score: getRandomFloat(0, 100),
    account_open_date: accountOpenDate.toISOString().split('T')[0],
    last_transaction_date: lastTransactionDate.toISOString().split('T')[0],
    actual_churn_flag: actualChurnFlag,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function insertBatch(customers, officerIds) {
  if (customers.length === 0) return;
  
  // Assign random officers
  customers.forEach(customer => {
    if (officerIds.length > 0) {
      customer.assigned_officer_id = officerIds[Math.floor(Math.random() * officerIds.length)];
    }
  });
  
  const values = customers.map((c, index) => {
    const base = index * 32; // 32 columns including actual_churn_flag
    const params = [];
    for (let i = 0; i < 32; i++) {
      params.push(`$${base + i + 1}`);
    }
    return `(${params.join(', ')})`;
  }).join(', ');
  
  const params = customers.flatMap(c => [
    c.customer_id, c.name, c.email, c.phone, c.segment, c.branch,
    c.product_type, c.account_balance, c.churn_score, c.risk_level,
    c.assigned_officer_id, c.gender, c.nationality, c.currency,
    c.account_status, c.age, c.tenure_months, c.num_products,
    c.has_credit_card, c.transaction_frequency, c.average_transaction_value,
    c.mobile_banking_usage, c.branch_visits, c.complaint_history,
    c.account_age_months, c.days_since_last_transaction, c.activity_score,
    c.account_open_date, c.last_transaction_date, c.actual_churn_flag,
    c.created_at, c.updated_at
  ]);
  
  const query = `
    INSERT INTO customers (
      customer_id, name, email, phone, segment, branch,
      product_type, account_balance, churn_score, risk_level,
      assigned_officer_id, gender, nationality, currency,
      account_status, age, tenure_months, num_products,
      has_credit_card, transaction_frequency, average_transaction_value,
      mobile_banking_usage, branch_visits, complaint_history,
      account_age_months, days_since_last_transaction, activity_score,
      account_open_date, last_transaction_date, actual_churn_flag,
      created_at, updated_at
    ) VALUES ${values}
  `;
  
  await pool.query(query, params);
}

async function generateAdditionalCustomers() {
  console.log('🚀 Starting generation of additional customers...\n');
  
  try {
    // Check database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Get current customer count
    const currentCountResult = await pool.query('SELECT COUNT(*) as count FROM customers');
    const existingCount = parseInt(currentCountResult.rows[0].count);
    const customersToAdd = TARGET_TOTAL - existingCount;
    
    console.log(`📊 Current customers: ${existingCount}`);
    console.log(`📊 Target total: ${TARGET_TOTAL}`);
    console.log(`📊 Customers to add: ${customersToAdd}\n`);
    
    if (customersToAdd <= 0) {
      console.log('✅ Already at or above target. No customers to add.');
      return;
    }
    
    // Get officer IDs
    const officersResult = await pool.query("SELECT id FROM users WHERE role = 'retentionOfficer'");
    const officerIds = officersResult.rows.map(row => row.id);
    console.log(`👥 Found ${officerIds.length} retention officers\n`);
    
    // Calculate distribution
    const currentCount = Math.floor(customersToAdd * 0.70);
    const savingsCount = Math.floor(customersToAdd * 0.23);
    const fixedDepositCount = customersToAdd - currentCount - savingsCount;
    
    const dormantCount = Math.floor(customersToAdd * 0.2506); // 25.06% churn
    const remainingCurrent = currentCount - dormantCount;
    const activeCurrent = Math.floor(remainingCurrent * 0.30);
    const inactiveCurrent = Math.floor(remainingCurrent * 0.50);
    const unclaimedCurrent = remainingCurrent - activeCurrent - inactiveCurrent;
    
    console.log('📊 Target Distribution for New Customers:\n');
    console.log('Product Types:');
    console.log(`   - Current: ${currentCount} (${((currentCount / customersToAdd) * 100).toFixed(1)}%)`);
    console.log(`   - Savings: ${savingsCount} (${((savingsCount / customersToAdd) * 100).toFixed(1)}%)`);
    console.log(`   - Fixed Deposit: ${fixedDepositCount} (${((fixedDepositCount / customersToAdd) * 100).toFixed(1)}%)\n`);
    console.log('Current Account Statuses:');
    console.log(`   - Active: ${activeCurrent}`);
    console.log(`   - Inactive: ${inactiveCurrent}`);
    console.log(`   - Dormant: ${dormantCount} (churned)`);
    console.log(`   - Unclaimed: ${unclaimedCurrent}\n`);
    
    // Get next customer ID
    const maxIdResult = await pool.query('SELECT MAX(CAST(customer_id AS INTEGER)) as max_id FROM customers WHERE customer_id ~ \'^[0-9]+$\'');
    let nextCustomerId = 150000; // Start from 150000 to avoid conflicts
    if (maxIdResult.rows[0] && maxIdResult.rows[0].max_id) {
      nextCustomerId = parseInt(maxIdResult.rows[0].max_id) + 1;
    }
    
    console.log(`🆔 Starting customer ID: ${nextCustomerId}\n`);
    console.log('🔄 Generating customers...\n');
    
    let totalAdded = 0;
    let customerId = nextCustomerId;
    const startTime = Date.now();
    
    // Generate Savings accounts (all Active)
    console.log(`📝 Generating ${savingsCount} Savings accounts (all Active)...`);
    for (let i = 0; i < savingsCount; i += BATCH_SIZE) {
      const batch = [];
      const batchSize = Math.min(BATCH_SIZE, savingsCount - i);
      
      for (let j = 0; j < batchSize; j++) {
        const days = getRandomDaysInRange(0, 180);
        batch.push(generateCustomer(customerId++, 'Savings', 'Active', days, i + j));
      }
      
      await insertBatch(batch, officerIds);
      totalAdded += batch.length;
      const progress = ((totalAdded / customersToAdd) * 100).toFixed(1);
      console.log(`⏳ Progress: ${totalAdded}/${customersToAdd} (${progress}%)`);
    }
    
    // Generate Fixed Deposit accounts (all Active)
    console.log(`\n📝 Generating ${fixedDepositCount} Fixed Deposit accounts (all Active)...`);
    for (let i = 0; i < fixedDepositCount; i += BATCH_SIZE) {
      const batch = [];
      const batchSize = Math.min(BATCH_SIZE, fixedDepositCount - i);
      
      for (let j = 0; j < batchSize; j++) {
        const days = getRandomDaysInRange(0, 180);
        batch.push(generateCustomer(customerId++, 'Fixed Deposit', 'Active', days, savingsCount + i + j));
      }
      
      await insertBatch(batch, officerIds);
      totalAdded += batch.length;
      const progress = ((totalAdded / customersToAdd) * 100).toFixed(1);
      console.log(`⏳ Progress: ${totalAdded}/${customersToAdd} (${progress}%)`);
    }
    
    // Generate Current accounts - Active
    console.log(`\n📝 Generating ${activeCurrent} Current accounts (Active)...`);
    for (let i = 0; i < activeCurrent; i += BATCH_SIZE) {
      const batch = [];
      const batchSize = Math.min(BATCH_SIZE, activeCurrent - i);
      
      for (let j = 0; j < batchSize; j++) {
        const days = getRandomDaysInRange(0, 180);
        batch.push(generateCustomer(customerId++, 'Current', 'Active', days, savingsCount + fixedDepositCount + i + j));
      }
      
      await insertBatch(batch, officerIds);
      totalAdded += batch.length;
      const progress = ((totalAdded / customersToAdd) * 100).toFixed(1);
      console.log(`⏳ Progress: ${totalAdded}/${customersToAdd} (${progress}%)`);
    }
    
    // Generate Current accounts - Inactive
    console.log(`\n📝 Generating ${inactiveCurrent} Current accounts (Inactive)...`);
    for (let i = 0; i < inactiveCurrent; i += BATCH_SIZE) {
      const batch = [];
      const batchSize = Math.min(BATCH_SIZE, inactiveCurrent - i);
      
      for (let j = 0; j < batchSize; j++) {
        const days = getRandomDaysInRange(181, 365);
        batch.push(generateCustomer(customerId++, 'Current', 'Inactive', days, savingsCount + fixedDepositCount + activeCurrent + i + j));
      }
      
      await insertBatch(batch, officerIds);
      totalAdded += batch.length;
      const progress = ((totalAdded / customersToAdd) * 100).toFixed(1);
      console.log(`⏳ Progress: ${totalAdded}/${customersToAdd} (${progress}%)`);
    }
    
    // Generate Current accounts - Dormant (churned)
    console.log(`\n📝 Generating ${dormantCount} Current accounts (Dormant - churned)...`);
    for (let i = 0; i < dormantCount; i += BATCH_SIZE) {
      const batch = [];
      const batchSize = Math.min(BATCH_SIZE, dormantCount - i);
      
      for (let j = 0; j < batchSize; j++) {
        const days = getRandomDaysInRange(366, 1460);
        batch.push(generateCustomer(customerId++, 'Current', 'Dormant', days, savingsCount + fixedDepositCount + activeCurrent + inactiveCurrent + i + j));
      }
      
      await insertBatch(batch, officerIds);
      totalAdded += batch.length;
      const progress = ((totalAdded / customersToAdd) * 100).toFixed(1);
      console.log(`⏳ Progress: ${totalAdded}/${customersToAdd} (${progress}%)`);
    }
    
    // Generate Current accounts - Unclaimed
    console.log(`\n📝 Generating ${unclaimedCurrent} Current accounts (Unclaimed)...`);
    for (let i = 0; i < unclaimedCurrent; i += BATCH_SIZE) {
      const batch = [];
      const batchSize = Math.min(BATCH_SIZE, unclaimedCurrent - i);
      
      for (let j = 0; j < batchSize; j++) {
        const days = getRandomDaysInRange(1461, 2000);
        batch.push(generateCustomer(customerId++, 'Current', 'Unclaimed', days, savingsCount + fixedDepositCount + activeCurrent + inactiveCurrent + dormantCount + i + j));
      }
      
      await insertBatch(batch, officerIds);
      totalAdded += batch.length;
      const progress = ((totalAdded / customersToAdd) * 100).toFixed(1);
      console.log(`⏳ Progress: ${totalAdded}/${customersToAdd} (${progress}%)`);
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Successfully generated ${totalAdded} customers in ${totalTime} seconds!\n`);
    
    // Verification
    const finalCountResult = await pool.query('SELECT COUNT(*) as count FROM customers');
    const finalCount = parseInt(finalCountResult.rows[0].count);
    
    const productTypeDist = await pool.query(`
      SELECT product_type, COUNT(*) as count
      FROM customers
      GROUP BY product_type
      ORDER BY product_type
    `);
    
    const statusDist = await pool.query(`
      SELECT account_status, COUNT(*) as count
      FROM customers
      WHERE account_status IS NOT NULL
      GROUP BY account_status
      ORDER BY account_status
    `);
    
    const dormantResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM customers
      WHERE account_status = 'Dormant'
    `);
    const actualDormant = parseInt(dormantResult.rows[0].count);
    const churnPercent = ((actualDormant / finalCount) * 100).toFixed(2);
    
    console.log('📊 Final Verification:\n');
    console.log(`Total customers: ${finalCount}`);
    console.log(`\nProduct Type Distribution:`);
    productTypeDist.rows.forEach(row => {
      const percent = ((row.count / finalCount) * 100).toFixed(2);
      console.log(`   - ${row.product_type}: ${row.count} (${percent}%)`);
    });
    console.log(`\nStatus Distribution:`);
    statusDist.rows.forEach(row => {
      const percent = ((row.count / finalCount) * 100).toFixed(2);
      console.log(`   - ${row.account_status}: ${row.count} (${percent}%)`);
    });
    console.log(`\nChurn Percentage: ${actualDormant} / ${finalCount} * 100% = ${churnPercent}%`);
    console.log(`Target: 25.06%`);
    console.log(`Difference: ${(parseFloat(churnPercent) - 25.06).toFixed(2)}%\n`);
    
  } catch (error) {
    console.error('\n❌ Error during generation:', error);
    console.error('   Error details:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  generateAdditionalCustomers()
    .then(() => {
      console.log('✅ Generation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    });
}

module.exports = generateAdditionalCustomers;

