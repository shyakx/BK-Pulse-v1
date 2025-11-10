/**
 * Comprehensive Dataset Audit and Fix
 * 
 * Reviews entire dataset for all inconsistencies and fixes them according to BK rules:
 * 
 * BK Rules:
 * - Active: 0-180 days (0-6 months)
 * - Inactive: 181-365 days (6-12 months) - NOT churned
 * - Dormant: 366-1460 days (12 months - 4 years) - CHURNED (only Current accounts)
 * - Unclaimed: >1460 days (>4 years) - NOT churned (beyond churn period)
 * 
 * Churn Rules:
 * - Only Current accounts can churn (be Dormant)
 * - Savings and Fixed Deposit cannot churn (remain Active or Inactive)
 * - Churn_Flag should be 1 ONLY for Current accounts with Dormant status (366-1460 days)
 * - Inactive accounts should have Churn_Flag = 0
 * - Unclaimed accounts should have Churn_Flag = 0
 * - Account_Status must match Days_Since_Last_Transaction
 */

const fs = require('fs');
const path = require('path');

// Use FINAL dataset - this script can be used to re-audit if needed
const DATASET_PATH = path.join(__dirname, '../../data/raw/bk_simulated_churn_dataset_with_segment_200k_FINAL.csv');
const OUTPUT_PATH = path.join(__dirname, '../../data/raw/bk_simulated_churn_dataset_with_segment_200k_FINAL.csv');

// BK Rules
function getAccountStatus(daysSinceLastTransaction, productType) {
  const days = parseInt(daysSinceLastTransaction) || 0;
  
  // Savings and Fixed Deposit cannot churn - only Active or Inactive
  if (productType === 'Savings' || productType === 'Fixed Deposit') {
    if (days <= 180) return 'Active';
    return 'Inactive'; // Cannot be Dormant or Unclaimed
  }
  
  // Current accounts can have all statuses
  if (days <= 180) return 'Active';
  if (days <= 365) return 'Inactive';
  if (days <= 1460) return 'Dormant'; // This is churn
  return 'Unclaimed';
}

function getChurnFlag(accountStatus, productType, daysSinceLastTransaction) {
  // Only Current accounts with Dormant status (366-1460 days) are churned
  if (productType === 'Current' && accountStatus === 'Dormant') {
    const days = parseInt(daysSinceLastTransaction) || 0;
    if (days > 365 && days <= 1460) {
      return 1; // Churned
    }
  }
  return 0; // Not churned
}

// Simple CSV parser
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], records: [] };
  
  // Parse header
  const headerLine = lines[0];
  const headers = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < headerLine.length; j++) {
    const char = headerLine[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  headers.push(current.trim());
  
  // Parse records
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const record = {};
    let current = '';
    let inQuotes = false;
    let fieldIndex = 0;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        record[headers[fieldIndex]] = current.trim();
        current = '';
        fieldIndex++;
      } else {
        current += char;
      }
    }
    if (fieldIndex < headers.length) {
      record[headers[fieldIndex]] = current.trim();
    }
    records.push(record);
  }
  
  return { headers, records };
}

// Check if a string is in time format (MM:SS.ms)
function isTimeFormat(value) {
  if (!value || typeof value !== 'string') return false;
  return /^\d+:\d+\.?\d*$/.test(value.trim());
}

