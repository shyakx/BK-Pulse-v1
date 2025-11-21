const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// @route   GET /api/admin/maintenance
// @desc    Get system maintenance information
// @access  Private (Admin only)
router.get('/maintenance', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get database information
    const dbInfo = await pool.query(`
      SELECT 
        pg_database.datname,
        pg_size_pretty(pg_database_size(pg_database.datname)) AS size
      FROM pg_database
      WHERE datname = current_database()
    `);

    // Get table sizes
    const tableSizes = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);

    // Get row counts for major tables
    const rowCounts = await pool.query(`
      SELECT 
        'customers' as table_name, COUNT(*) as row_count FROM customers
      UNION ALL
      SELECT 'actions', COUNT(*) FROM actions
      UNION ALL
      SELECT 'retention_notes', COUNT(*) FROM retention_notes
      UNION ALL
      SELECT 'campaigns', COUNT(*) FROM campaigns
      UNION ALL
      SELECT 'users', COUNT(*) FROM users
    `);

    // Get last backup info (if backup system exists)
    const lastBackup = await pool.query(`
      SELECT MAX(created_at) as last_backup
      FROM audit_logs
      WHERE action = 'database_backup'
    `);

    res.json({
      success: true,
      database: {
        name: dbInfo.rows[0]?.datname,
        size: dbInfo.rows[0]?.size
      },
      tables: tableSizes.rows.map(row => ({
        name: row.tablename,
        size: row.size,
        size_bytes: row.size_bytes
      })),
      row_counts: rowCounts.rows.reduce((acc, row) => {
        acc[row.table_name] = parseInt(row.row_count);
        return acc;
      }, {}),
      last_backup: lastBackup.rows[0]?.last_backup || null
    });
  } catch (error) {
    console.error('Error fetching maintenance info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance information',
      error: error.message
    });
  }
});

// Helper functions for seeding (extracted from seedCustomersFromDataset.js)
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
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

