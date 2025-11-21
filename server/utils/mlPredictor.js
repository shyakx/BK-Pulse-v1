/**
 * ML Predictor Utility
 * Interfaces with Python prediction script
 */

const { spawn } = require('child_process');
const path = require('path');

const PYTHON_SCRIPT_PATH = path.join(__dirname, '../../ml/predict.py');

/**
 * Predict churn for a single customer
 * @param {Object} customerData - Customer data object
 * @param {Boolean} includeShap - Whether to include SHAP values
 * @returns {Promise<Object>} Prediction results
 */
function predictChurn(customerData, includeShap = false) {
  return new Promise((resolve, reject) => {
    try {
      // Apply BK business rules BEFORE prediction
      const accountType = customerData.Account_Type || customerData.account_type || customerData.product_type;
      const daysSinceLastTransaction = customerData.Days_Since_Last_Transaction || 
                                       customerData.days_since_last_transaction || 0;
      
      // Rule 1: Savings and Fixed Deposit accounts cannot churn (per BNR rules)
      if (accountType === 'Savings' || accountType === 'Fixed Deposit') {
        return resolve({
          churn_probability: 0,
          churn_prediction: 0,
          churn_score: 0,
          risk_level: 'low',
          note: 'Savings/Fixed Deposit accounts cannot churn per BNR regulations'
        });
      }
      
      // Rule 2: Current accounts with 12+ months no transaction are already churned
      if (accountType === 'Current' && daysSinceLastTransaction >= 365) {
        return resolve({
          churn_probability: 0.95,
          churn_prediction: 1,
          churn_score: 95,
          risk_level: 'high',
          note: 'No transaction in 12+ months - already churned per BK rules'
        });
      }
      
      // Convert customer data to JSON string with SHAP flag
      const inputData = {
        customer_data: customerData,
        include_shap: includeShap
      };
      const jsonData = JSON.stringify(inputData);
      
      // Determine Python command (try common variations)
      const isWindows = process.platform === 'win32';
      // On Windows, try 'python' first (most common), then 'py', then 'python3'
      // On Unix, try 'python3' first, then 'python'
      const pythonCmd = isWindows ? 'python' : 'python3';
      
      // Spawn Python process - pass JSON via stdin to avoid Windows quote escaping issues
      const python = spawn(pythonCmd, [PYTHON_SCRIPT_PATH], {
        shell: isWindows, // Use shell on Windows for better compatibility
        cwd: path.join(__dirname, '../../'), // Set working directory to project root
        stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr
      });
      
      // Write JSON data to stdin
      python.stdin.write(jsonData);
      python.stdin.end();
      
      // Handle stdin errors
      python.stdin.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to write to Python process stdin: ${error.message}`));
      });
      
      let stdout = '';
      let stderr = '';
      
      // Add timeout to prevent hanging (60 seconds per prediction - model loading can be slow)
      const timeout = setTimeout(() => {
        python.kill('SIGTERM');
        reject(new Error('Prediction timeout: Python process took longer than 60 seconds'));
      }, 60000);
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        clearTimeout(timeout);
        
        // Try to parse stdout as JSON first (Python script outputs errors as JSON to stdout)
        let result = null;
        try {
          if (stdout.trim()) {
            result = JSON.parse(stdout);
          }
        } catch (parseError) {
          // stdout is not JSON, continue with error handling
        }
        
        if (code !== 0) {
          // Check if stdout contains error JSON
          if (result && result.error) {
            console.error('Python script error (from stdout):', result.error);
            console.error('Python stderr:', stderr);
            reject(new Error(result.error));
            return;
          }
          
          // Otherwise, use stderr or stdout as error message
          const errorMsg = stderr.trim() || stdout.trim() || 'Unknown error';
          console.error('Python script error:', errorMsg);
          console.error('Python stdout:', stdout.substring(0, 500));
          console.error('Python stderr:', stderr);
          reject(new Error(`Python script exited with code ${code}: ${errorMsg}`));
          return;
        }
        
        // Success case - parse result
        if (!result) {
          try {
            result = JSON.parse(stdout);
          } catch (parseError) {
            reject(new Error(`Failed to parse prediction result: ${parseError.message}. Output: ${stdout.substring(0, 200)}`));
            return;
          }
        }
        
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      });
      
      python.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to start Python process: ${error.message}. Make sure Python is installed and ml/predict.py exists.`));
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Predict churn for multiple customers
 * @param {Array<Object>} customersData - Array of customer data objects
 * @returns {Promise<Array<Object>>} Array of prediction results
 */
async function predictChurnBatch(customersData, onProgress) {
  const results = [];
  
  // Process in smaller batches to avoid overwhelming the system and reduce timeouts
  // Reduced from 10 to 5 to give each Python process more resources
  const batchSize = 5;
  let processed = 0;
  
  for (let i = 0; i < customersData.length; i += batchSize) {
    const batch = customersData.slice(i, i + batchSize);
    const batchPromises = batch.map(customer => {
      const customerId = customer.Customer_ID || customer.customer_id || customer.id || 'unknown';
      return predictChurn(customer).then(result => {
        processed++;
        if (onProgress) onProgress(processed, customersData.length);
        const finalResult = {
          ...result,
          customer_id: customerId
        };
        return finalResult;
      }).catch(error => {
        processed++;
        if (onProgress) onProgress(processed, customersData.length);
        console.error(`Prediction error for customer ${customerId}:`, error.message);
        return {
          customer_id: customerId,
          error: error.message || String(error)
        };
      });
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add a small delay between batches to prevent system overload
    if (i + batchSize < customersData.length) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
    }
  }
  
  return results;
}

/**
 * Transform database customer record to prediction format
 * @param {Object} dbCustomer - Customer record from database
 * @returns {Object} Customer data formatted for prediction
 */
function transformCustomerForPrediction(dbCustomer) {
  // Calculate Account_Age_Months from created_at if available
  let accountAgeMonths = dbCustomer.account_age_months || 0;
  if (!accountAgeMonths && dbCustomer.created_at) {
    const created = new Date(dbCustomer.created_at);
    const now = new Date();
    accountAgeMonths = Math.round((now - created) / (1000 * 60 * 60 * 24 * 30));
  }
  
  // Calculate Days_Since_Last_Transaction from updated_at if available
  let daysSinceLastTransaction = dbCustomer.days_since_last_transaction || 0;
  if (!daysSinceLastTransaction && dbCustomer.updated_at) {
    const updated = new Date(dbCustomer.updated_at);
    const now = new Date();
    daysSinceLastTransaction = Math.round((now - updated) / (1000 * 60 * 60 * 24));
  }
  
  // Parse account_balance - handle string or number
  let balance = 0;
  if (dbCustomer.account_balance) {
    balance = typeof dbCustomer.account_balance === 'string' 
      ? parseFloat(dbCustomer.account_balance.replace(/,/g, '')) 
      : parseFloat(dbCustomer.account_balance);
  }
  
  return {
    Customer_ID: dbCustomer.customer_id,
    Customer_Segment: (dbCustomer.segment || 'Retail').charAt(0).toUpperCase() + (dbCustomer.segment || 'Retail').slice(1).toLowerCase(),
    Age: dbCustomer.age || 50,
    Gender: dbCustomer.gender || 'Male',
    Nationality: dbCustomer.nationality || 'Rwandan',
    Account_Type: dbCustomer.product_type || 'Savings',
    Branch: dbCustomer.branch || 'Kigali Main',
    Currency: dbCustomer.currency || 'RWF',
    Balance: balance,
    Tenure_Months: dbCustomer.tenure_months || accountAgeMonths || 12,
    Num_Products: dbCustomer.num_products || 1,
    Has_Credit_Card: dbCustomer.has_credit_card ? 1 : 0,
    Account_Status: dbCustomer.account_status || 'Active',
    Transaction_Frequency: dbCustomer.transaction_frequency || 10,
    Average_Transaction_Value: dbCustomer.average_transaction_value || (balance * 0.05),
    Mobile_Banking_Usage: dbCustomer.mobile_banking_usage || 10,
    Branch_Visits: dbCustomer.branch_visits || 5,
    Complaint_History: dbCustomer.complaint_history || 0,
    Account_Age_Months: accountAgeMonths || 12,
    Days_Since_Last_Transaction: daysSinceLastTransaction || 0,
    Account_Open_Date: dbCustomer.account_open_date || dbCustomer.created_at,
    Last_Transaction_Date: dbCustomer.last_transaction_date || dbCustomer.updated_at
  };
}

module.exports = {
  predictChurn,
  predictChurnBatch,
  transformCustomerForPrediction
};

