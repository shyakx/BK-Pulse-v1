-- Add retention_notes table for storing retention notes
-- This can be run separately to add the table to existing database

CREATE TABLE IF NOT EXISTS retention_notes (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    follow_up_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'resolved')),
    tags TEXT[], -- Array of tags for categorization
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_retention_notes_customer_id ON retention_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_retention_notes_officer_id ON retention_notes(officer_id);
CREATE INDEX IF NOT EXISTS idx_retention_notes_status ON retention_notes(status);
CREATE INDEX IF NOT EXISTS idx_retention_notes_created_at ON retention_notes(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_retention_notes_updated_at BEFORE UPDATE ON retention_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

