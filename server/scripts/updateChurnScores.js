/**
 * Batch script to update customer churn scores using ML model
 * Run with: node server/scripts/updateChurnScores.js
 */

// Load .env from server directory
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/database');
const { predictChurnBatch, transformCustomerForPrediction } = require('../utils/mlPredictor');

async function updateChurnScores(limit = 100, updateAll = false) {
  try {
    // Test database connection first
    try {
      await pool.query('SELECT 1');
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      console.error('\nPlease ensure:');
      console.error('1. PostgreSQL is running');
      console.error('2. Database credentials are correct in .env file');
      console.error('3. Database "bk_pulse" exists');
      process.exit(1);
    }
    
    console.log('Starting churn score update...');
    
    // Build query based on updateAll flag
    let query;
    let params;
    
    if (updateAll) {
      console.log(`⚠️  Update All Mode: Will update ALL customers (up to ${limit})`);
      query = `SELECT * FROM customers ORDER BY id LIMIT $1`;
      params = [limit];
    } else {
      query = `SELECT * FROM customers 
               WHERE churn_score IS NULL OR updated_at < CURRENT_DATE - INTERVAL '1 day'
               ORDER BY id 
               LIMIT $1`;
      params = [limit];
    }
    
    // Fetch customers that need updating
    const result = await pool.query(query, params);
    
    const customers = result.rows;
    console.log(`Found ${customers.length} customers to update`);
    
    if (customers.length === 0) {
      console.log('No customers need updating');
      return;
    }
    
    // Transform customer data
    const customersData = customers.map(transformCustomerForPrediction);
    
    // Pre-check: Verify Python and ML files exist (test with first customer)
    console.log('Verifying ML prediction setup...');
    try {
      const fs = require('fs');
      const mlPath = path.join(__dirname, '../../ml/predict.py');
      if (!fs.existsSync(mlPath)) {
        throw new Error(`ML prediction script not found at: ${mlPath}`);
      }
      console.log('✅ ML prediction script found');
    } catch (checkError) {
      console.error('\n❌ Setup check failed:', checkError.message);
      console.error('\n💡 Please ensure:');
      console.error('   1. ml/predict.py exists');
      console.error('   2. ML model is trained (run: cd ml && python train_model.py)');
      throw checkError;
    }
    
    // Get predictions with progress tracking
    console.log('\nGenerating predictions...');
    console.log(`Processing ${customers.length} customers (this may take a few minutes)...\n`);
    
    // Show progress for batch predictions
    let processedCount = 0;
    const progressCallback = (current, total) => {
      processedCount = current;
    };
    
    const progressInterval = setInterval(() => {
      if (processedCount < customers.length) {
        const progress = ((processedCount / customers.length) * 100).toFixed(1);
        process.stdout.write(`\r⏳ Progress: ${processedCount}/${customers.length} (${progress}%) - Generating predictions...`);
      }
    }, 500); // Update every 500ms
    
    let predictions;
    try {
      predictions = await predictChurnBatch(customersData, progressCallback);
      clearInterval(progressInterval);
      processedCount = customers.length;
      process.stdout.write(`\r✅ Completed predictions: ${customers.length}/${customers.length} (100%)\n\n`);
    } catch (predictionError) {
      clearInterval(progressInterval);
      console.error('\n\n❌ Prediction failed:', predictionError.message);
      console.error('\n💡 Possible causes:');
      console.error('   1. Python is not installed or not in PATH');
      console.error('   2. ML model files missing (check ml/predict.py and data/models/)');
      console.error('   3. Python dependencies not installed (run: pip install -r ml/requirements.txt)');
      console.error('   4. Model not trained yet (run: cd ml && python train_model.py)');
      throw predictionError;
    }
    
    // Update database
    console.log('Updating database...');
    let updated = 0;
    let errors = 0;
    const failedCustomers = [];
    
    for (const pred of predictions) {
      if (!pred.error && pred.customer_id) {
        try {
          await pool.query(
            'UPDATE customers SET churn_score = $1, risk_level = $2, updated_at = CURRENT_TIMESTAMP WHERE customer_id = $3',
            [pred.churn_score, pred.risk_level, pred.customer_id]
          );
          updated++;
        } catch (dbError) {
          console.error(`Failed to update customer ${pred.customer_id}:`, dbError.message);
          errors++;
          failedCustomers.push(pred.customer_id);
        }
      } else {
        errors++;
        if (pred.customer_id) {
          failedCustomers.push(pred.customer_id);
        }
        // Only show first 5 errors to avoid spam
        if (errors <= 5) {
          console.error(`Prediction error for customer ${pred.customer_id}:`, pred.error || 'Unknown error');
        }
      }
    }
    
    console.log('\n=== Update Complete ===');
    console.log(`Total customers: ${customers.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    
    if (failedCustomers.length > 0) {
      console.log(`\n⚠️  ${failedCustomers.length} customers failed. They will be retried on next run (without --all flag).`);
      if (failedCustomers.length <= 10) {
        console.log(`   Failed customer IDs: ${failedCustomers.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('Update failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Database connection refused. Please:');
      console.error('   1. Ensure PostgreSQL is running');
      console.error('   2. Check server/.env file for correct database credentials');
      console.error('   3. Verify database "bk_pulse" exists');
    }
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (e) {
      // Ignore errors when closing pool
    }
  }
}

// Run script
// Usage: node updateChurnScores.js [limit] [--all]
// Examples:
//   node updateChurnScores.js 1000        # Update 1000 customers that need updating
//   node updateChurnScores.js 1000 --all  # Update first 1000 customers (all)
//   node updateChurnScores.js --all       # Update first 100 customers (all)

const args = process.argv.slice(2);
let limit = 100;
let updateAll = false;

args.forEach(arg => {
  if (arg === '--all' || arg === '-a') {
    updateAll = true;
  } else if (!isNaN(parseInt(arg))) {
    limit = parseInt(arg);
  }
});

if (updateAll) {
  console.log(`📢 Update All Mode: Will process first ${limit} customers\n`);
}

updateChurnScores(limit, updateAll)
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