function cleanNumeric(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

const RWANDAN_FIRST_NAMES = ['Jean', 'Marie', 'Paul', 'Claire', 'Eric', 'Grace', 'David', 'Ange', 'Peter', 'Vestine', 'Felix', 'Immaculee', 'Emmanuel', 'Aline', 'Theophile', 'Josiane', 'Pacifique', 'Chantal', 'Innocent', 'Mukamana', 'Yves', 'Francoise', 'Alexis', 'Beatrice', 'Patrick', 'Julienne', 'Andre', 'Therese', 'Joseph', 'Agnes', 'Charles', 'Jeanne', 'Pierre', 'Clementine', 'Antoine', 'Rose'];
const RWANDAN_LAST_NAMES = ['MUGISHA', 'UWIMANA', 'KAYITARE', 'MUKAMANA', 'HABIMANA', 'SHYAKA', 'BAPTISTE', 'RUTAGANDA', 'UWERA', 'MUNYANEZA', 'NYIRAHABIMANA', 'KAMANZI', 'NKUNDIYE', 'MUKAMUSONI', 'NSABIMANA', 'UWAMAHORO', 'MUKAMUSONI', 'RUTAYISIRE', 'MUKAMANA', 'HABIMANA', 'KAYITARE', 'MUKAMANA', 'UWIMANA', 'MUGISHA', 'RUTAGANDA', 'UWERA', 'MUNYANEZA', 'NYIRAHABIMANA', 'KAMANZI', 'NKUNDIYE', 'MUKAMUSONI', 'NSABIMANA', 'UWAMAHORO', 'RUTAYISIRE'];

function generateName(nationality, gender, seed) {
  const firstNames = RWANDAN_FIRST_NAMES;
  const lastNames = RWANDAN_LAST_NAMES;
  const firstNameIndex = seed % firstNames.length;
  const lastNameIndex = (seed * 7) % lastNames.length;
  return `${firstNames[firstNameIndex]} ${lastNames[lastNameIndex]}`;
}

function mapDatasetRowToDb(row, index) {
  const customerId = String(row.Customer_ID || row.customer_id || (100000 + index));
  const nationality = row.Nationality || 'Rwandan';
  const gender = row.Gender || 'Male';
  const name = generateName(nationality, gender, parseInt(customerId) || index);
  
  const mobileUsage = parseInt(row.Mobile_Banking_Usage) || 0;
  const txnFrequency = parseInt(row.Transaction_Frequency) || 0;
  const daysSince = parseInt(row.Days_Since_Last_Transaction) || 0;
  const branchVisits = parseInt(row.Branch_Visits) || 0;
  const rawActivityScore = mobileUsage * 0.5 + txnFrequency * 0.3 + branchVisits * 2 - daysSince * 0.1;
  const activityScore = Math.max(0, Math.min(100, Math.round(rawActivityScore)));

  const accountOpenDate = parseDate(row.Account_Open_Date);
  let lastTransactionDate = parseDate(row.Last_Transaction_Date);
  if (!lastTransactionDate && row.Days_Since_Last_Transaction) {
    const daysSince = parseInt(row.Days_Since_Last_Transaction) || 0;
    if (daysSince > 0) {
      const date = new Date();
      date.setDate(date.getDate() - daysSince);
      lastTransactionDate = date.toISOString().split('T')[0];
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
    churn_score: null,
    risk_level: null,
    assigned_officer_id: null,
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
    last_transaction_date: lastTransactionDate,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function insertBatch(customers, officerIds) {
  if (customers.length === 0) return;
  
  customers.forEach(customer => {
    if (officerIds.length > 0) {
      customer.assigned_officer_id = officerIds[Math.floor(Math.random() * officerIds.length)];
    }
  });
  
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

// @route   POST /api/admin/seed-customers
// @desc    Seed database with customers from dataset
// @access  Private (Admin only)
router.post('/seed-customers', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { limit = 10000 } = req.body; // Default to 10,000 customers
    
    // Validate limit
    const customerLimit = Math.min(Math.max(parseInt(limit) || 10000, 100), 50000);
    
    const DATASET_PATH = path.join(__dirname, '../../data/raw/bk_pulse_customer_dataset.csv');
    const BATCH_SIZE = 500;
    
    // Check if dataset file exists
    if (!fs.existsSync(DATASET_PATH)) {
      return res.status(404).json({
        success: false,
        message: 'Dataset file not found. Please ensure the dataset file is available.',
        path: DATASET_PATH
      });
    }
    
    // Read and parse CSV
    const fileContent = fs.readFileSync(DATASET_PATH, 'utf8');
    const records = parseCSV(fileContent);
    
    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dataset file is empty or could not be parsed'
      });
    }
    
    // Get officer IDs
    const officersResult = await pool.query("SELECT id FROM users WHERE role = 'retentionOfficer'");
    const officerIds = officersResult.rows.map(row => row.id);
    
    if (officerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No retention officers found. Please create officers first.'
      });
    }
    
    // Limit to requested number
    const recordsToImport = records.slice(0, customerLimit);
    
    // Process in batches
    let totalAdded = 0;
    const startTime = Date.now();
    
    for (let i = 0; i < recordsToImport.length; i += BATCH_SIZE) {
      const batch = recordsToImport.slice(i, i + BATCH_SIZE);
      const dbCustomers = batch.map((row, idx) => mapDatasetRowToDb(row, i + idx));
      
      await insertBatch(dbCustomers, officerIds);
      totalAdded += dbCustomers.length;
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Verify final count
    const finalResult = await pool.query('SELECT COUNT(*) as count FROM customers');
    const totalCustomers = parseInt(finalResult.rows[0].count);
    
    res.json({
      success: true,
      message: `Successfully imported ${totalAdded} customers`,
      imported: totalAdded,
      total_customers: totalCustomers,
      time_seconds: parseFloat(totalTime)
    });
    
  } catch (error) {
    console.error('Error seeding customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed customers',
      error: error.message
    });
  }
});

// @route   POST /api/admin/generate-customers
// @desc    Generate synthetic customers
// @access  Private (Admin only)
router.post('/generate-customers', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { count = 1000 } = req.body;
    
    // Validate count
    const customerCount = Math.min(Math.max(parseInt(count) || 1000, 1), 10000);
    
    // Get officer IDs
    const officersResult = await pool.query("SELECT id FROM users WHERE role = 'retentionOfficer'");
    const officerIds = officersResult.rows.map(row => row.id);
    
    if (officerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No retention officers found. Please create officers first.'
      });
    }
    
    // Import the generateCustomers function logic here or require it
    // For now, return a message directing to use seed-customers endpoint
    res.status(501).json({
      success: false,
      message: 'Use /api/admin/seed-customers endpoint to import customers from dataset',
      alternative: 'POST /api/admin/seed-customers with { limit: number }'
    });
    
  } catch (error) {
    console.error('Error generating customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate customers',
      error: error.message
    });
  }
});

module.exports = router;
