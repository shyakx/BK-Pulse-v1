/**
 * Test script for ML predictions
 * Run with: node server/scripts/testPrediction.js
 */

const { predictChurn } = require('../utils/mlPredictor');

async function testPrediction() {
  console.log('Testing ML Prediction...\n');
  
  // Sample customer data
  const sampleCustomer = {
    Customer_Segment: 'Retail',
    Age: 45,
    Gender: 'Male',
    Nationality: 'Rwandan',
    Account_Type: 'Savings',
    Branch: 'Kigali Main',
    Currency: 'RWF',
    Balance: 10000000,
    Tenure_Months: 60,
    Num_Products: 3,
    Has_Credit_Card: 1,
    Account_Status: 'Active',
    Transaction_Frequency: 25,
    Average_Transaction_Value: 500000,
    Mobile_Banking_Usage: 15,
    Branch_Visits: 5,
    Complaint_History: 1,
    Account_Age_Months: 72,
    Days_Since_Last_Transaction: 5,
    Activity_Score: 18.5
  };
  
  try {
    console.log('Customer data:', JSON.stringify(sampleCustomer, null, 2));
    console.log('\nGenerating prediction...\n');
    
    const result = await predictChurn(sampleCustomer);
    
    console.log('Prediction Result:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ Prediction successful!');
    
  } catch (error) {
    console.error('❌ Prediction failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Python is installed and in PATH');
    console.error('2. Ensure model files exist in data/models/');
    console.error('3. Ensure preprocessed files exist in data/processed/');
    console.error('4. Try running: python ml/train_model.py');
    process.exit(1);
  }
}

testPrediction();