// Calculate date from days since last transaction
function calculateDateFromDays(daysSince) {
  const days = parseInt(daysSince) || 0;
  if (days < 0) return null;
  
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

async function auditAndFixDataset() {
  console.log('🔍 Comprehensive Dataset Audit and Fix\n');
  console.log('=' .repeat(60));
  console.log('BK Rules:');
  console.log('  - Active: 0-180 days');
  console.log('  - Inactive: 181-365 days (NOT churned)');
  console.log('  - Dormant: 366-1460 days (CHURNED - Current only)');
  console.log('  - Unclaimed: >1460 days (NOT churned)');
  console.log('  - Only Current accounts can churn');
  console.log('=' .repeat(60) + '\n');
  
  console.log(`📂 Reading: ${DATASET_PATH}\n`);
  
  try {
    // Read the CSV file
    const content = fs.readFileSync(DATASET_PATH, 'utf8');
    const { headers, records } = parseCSV(content);
    
    console.log(`✅ Loaded ${records.length} records\n`);
    
    // Find column indices
    const getColIndex = (name) => {
      return headers.findIndex(h => 
        h === name || h.toLowerCase() === name.toLowerCase()
      );
    };
    
    const daysSinceIndex = getColIndex('Days_Since_Last_Transaction');
    const accountStatusIndex = getColIndex('Account_Status');
    const churnFlagIndex = getColIndex('Churn_Flag');
    const productTypeIndex = getColIndex('Account_Type');
    const lastTransDateIndex = getColIndex('Last_Transaction_Date');
    
    if (daysSinceIndex === -1 || accountStatusIndex === -1 || churnFlagIndex === -1 || 
        productTypeIndex === -1) {
      console.log('❌ Required columns not found!');
      console.log('   Required: Days_Since_Last_Transaction, Account_Status, Churn_Flag, Account_Type');
      return;
    }
    
    const daysSinceHeader = headers[daysSinceIndex];
    const accountStatusHeader = headers[accountStatusIndex];
    const churnFlagHeader = headers[churnFlagIndex];
    const productTypeHeader = headers[productTypeIndex];
    const lastTransDateHeader = headers[lastTransDateIndex];
    
    // Audit issues
    const issues = {
      invalidDates: 0,
      wrongAccountStatus: 0,
      wrongChurnFlag: 0,
      savingsFixedDepositDormant: 0,
      inactiveChurned: 0,
      unclaimedChurned: 0,
      activeChurned: 0,
      totalFixed: 0
    };
    
    console.log('🔍 Auditing dataset...\n');
    
    // Fix all records
    records.forEach((record, index) => {
      const daysSince = parseInt(record[daysSinceHeader]) || 0;
      const currentStatus = record[accountStatusHeader] || '';
      const currentChurnFlag = parseInt(record[churnFlagHeader]) || 0;
      const productType = record[productTypeHeader] || 'Current';
      
      // Fix 1: Invalid date format
      if (lastTransDateHeader && record[lastTransDateHeader]) {
        if (isTimeFormat(record[lastTransDateHeader])) {
          issues.invalidDates++;
          const newDate = calculateDateFromDays(daysSince);
          if (newDate) {
            record[lastTransDateHeader] = newDate;
            issues.totalFixed++;
          }
        }
      }
      
      // Fix 2: Account Status must match Days_Since_Last_Transaction
      const correctStatus = getAccountStatus(daysSince, productType);
      if (currentStatus !== correctStatus) {
        issues.wrongAccountStatus++;
        record[accountStatusHeader] = correctStatus;
        issues.totalFixed++;
      }
      
      // Fix 3: Churn Flag must match Account Status and Product Type
      const correctChurnFlag = getChurnFlag(correctStatus, productType, daysSince);
      if (currentChurnFlag !== correctChurnFlag) {
        issues.wrongChurnFlag++;
        record[churnFlagHeader] = correctChurnFlag;
        issues.totalFixed++;
        
        // Track specific issues
        if (productType !== 'Current' && correctStatus === 'Dormant') {
          issues.savingsFixedDepositDormant++;
        }
        if (correctStatus === 'Inactive' && currentChurnFlag === 1) {
          issues.inactiveChurned++;
        }
        if (correctStatus === 'Unclaimed' && currentChurnFlag === 1) {
          issues.unclaimedChurned++;
        }
        if (correctStatus === 'Active' && currentChurnFlag === 1) {
          issues.activeChurned++;
        }
      }
    });
    
    // Print audit results
    console.log('📊 Audit Results:\n');
    console.log(`  Invalid date formats: ${issues.invalidDates}`);
    console.log(`  Wrong account_status: ${issues.wrongAccountStatus}`);
    console.log(`  Wrong churn_flag: ${issues.wrongChurnFlag}`);
    console.log(`  Savings/Fixed Deposit marked as Dormant: ${issues.savingsFixedDepositDormant}`);
    console.log(`  Inactive accounts marked as churned: ${issues.inactiveChurned}`);
    console.log(`  Unclaimed accounts marked as churned: ${issues.unclaimedChurned}`);
    console.log(`  Active accounts marked as churned: ${issues.activeChurned}`);
    console.log(`  Total fixes applied: ${issues.totalFixed}\n`);
    
    // Verification after fixes
    console.log('✅ Verification after fixes:\n');
    
    const statusCounts = {};
    const churnByStatus = {};
    const churnByProduct = {};
    
    records.forEach(record => {
      const status = record[accountStatusHeader];
      const churnFlag = parseInt(record[churnFlagHeader]) || 0;
      const productType = record[productTypeHeader] || 'Current';
      
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      if (!churnByStatus[status]) {
        churnByStatus[status] = { total: 0, churned: 0 };
      }
      churnByStatus[status].total++;
      if (churnFlag === 1) churnByStatus[status].churned++;
      
      if (!churnByProduct[productType]) {
        churnByProduct[productType] = { total: 0, churned: 0 };
      }
      churnByProduct[productType].total++;
      if (churnFlag === 1) churnByProduct[productType].churned++;
    });
    
    console.log('Account Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const churned = churnByStatus[status]?.churned || 0;
      console.log(`  ${status}: ${count} (${churned} churned)`);
    });
    
    console.log('\nChurn by Product Type:');
    Object.entries(churnByProduct).forEach(([product, stats]) => {
      console.log(`  ${product}: ${stats.churned}/${stats.total} churned (${((stats.churned/stats.total)*100).toFixed(2)}%)`);
    });
    
    // Check for remaining issues
    let remainingIssues = 0;
    records.forEach(record => {
      const daysSince = parseInt(record[daysSinceHeader]) || 0;
      const status = record[accountStatusHeader];
      const churnFlag = parseInt(record[churnFlagHeader]) || 0;
      const productType = record[productTypeHeader] || 'Current';
      
      const correctStatus = getAccountStatus(daysSince, productType);
      const correctChurnFlag = getChurnFlag(correctStatus, productType, daysSince);
      
      if (status !== correctStatus || churnFlag !== correctChurnFlag) {
        remainingIssues++;
      }
    });
    
    if (remainingIssues > 0) {
      console.log(`\n⚠️  Warning: ${remainingIssues} issues still remain!\n`);
    } else {
      console.log('\n✅ All issues fixed! Dataset is now perfect.\n');
    }
    
    // Write fixed CSV
    console.log(`💾 Writing perfect dataset to: ${OUTPUT_PATH}\n`);
    
    const csvLines = [headers.join(',')];
    
    records.forEach(record => {
      const row = headers.map(header => {
        let value = record[header];
        // Convert to string and handle null/undefined
        if (value === null || value === undefined) {
          value = '';
        } else {
          value = String(value);
        }
        // Escape quotes and wrap in quotes if contains comma or newline
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = value.replace(/"/g, '""');
          return `"${value}"`;
        }
        return value;
      });
      csvLines.push(row.join(','));
    });
    
    fs.writeFileSync(OUTPUT_PATH, csvLines.join('\n'), 'utf8');
    
    console.log(`✅ Successfully created perfect dataset!`);
    console.log(`   Output: ${OUTPUT_PATH}`);
    console.log(`   Records: ${records.length}`);
    console.log(`   Total fixes: ${issues.totalFixed}\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  auditAndFixDataset()
    .then(() => {
      console.log('✅ Audit and fix complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Audit and fix failed:', error);
      process.exit(1);
    });
}

module.exports = { auditAndFixDataset };

