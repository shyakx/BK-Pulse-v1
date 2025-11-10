-- Add actual_churn_flag column to track actual churn outcomes
-- This allows comparison of predictions vs actual results for model validation

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS actual_churn_flag BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN customers.actual_churn_flag IS 'Actual churn outcome (true = churned, false = not churned, NULL = unknown). Used for model validation.';

CREATE INDEX IF NOT EXISTS idx_customers_actual_churn_flag ON customers(actual_churn_flag);

