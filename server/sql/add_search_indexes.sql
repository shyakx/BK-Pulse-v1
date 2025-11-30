-- Search Performance Indexes for BK Pulse
-- Run this to improve customer search performance
-- These indexes will make exact and prefix searches much faster

-- Index on customer_id (should already exist as UNIQUE, but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);

-- Indexes for text search (name and email)
-- These support prefix matching (name LIKE 'search%') which can use indexes
CREATE INDEX IF NOT EXISTS idx_customers_name_prefix ON customers(name text_pattern_ops) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email_prefix ON customers(email text_pattern_ops) WHERE email IS NOT NULL;

-- For case-insensitive searches, we can use lower() function indexes
CREATE INDEX IF NOT EXISTS idx_customers_name_lower ON customers(lower(name)) WHERE name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email_lower ON customers(lower(email)) WHERE email IS NOT NULL;

-- Composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_customers_search_composite ON customers(customer_id, name, email) 
  WHERE customer_id IS NOT NULL;

