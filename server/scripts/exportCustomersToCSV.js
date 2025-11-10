/**
 * Export All Customers to CSV
 * Exports all current customer data from database to CSV file
 * 
 * Usage:
 *   node server/scripts/exportCustomersToCSV.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');

// Generate filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toTimeString().split(' ')[0].replace(/:/g, '');
const OUTPUT_CSV_PATH = path.join(__dirname, `../../data/exported_customers_${timestamp}.csv`);

async function exportCustomersToCSV() {
  console.log('📤 Starting export of all customer data...\n');
  
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Get all customers
    console.log('📖 Fetching all customers from database...');
    const result = await pool.query(`
      SELECT 
        customer_id, name, email, phone, segment, branch,
        product_type, account_balance, churn_score, risk_level,
        assigned_officer_id, gender, nationality, currency,
        account_status, age, tenure_months, num_products,
        has_credit_card, transaction_frequency, average_transaction_value,
        mobile_banking_usage, branch_visits, complaint_history,
        account_age_months, days_since_last_transaction, activity_score,
        account_open_date, last_transaction_date, created_at, updated_at
      FROM customers
      ORDER BY customer_id
    `);
    
    const customers = result.rows;
    console.log(`✅ Found ${customers.length} customers\n`);
    
    if (customers.length === 0) {
      console.log('⚠️  No customers found in database. Nothing to export.');
      return;
    }
    
    // Define CSV headers
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
    
    // Build CSV content
    const csvRows = [headers.join(',')];
    
    customers.forEach(customer => {
      const row = headers.map(header => {
        let value = customer[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? '1' : '0';
        
        // Format date fields properly
        if (header === 'account_open_date' || header === 'last_transaction_date' || 
            header === 'created_at' || header === 'updated_at') {
          if (value) {
            // Check if it's already a valid date string (YYYY-MM-DD)
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
              return value.split('T')[0]; // Return just the date part
            }
            // Check if it's a Date object
            if (value instanceof Date) {
              return value.toISOString().split('T')[0];
            }
            // Check if it's an invalid time format (MM:SS.ms) - recalculate from days_since_last_transaction
            if (typeof value === 'string' && /^\d+:\d+\.?\d*$/.test(value)) {
              // Invalid time format - try to recalculate from days_since_last_transaction
              if (header === 'last_transaction_date' && customer.days_since_last_transaction) {
                const daysSince = parseInt(customer.days_since_last_transaction) || 0;
                if (daysSince > 0) {
                  const date = new Date();
                  date.setDate(date.getDate() - daysSince);
                  return date.toISOString().split('T')[0];
                }
              }
              return ''; // Return empty for invalid dates
            }
            // Try to parse as date
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
                return date.toISOString().split('T')[0];
              }
            } catch (e) {
              return '';
            }
          }
          return '';
        }
        
        // Escape quotes and wrap in quotes if contains comma or newline
        if (typeof value === 'string') {
          value = value.replace(/"/g, '""'); // Escape quotes
          if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            return `"${value}"`;
          }
        }
        return String(value);
      });
      csvRows.push(row.join(','));
    });
    
    // Write to file
    fs.writeFileSync(OUTPUT_CSV_PATH, csvRows.join('\n'), 'utf8');
    
    console.log(`✅ Successfully exported ${customers.length} customers to:`);
    console.log(`   ${OUTPUT_CSV_PATH}\n`);
    console.log('📊 Export summary:');
    console.log(`   - Total customers: ${customers.length}`);
    console.log(`   - File size: ${(fs.statSync(OUTPUT_CSV_PATH).size / 1024).toFixed(2)} KB`);
    console.log(`   - Columns: ${headers.length}\n`);
    
  } catch (error) {
    console.error('\n❌ Error during export:', error);
    console.error('   Error details:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  exportCustomersToCSV()
    .then(() => {
      console.log('✅ Export completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Export failed:', error);
      process.exit(1);
    });
}

module.exports = exportCustomersToCSV;

