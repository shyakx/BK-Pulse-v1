-- Add customer segments table for storing saved segmentation criteria
-- This can be run separately to add the table to existing database

CREATE TABLE IF NOT EXISTS customer_segments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL, -- Store segmentation criteria as JSON
    customer_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Segment customers mapping (many-to-many relationship)
CREATE TABLE IF NOT EXISTS segment_customers (
    id SERIAL PRIMARY KEY,
    segment_id INTEGER REFERENCES customer_segments(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(segment_id, customer_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_segments_created_by ON customer_segments(created_by);
CREATE INDEX IF NOT EXISTS idx_segment_customers_segment_id ON segment_customers(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_customers_customer_id ON segment_customers(customer_id);

-- Create trigger for updated_at
CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

