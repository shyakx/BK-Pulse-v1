-- Performance Indexes for BK Pulse
-- Run this on your database to improve query performance

-- Composite indexes for common customer queries
CREATE INDEX IF NOT EXISTS idx_customers_risk_officer ON customers(risk_level, assigned_officer_id) WHERE risk_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_segment_risk ON customers(segment, risk_level) WHERE segment IS NOT NULL AND risk_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_churn_risk ON customers(churn_score DESC, risk_level) WHERE churn_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON customers(updated_at DESC) WHERE updated_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(branch) WHERE branch IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin(name gin_trgm_ops);

-- Composite indexes for actions
CREATE INDEX IF NOT EXISTS idx_actions_officer_status ON actions(officer_id, status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_actions_customer_status ON actions(customer_id, status) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_actions_created_at ON actions(created_at DESC);

-- Indexes for recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recommendations_customer ON recommendations(customer_id, status);

-- Indexes for better date filtering in trend queries
CREATE INDEX IF NOT EXISTS idx_customers_risk_trend ON customers(risk_level, updated_at, created_at) 
  WHERE risk_level IS NOT NULL;

-- Enable pg_trgm extension for text search (if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

