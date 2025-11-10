/**
 * Import Actual Churn Flags from Dataset
 * Updates customers table with actual churn outcomes from the dataset
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const DATASET_PATH = path.join(__dirname, '../../data/raw/bk_simulated_churn_dataset_with_segment_200k_FINAL.csv');
const BATCH_SIZE = 1000;

// CSV parser (same as seed script)
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

async function importChurnFlags() {
  console.log('🚀 Starting actual churn flag import...\n');
  
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    if (!fs.existsSync(DATASET_PATH)) {
      throw new Error(`Dataset file not found: ${DATASET_PATH}`);
    }
    
    console.log('📖 Reading dataset...');
    const fileContent = fs.readFileSync(DATASET_PATH, 'utf8');
    const records = parseCSV(fileContent);
    console.log(`✅ Loaded ${records.length} records\n`);
    
    // Create a map of customer_id -> churn_flag
    const churnMap = new Map();
    records.forEach(row => {
      const customerId = String(row.Customer_ID || row.customer_id);
      const churnFlag = parseInt(row.Churn_Flag || 0) === 1;
      churnMap.set(customerId, churnFlag);
    });
    
    console.log(`📊 Found ${churnMap.size} customers with churn flags\n`);
    
    // Get all customer IDs from database
    const dbResult = await pool.query('SELECT customer_id FROM customers');
    const dbCustomers = dbResult.rows.map(r => r.customer_id);
    console.log(`📊 Found ${dbCustomers.length} customers in database\n`);
    
    // Update in batches
    let updated = 0;
    let notFound = 0;
    
    for (let i = 0; i < dbCustomers.length; i += BATCH_SIZE) {
      const batch = dbCustomers.slice(i, i + BATCH_SIZE);
      const updates = [];
      
      for (const customerId of batch) {
        const churnFlag = churnMap.get(customerId);
        if (churnFlag !== undefined) {
          updates.push({
            customerId,
            churnFlag
          });
        } else {
          notFound++;
        }
      }
      
      // Execute batch update using CASE statements
      if (updates.length > 0) {
        const customerIds = updates.map(u => `'${u.customerId}'`).join(',');
        const caseChurnFlag = updates.map((u) => 
          `WHEN '${u.customerId}' THEN ${u.churnFlag}`
        ).join(' ');
        
        const updateQuery = `
          UPDATE customers 
          SET actual_churn_flag = CASE customer_id ${caseChurnFlag} END
          WHERE customer_id IN (${customerIds})
        `;
        
        await pool.query(updateQuery);
        updated += updates.length;
      }
      
      const progress = ((i + batch.length) / dbCustomers.length * 100).toFixed(1);
      console.log(`⏳ Progress: ${i + batch.length}/${dbCustomers.length} (${progress}%) - Updated: ${updated}, Not found: ${notFound}`);
    }
    
    console.log(`\n✅ Import complete!`);
    console.log(`   - Updated: ${updated} customers`);
    console.log(`   - Not found in dataset: ${notFound} customers\n`);
    
    // Verify
    const verifyResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(actual_churn_flag) as with_flag,
        COUNT(CASE WHEN actual_churn_flag = true THEN 1 END) as churned,
        COUNT(CASE WHEN actual_churn_flag = false THEN 1 END) as not_churned
      FROM customers
    `);
    console.log('📊 Verification:');
    console.table(verifyResult.rows);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  importChurnFlags();
}

module.exports = { importChurnFlags };

