-- Customer Assignments Table
-- This table manages temporary 24-hour assignments of high-risk customers to officers
-- Author: Steven SHYAKA
-- Date: 10/2025

CREATE TABLE IF NOT EXISTS customer_assignments (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    officer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL, -- assigned_at + 24 hours
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, officer_id, expires_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_assignments_officer_id ON customer_assignments(officer_id);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_customer_id ON customer_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_expires_at ON customer_assignments(expires_at);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_is_active ON customer_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_active_officer ON customer_assignments(officer_id, is_active, expires_at) WHERE is_active = true;

-- Function to automatically set expires_at to 24 hours from assigned_at
CREATE OR REPLACE FUNCTION set_assignment_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at = NEW.assigned_at + INTERVAL '24 hours';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to set expiry date
CREATE TRIGGER set_customer_assignment_expiry
    BEFORE INSERT ON customer_assignments
    FOR EACH ROW
    EXECUTE FUNCTION set_assignment_expiry();

