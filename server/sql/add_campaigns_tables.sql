-- Add campaigns and campaign performance tables
-- This can be run separately to add the tables to existing database

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(100) NOT NULL CHECK (campaign_type IN ('retention', 'win_back', 'upsell', 'cross_sell', 'preventive')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    target_segment VARCHAR(100),
    target_criteria JSONB, -- Store segmentation criteria as JSON
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2),
    allocated_budget DECIMAL(15,2) DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign targets (customers assigned to campaigns)
CREATE TABLE IF NOT EXISTS campaign_targets (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'targeted' CHECK (status IN ('targeted', 'contacted', 'responded', 'converted', 'rejected')),
    contacted_at TIMESTAMP,
    responded_at TIMESTAMP,
    converted_at TIMESTAMP,
    outcome TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, customer_id)
);

-- Campaign performance metrics
CREATE TABLE IF NOT EXISTS campaign_performance (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    targets_count INTEGER DEFAULT 0,
    contacted_count INTEGER DEFAULT 0,
    responded_count INTEGER DEFAULT 0,
    converted_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    cost_per_conversion DECIMAL(10,2),
    revenue_generated DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, metric_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_campaign_id ON campaign_targets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_customer_id ON campaign_targets(customer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_status ON campaign_targets(status);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_campaign_id ON campaign_performance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_metric_date ON campaign_performance(metric_date);

-- Create triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

