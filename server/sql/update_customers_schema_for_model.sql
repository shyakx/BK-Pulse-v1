-- Update Customers Table Schema to Match Model Requirements
-- This migration adds all missing columns required by the ML model
-- Date: 2025-11-01

-- Step 1: Update customer_id to accept numeric format (keep VARCHAR for flexibility)
-- No change needed - VARCHAR(50) already accepts numeric strings

-- Step 2: Add all missing categorical columns
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) DEFAULT 'Rwandan',
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'RWF',
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'Active';

-- Step 3: Add all missing numerical columns
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS tenure_months INTEGER,
ADD COLUMN IF NOT EXISTS num_products INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS has_credit_card BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS transaction_frequency INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_transaction_value DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS mobile_banking_usage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS branch_visits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS complaint_history INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_age_months INTEGER,
ADD COLUMN IF NOT EXISTS days_since_last_transaction INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS activity_score DECIMAL(5,2) DEFAULT 0;

-- Step 4: Add date columns for feature extraction
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS account_open_date DATE,
ADD COLUMN IF NOT EXISTS last_transaction_date DATE;

-- Step 5: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_gender ON customers(gender);
CREATE INDEX IF NOT EXISTS idx_customers_age ON customers(age);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(segment);
CREATE INDEX IF NOT EXISTS idx_customers_account_status ON customers(account_status);
CREATE INDEX IF NOT EXISTS idx_customers_account_open_date ON customers(account_open_date);
CREATE INDEX IF NOT EXISTS idx_customers_last_transaction_date ON customers(last_transaction_date);

-- Step 6: Add comments for documentation
COMMENT ON COLUMN customers.gender IS 'Customer gender (Male, Female) - used for Gender_encoded feature';
COMMENT ON COLUMN customers.nationality IS 'Customer nationality - used for Nationality_encoded feature';
COMMENT ON COLUMN customers.currency IS 'Account currency (RWF, USD, EUR) - used for Currency_encoded feature';
COMMENT ON COLUMN customers.account_status IS 'Account status (Active, Inactive, Unclaimed) - used for Account_Status_encoded feature';
COMMENT ON COLUMN customers.age IS 'Customer age - direct model feature';
COMMENT ON COLUMN customers.tenure_months IS 'Number of months as customer - direct model feature';
COMMENT ON COLUMN customers.num_products IS 'Number of products customer has - direct model feature';
COMMENT ON COLUMN customers.has_credit_card IS 'Whether customer has credit card (0/1) - direct model feature';
COMMENT ON COLUMN customers.transaction_frequency IS 'Transaction frequency - direct model feature';
COMMENT ON COLUMN customers.average_transaction_value IS 'Average transaction value - direct model feature';
COMMENT ON COLUMN customers.mobile_banking_usage IS 'Mobile banking usage count - direct model feature';
COMMENT ON COLUMN customers.branch_visits IS 'Branch visits count - direct model feature';
COMMENT ON COLUMN customers.complaint_history IS 'Complaint history count - direct model feature';
COMMENT ON COLUMN customers.account_age_months IS 'Account age in months - direct model feature';
COMMENT ON COLUMN customers.days_since_last_transaction IS 'Days since last transaction - direct model feature';
COMMENT ON COLUMN customers.activity_score IS 'Activity score - direct model feature';
COMMENT ON COLUMN customers.account_open_date IS 'Account open date - used to extract Account_Open_Month/Year features';
COMMENT ON COLUMN customers.last_transaction_date IS 'Last transaction date - used to extract Last_Transaction_Month/Year features';

-- Verification query (run after migration)
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'customers' 
-- ORDER BY ordinal_position;

