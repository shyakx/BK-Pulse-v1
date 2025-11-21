/**
 * Seed Customers from Dataset
 * Imports 50,000 customers from the raw CSV dataset
 * Ensures all columns match model requirements
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

// Simple CSV parser (no external dependency)
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // Parse header with proper quote handling
  const headerLine = lines[0];
  const headers = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < headerLine.length; j++) {
    const char = headerLine[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  headers.push(current.trim().replace(/^"|"$/g, ''));
  
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    current = '';
    inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    if (values.length === headers.length) {
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = values[idx];
      });
      records.push(record);
    }
  }
  
  return records;
}

// Use the fixed dataset file (with corrected account_status)
const DATASET_PATH = path.join(__dirname, '../../data/raw/bk_pulse_customer_dataset.csv');
const OUTPUT_CSV_PATH = path.join(__dirname, '../../data/exported_seeded_customers.csv');
const BATCH_SIZE = 500;
const TOTAL_TO_IMPORT = 50000;

// Name pools by nationality
const RWANDAN_FIRST_NAMES = ['Jean', 'Marie', 'Paul', 'Claire', 'Eric', 'Grace', 'David', 'Ange', 'Peter', 'Vestine', 'Felix', 'Immaculee', 'Emmanuel', 'Aline', 'Theophile', 'Josiane', 'Pacifique', 'Chantal', 'Innocent', 'Mukamana', 'Yves', 'Francoise', 'Alexis', 'Beatrice', 'Patrick', 'Julienne', 'Andre', 'Therese', 'Joseph', 'Agnes', 'Charles', 'Jeanne', 'Pierre', 'Clementine', 'Antoine', 'Rose'];
const RWANDAN_LAST_NAMES = ['MUGISHA', 'UWIMANA', 'KAYITARE', 'MUKAMANA', 'HABIMANA', 'BAPTISTE', 'RUTAGANDA', 'UWERA', 'MUNYANEZA', 'NYIRAHABIMANA', 'KAMANZI', 'MUKAMUSONI', 'NGIRIMANA', 'NKURUNZIZA', 'NDAYISENGA', 'MURENZI', 'NSHIMIYIMANA', 'NYAMURENZI', 'MUKANKUSI', 'MUTSINZI', 'NTAWUKIRIYAYO', 'NYIRAMWIZA', 'HAGENIMANA', 'MUKARUGWIZA', 'NTABOMVURA', 'NSENGIYUMVA', 'MUNYANDINDU', 'GATETE', 'NDAYISHIMIYE', 'MUKAMANA', 'UWERA', 'NSHIMIYIMANA', 'HAGENIMANA', 'NKURUNZIZA', 'MUKANKUSI', 'UWIMANA', 'RUTAGANDA', 'MUGISHA', 'KAYITARE', 'HABIMANA'];

const KENYAN_FIRST_NAMES = ['John', 'Mary', 'James', 'Elizabeth', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
const KENYAN_LAST_NAMES = ['Kipchoge', 'Wanjiru', 'Ochieng', 'Njeri', 'Kamau', 'Wambui', 'Onyango', 'Achieng', 'Mwangi', 'Nyambura', 'Kariuki', 'Wanjiku', 'Omondi', 'Akinyi', 'Kibet', 'Wairimu', 'Otieno', 'Adhiambo', 'Kimani', 'Wanjala'];

const TANZANIAN_FIRST_NAMES = ['Juma', 'Fatuma', 'Hassan', 'Amina', 'Ali', 'Zainab', 'Mohamed', 'Halima', 'Ibrahim', 'Mariam', 'Omar', 'Aisha', 'Yusuf', 'Khadija', 'Salim', 'Rehema', 'Rashid', 'Asha', 'Hamisi', 'Zuhura'];
const TANZANIAN_LAST_NAMES = ['Mwalimu', 'Juma', 'Hassan', 'Mohamed', 'Ali', 'Ibrahim', 'Omar', 'Yusuf', 'Salim', 'Rashid', 'Hamisi', 'Mwanza', 'Kisanga', 'Mkumbo', 'Mwakasege', 'Mwakasege', 'Mwakasege', 'Mwakasege', 'Mwakasege', 'Mwakasege'];

const UGANDAN_FIRST_NAMES = ['Moses', 'Sarah', 'David', 'Ruth', 'Peter', 'Grace', 'John', 'Mary', 'James', 'Esther', 'Paul', 'Joyce', 'Joseph', 'Florence', 'Daniel', 'Patricia', 'Samuel', 'Dorothy', 'Andrew', 'Margaret'];
const UGANDAN_LAST_NAMES = ['Kigozi', 'Nakato', 'Mukasa', 'Nabukeera', 'Ssemwogerere', 'Nakazibwe', 'Kasozi', 'Nabukeera', 'Mugerwa', 'Nakazibwe', 'Kigozi', 'Nakato', 'Mukasa', 'Nabukeera', 'Ssemwogerere', 'Nakazibwe', 'Kasozi', 'Nabukeera', 'Mugerwa', 'Nakazibwe'];

const OTHER_FIRST_NAMES = ['John', 'Mary', 'James', 'Elizabeth', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'];
const OTHER_LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'];

// Generate name based on nationality
function generateName(nationality, gender, index) {
  let firstNames, lastNames;
  
  nationality = (nationality || 'Rwandan').toLowerCase();
  
  if (nationality.includes('rwandan') || nationality === 'rwanda') {
    firstNames = RWANDAN_FIRST_NAMES;
    lastNames = RWANDAN_LAST_NAMES;
  } else if (nationality.includes('kenyan') || nationality === 'kenya') {
    firstNames = KENYAN_FIRST_NAMES;
    lastNames = KENYAN_LAST_NAMES;
  } else if (nationality.includes('tanzanian') || nationality === 'tanzania') {
    firstNames = TANZANIAN_FIRST_NAMES;
    lastNames = TANZANIAN_LAST_NAMES;
  } else if (nationality.includes('ugandan') || nationality === 'uganda') {
    firstNames = UGANDAN_FIRST_NAMES;
    lastNames = UGANDAN_LAST_NAMES;
  } else {
    firstNames = OTHER_FIRST_NAMES;
    lastNames = OTHER_LAST_NAMES;
  }
  
  // Use index to ensure consistent names for same customer
  const firstNameIndex = index % firstNames.length;
  const lastNameIndex = (index * 7) % lastNames.length; // Different multiplier for variety
  
  // Filter by gender if possible (for some cultures)
  let firstName = firstNames[firstNameIndex];
  if (gender && gender.toLowerCase() === 'female') {
    // Try to pick a more feminine name if available
    const femaleNames = firstNames.filter(name => 
      name.toLowerCase().includes('marie') || 
      name.toLowerCase().includes('claire') ||
      name.toLowerCase().includes('grace') ||
      name.toLowerCase().includes('anne') ||
      name.toLowerCase().includes('rose') ||
      name.toLowerCase().includes('mary')
    );
    if (femaleNames.length > 0) {
      firstName = femaleNames[firstNameIndex % femaleNames.length];
    }
  }
  
  return `${firstName} ${lastNames[lastNameIndex]}`;
}

// Clean numeric values with commas and spaces
function cleanNumeric(value) {
  if (!value || value === '' || value === null) return 0;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[,\s]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

// Parse date string - handles various formats including time values
function parseDate(dateStr) {
  if (!dateStr || dateStr === '' || dateStr === null) return null;
  
  const str = String(dateStr).trim();
  
  // Skip if it looks like just a time (e.g., "18:21.7", "58:33.2")
  if (/^\d+:\d+\.?\d*$/.test(str)) {
    return null; // Invalid date format, return null
  }
  
  try {
    // Try different date formats
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/,  // DD/MM/YYYY
      /^(\d{4})-(\d{2})-(\d{2})$/,    // YYYY-MM-DD
      /^(\d{2})-(\d{2})-(\d{4})$/,    // DD-MM-YYYY
      /^(\d{4})\/(\d{2})\/(\d{2})$/,  // YYYY/MM/DD
    ];
    
    for (const format of formats) {
      const match = str.match(format);
      if (match) {
        if (format === formats[0]) { // DD/MM/YYYY
          return `${match[3]}-${match[2]}-${match[1]}`;
        } else if (format === formats[1] || format === formats[3]) { // YYYY-MM-DD or YYYY/MM/DD
          return `${match[1]}-${match[2]}-${match[3]}`;
        } else if (format === formats[2]) { // DD-MM-YYYY
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
    }
    
    // Try native Date parsing
    const date = new Date(str);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Silently return null for invalid dates
  }
  return null;
}

// Calculate risk level from churn probability
function calculateRiskLevel(churnProbability) {
  if (churnProbability >= 0.7) return 'high';
  if (churnProbability >= 0.4) return 'medium';
  return 'low';
}

// Map dataset row to database row
function mapDatasetRowToDb(row, index) {
  const customerId = String(row.Customer_ID || row.customer_id || (100000 + index));
  const nationality = row.Nationality || 'Rwandan';
  const gender = row.Gender || 'Male';
  
  // Generate name based on nationality
  const name = generateName(nationality, gender, parseInt(customerId) || index);
  
  // Derive lightweight activity score so downstream features stay consistent
  const mobileUsage = parseInt(row.Mobile_Banking_Usage) || 0;
  const txnFrequency = parseInt(row.Transaction_Frequency) || 0;
  const daysSince = parseInt(row.Days_Since_Last_Transaction) || 0;
  const branchVisits = parseInt(row.Branch_Visits) || 0;
  const rawActivityScore =
    mobileUsage * 0.5 +
    txnFrequency * 0.3 +
    branchVisits * 2 -
    daysSince * 0.1;
  const activityScore = Math.max(0, Math.min(100, Math.round(rawActivityScore)));

  // Churn scores will be calculated by ML model after seeding
  const churnScore = null;
  const riskLevel = null;
  
  // Parse dates
  const accountOpenDate = parseDate(row.Account_Open_Date);
  const lastTransactionDate = parseDate(row.Last_Transaction_Date);
  
  // If last_transaction_date is invalid, calculate from Days_Since_Last_Transaction
  let finalLastTransactionDate = lastTransactionDate;
  if (!finalLastTransactionDate && row.Days_Since_Last_Transaction) {
    const daysSince = parseInt(row.Days_Since_Last_Transaction) || 0;
    if (daysSince > 0) {
      const date = new Date();
      date.setDate(date.getDate() - daysSince);
      finalLastTransactionDate = date.toISOString().split('T')[0];
    }
  }
  
  return {
    customer_id: customerId,
    name: name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}${customerId}@email.com`,
    phone: `+250788${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
    segment: (row.Customer_Segment || 'retail').toLowerCase(),
    branch: row.Branch || 'Kigali Main',
    product_type: row.Account_Type || 'Savings',
    account_balance: cleanNumeric(row.Balance || row[' Balance ']),
    churn_score: churnScore,
    risk_level: riskLevel,
    assigned_officer_id: null, // Will be assigned randomly
    gender: gender,
    nationality: nationality,
    currency: row.Currency || 'RWF',
    account_status: row.Account_Status || 'Active',
    age: parseInt(row.Age) || 50,
    tenure_months: parseInt(row.Tenure_Months) || 12,
    num_products: parseInt(row.Num_Products) || 1,
    has_credit_card: parseInt(row.Has_Credit_Card) === 1,
    transaction_frequency: parseInt(row.Transaction_Frequency) || 0,
    average_transaction_value: cleanNumeric(row.Average_Transaction_Value || row[' Average_Transaction_Value ']),
    mobile_banking_usage: parseInt(row.Mobile_Banking_Usage) || 0,
    branch_visits: parseInt(row.Branch_Visits) || 0,
    complaint_history: parseInt(row.Complaint_History) || 0,
    account_age_months: parseInt(row.Account_Age_Months) || 12,
    days_since_last_transaction: parseInt(row.Days_Since_Last_Transaction) || 0,
    activity_score: activityScore,
    account_open_date: accountOpenDate,
    last_transaction_date: finalLastTransactionDate,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// Insert batch of customers
async function insertBatch(customers, officerIds) {
  if (customers.length === 0) return;
  
  // Assign random officers
  customers.forEach(customer => {
    if (officerIds.length > 0) {
      customer.assigned_officer_id = officerIds[Math.floor(Math.random() * officerIds.length)];
    }
  });
  
  // Count columns: 31 total
  const COLUMN_COUNT = 31;
  const values = customers.map((c, index) => {
    const base = index * COLUMN_COUNT;
    const params = [];
    for (let i = 0; i < COLUMN_COUNT; i++) {
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
    c.account_open_date, c.last_transaction_date, c.created_at, c.updated_at
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
      account_open_date, last_transaction_date, created_at, updated_at
    ) VALUES ${values}
    ON CONFLICT (customer_id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      segment = EXCLUDED.segment,
      branch = EXCLUDED.branch,
      product_type = EXCLUDED.product_type,
      account_balance = EXCLUDED.account_balance,
      gender = EXCLUDED.gender,
      nationality = EXCLUDED.nationality,
      currency = EXCLUDED.currency,
      account_status = EXCLUDED.account_status,
      age = EXCLUDED.age,
      tenure_months = EXCLUDED.tenure_months,
      num_products = EXCLUDED.num_products,
      has_credit_card = EXCLUDED.has_credit_card,
      transaction_frequency = EXCLUDED.transaction_frequency,
      average_transaction_value = EXCLUDED.average_transaction_value,
      mobile_banking_usage = EXCLUDED.mobile_banking_usage,
      branch_visits = EXCLUDED.branch_visits,
      complaint_history = EXCLUDED.complaint_history,
      account_age_months = EXCLUDED.account_age_months,
      days_since_last_transaction = EXCLUDED.days_since_last_transaction,
      activity_score = EXCLUDED.activity_score,
      account_open_date = EXCLUDED.account_open_date,
      last_transaction_date = EXCLUDED.last_transaction_date,
      updated_at = EXCLUDED.updated_at
  `;
  
  await pool.query(query, params);
}

// Export seeded data to CSV
async function exportToCSV(customers) {
  const headers = [
    'customer_id', 'name', 'email', 'phone', 'segment', 'branch',
    'product_type', 'account_balance', 'churn_score', 'risk_level',
    'assigned_officer_id', 'gender', 'nationality', 'currency',
    'account_status', 'age', 'tenure_months', 'num_products',
    'has_credit_card', 'transaction_frequency', 'average_transaction_value',
    'mobile_banking_usage', 'branch_visits', 'complaint_history',
    'account_age_months', 'days_since_last_transaction', 'activity_score',
    'account_open_date', 'last_transaction_date', 'created_at', 'updated_at'
  ];
  
  const csvRows = [headers.join(',')];
  
  customers.forEach(customer => {
    const row = headers.map(header => {
      let value = customer[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'boolean') return value ? '1' : '0';
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
      return String(value);
    });
    csvRows.push(row.join(','));
  });
  
  fs.writeFileSync(OUTPUT_CSV_PATH, csvRows.join('\n'), 'utf8');
  console.log(`\n✅ Exported ${customers.length} customers to: ${OUTPUT_CSV_PATH}`);
}

async function seedCustomers() {
  console.log('🚀 Starting customer seeding from dataset...\n');
  
  try {
    // Check database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Check if dataset file exists
    if (!fs.existsSync(DATASET_PATH)) {
      throw new Error(`Dataset file not found: ${DATASET_PATH}`);
    }
    console.log(`📂 Reading dataset from: ${DATASET_PATH}\n`);
    
    // Read and parse CSV
    console.log('📖 Reading CSV file...');
    const fileContent = fs.readFileSync(DATASET_PATH, 'utf8');
    const records = parseCSV(fileContent);
    
    console.log(`✅ Loaded ${records.length} records from dataset\n`);
    
    // Get officer IDs
    const officersResult = await pool.query("SELECT id FROM users WHERE role = 'retentionOfficer'");
    const officerIds = officersResult.rows.map(row => row.id);
    console.log(`👥 Found ${officerIds.length} retention officers\n`);
    
    // Limit to requested number
    const recordsToImport = records.slice(0, TOTAL_TO_IMPORT);
    console.log(`📊 Will import ${recordsToImport.length} customers\n`);
    
    // Process in batches
    let totalAdded = 0;
    const allImportedCustomers = [];
    const startTime = Date.now();
    
    for (let i = 0; i < recordsToImport.length; i += BATCH_SIZE) {
      const batch = recordsToImport.slice(i, i + BATCH_SIZE);
      const dbCustomers = batch.map((row, idx) => mapDatasetRowToDb(row, i + idx));
      
      await insertBatch(dbCustomers, officerIds);
      totalAdded += dbCustomers.length;
      allImportedCustomers.push(...dbCustomers);
      
      const progress = ((totalAdded / recordsToImport.length) * 100).toFixed(1);
      console.log(`⏳ Progress: ${totalAdded}/${recordsToImport.length} (${progress}%)`);
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Successfully imported ${totalAdded} customers!`);
    console.log(`⏱️  Time: ${totalTime} seconds\n`);
    
    // Export to CSV
    console.log('📤 Exporting seeded data to CSV...');
    await exportToCSV(allImportedCustomers);
    
    // Verify final count
    const finalResult = await pool.query('SELECT COUNT(*) as count FROM customers');
    console.log(`📊 Total customers in database: ${parseInt(finalResult.rows[0].count).toLocaleString()}\n`);
    
    console.log('✅ Seeding complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedCustomers();
}

module.exports = { seedCustomers };

