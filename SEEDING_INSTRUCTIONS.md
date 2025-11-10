# Customer Seeding Instructions

## Current Status

### ✅ Completed
1. **Schema Analysis** - Analyzed current database schema vs dataset requirements
2. **Migration Script** - Created SQL migration to add all missing columns
3. **Seed Script** - Created script to import 50,000 customers from dataset
4. **CSV Export** - Script will export seeded data to CSV for reference

### 📊 Database Schema Status

**Current Schema:** 32 columns (including id, created_at, updated_at)  
**Status:** Schema is up to date with all required columns

## Step-by-Step Instructions

### Step 1: Run Database Migration

First, update the database schema to add all missing columns:

```bash
# From the project root
cd server
psql -U your_username -d bk_pulse -f sql/update_customers_schema_for_model.sql
```

Or using Node.js:
```bash
node -e "const pool = require('./config/database'); const fs = require('fs'); const sql = fs.readFileSync('./sql/update_customers_schema_for_model.sql', 'utf8'); pool.query(sql).then(() => { console.log('Migration complete!'); pool.end(); }).catch(e => { console.error(e); pool.end(); });"
```

### Step 2: Verify Schema Update

Verify that all columns were added:

```bash
cd server
node -e "const pool = require('./config/database'); pool.query(\"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customers' ORDER BY ordinal_position\").then(r => { console.table(r.rows); pool.end(); });"
```

You should see 32 columns total.

### Step 3: Seed 50,000 Customers

Run the seeding script:

```bash
cd server
node scripts/seedCustomersFromDataset.js
```

This will:
- Read the first 50,000 rows from `data/raw/bk_simulated_churn_dataset_with_segment_200k.csv`
- Map all columns to match the database schema
- Import in batches of 500
- Assign random retention officers
- Export seeded data to `data/exported_seeded_customers.csv`

### Step 4: Verify Seeded Data

Check the seeded data:

```bash
cd server
node -e "const pool = require('./config/database'); pool.query('SELECT COUNT(*) as count FROM customers').then(r => { console.log('Total customers:', r.rows[0].count); pool.end(); });"
```

You should see 50,000 customers (or more if you had existing data).

### Step 5: Check Exported CSV

The exported CSV will be at:
```
data/exported_seeded_customers.csv
```

This CSV contains all the seeded customer data and can be used as a reference when making predictions in the UI.

## Column Mapping

| Dataset Column | Database Column | Type | Notes |
|---------------|----------------|------|-------|
| Customer_ID | customer_id | VARCHAR(50) | Numeric IDs from dataset (100000, 100001...) |
| Customer_Segment | segment | VARCHAR(50) | Lowercased |
| Gender | gender | VARCHAR(20) | ✅ New column |
| Age | age | INTEGER | ✅ New column |
| Nationality | nationality | VARCHAR(50) | ✅ New column |
| Account_Type | product_type | VARCHAR(100) | Existing |
| Branch | branch | VARCHAR(100) | Existing |
| Currency | currency | VARCHAR(10) | ✅ New column |
| Balance | account_balance | DECIMAL(15,2) | Existing |
| Tenure_Months | tenure_months | INTEGER | ✅ New column |
| Num_Products | num_products | INTEGER | ✅ New column |
| Has_Credit_Card | has_credit_card | BOOLEAN | ✅ New column |
| Account_Status | account_status | VARCHAR(50) | ✅ New column |
| Account_Open_Date | account_open_date | DATE | ✅ New column |
| Last_Transaction_Date | last_transaction_date | DATE | ✅ New column |
| Transaction_Frequency | transaction_frequency | INTEGER | ✅ New column |
| Average_Transaction_Value | average_transaction_value | DECIMAL(15,2) | ✅ New column |
| Mobile_Banking_Usage | mobile_banking_usage | INTEGER | ✅ New column |
| Branch_Visits | branch_visits | INTEGER | ✅ New column |
| Complaint_History | complaint_history | INTEGER | ✅ New column |
| Account_Age_Months | account_age_months | INTEGER | ✅ New column |
| Days_Since_Last_Transaction | days_since_last_transaction | INTEGER | ✅ New column |
| Activity_Score | activity_score | DECIMAL(5,2) | ✅ New column |

## Model Compatibility

All 24 model features are now supported:

✅ **Categorical (7):**
- Customer_Segment_encoded (from segment)
- Gender_encoded (from gender) ✅ NEW
- Nationality_encoded (from nationality) ✅ NEW
- Account_Type_encoded (from product_type)
- Branch_encoded (from branch)
- Currency_encoded (from currency) ✅ NEW
- Account_Status_encoded (from account_status) ✅ NEW

✅ **Numerical (13):**
- Age ✅ NEW
- Balance (from account_balance)
- Tenure_Months ✅ NEW
- Num_Products ✅ NEW
- Has_Credit_Card ✅ NEW
- Transaction_Frequency ✅ NEW
- Average_Transaction_Value ✅ NEW
- Mobile_Banking_Usage ✅ NEW
- Branch_Visits ✅ NEW
- Complaint_History ✅ NEW
- Account_Age_Months ✅ NEW
- Days_Since_Last_Transaction ✅ NEW
- Activity_Score ✅ NEW

✅ **Date-derived (4):**
- Account_Open_Month/Year (from account_open_date) ✅ NEW
- Last_Transaction_Month/Year (from last_transaction_date) ✅ NEW

## Troubleshooting

### Error: "column does not exist"
- Make sure you ran the migration script first (Step 1)

### Error: "dataset file not found"
- Verify the file exists at: `data/raw/bk_simulated_churn_dataset_with_segment_200k.csv`

### Error: "no retention officers found"
- Make sure you have at least one user with role 'retentionOfficer' in the database
- Run the seed.sql script to create sample users

### CSV parsing errors
- The script includes a simple CSV parser that handles quoted values
- If you encounter issues, check the dataset file format

## Next Steps

After seeding:
1. ✅ Verify all 50,000 customers were imported
2. ✅ Check the exported CSV file for reference
3. ✅ Test predictions in the UI using customer IDs from the CSV
4. ✅ Run batch predictions to populate churn_score and risk_level

## Files Created

1. `DATABASE_SCHEMA_STATUS.md` - Detailed schema analysis
2. `server/sql/update_customers_schema_for_model.sql` - Migration script
3. `server/scripts/seedCustomersFromDataset.js` - Seeding script
4. `data/exported_seeded_customers.csv` - Exported seeded data (created after running seed script)

