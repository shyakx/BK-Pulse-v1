-- Add churn_score_at_assignment column to customer_assignments table
-- This stores the churn score at the time of assignment for stable prioritization
-- Author: Auto-generated
-- Date: 2025

-- Add the column if it doesn't exist
ALTER TABLE customer_assignments 
ADD COLUMN IF NOT EXISTS churn_score_at_assignment DECIMAL(5,2);

-- Create index for efficient sorting by assignment-time score
CREATE INDEX IF NOT EXISTS idx_customer_assignments_churn_score_at_assignment 
ON customer_assignments(churn_score_at_assignment DESC NULLS LAST);

-- Backfill existing assignments with current customer churn_score
-- This ensures existing assignments have a priority score
UPDATE customer_assignments ca
SET churn_score_at_assignment = (
  SELECT c.churn_score 
  FROM customers c 
  WHERE c.id = ca.customer_id 
  ORDER BY c.updated_at DESC NULLS LAST, c.id DESC 
  LIMIT 1
)
WHERE churn_score_at_assignment IS NULL;

-- Add comment to column
COMMENT ON COLUMN customer_assignments.churn_score_at_assignment IS 
'Churn score at the time of assignment. Used for stable prioritization even when current churn scores change.';

