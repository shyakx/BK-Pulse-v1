-- Delete All Customers and Related Data
-- WARNING: This will delete ALL customer data!
-- 
-- This script deletes:
-- - All retention notes linked to customers
-- - All actions/tasks linked to customers
-- - All customer assignments
-- - All recommendations linked to customers
-- - All campaign targets (if table exists)
-- - All customers
--
-- Usage:
--   psql -h host -U user -d bk_pulse -f server/sql/delete_all_customers.sql
--   OR run in your database client

BEGIN;

-- Show current counts
SELECT 'Before deletion:' as status;
SELECT COUNT(*) as customer_count FROM customers;
SELECT COUNT(*) as assignment_count FROM customer_assignments;
SELECT COUNT(*) as action_count FROM actions WHERE customer_id IS NOT NULL;
SELECT COUNT(*) as note_count FROM retention_notes WHERE customer_id IS NOT NULL;

-- Delete related data first (respecting foreign key constraints)

-- 1. Delete retention notes
DELETE FROM retention_notes WHERE customer_id IS NOT NULL;

-- 2. Delete actions/tasks
DELETE FROM actions WHERE customer_id IS NOT NULL;

-- 3. Delete customer assignments
DELETE FROM customer_assignments;

-- 4. Delete recommendations
DELETE FROM recommendations WHERE customer_id IS NOT NULL;

-- 5. Delete campaign targets (if table exists)
-- Uncomment if you have this table:
-- DELETE FROM campaign_targets;

-- 6. Finally, delete all customers
DELETE FROM customers;

-- Show final counts
SELECT 'After deletion:' as status;
SELECT COUNT(*) as customer_count FROM customers;
SELECT COUNT(*) as assignment_count FROM customer_assignments;
SELECT COUNT(*) as action_count FROM actions WHERE customer_id IS NOT NULL;
SELECT COUNT(*) as note_count FROM retention_notes WHERE customer_id IS NOT NULL;

COMMIT;

-- Note: If you get foreign key constraint errors, you may need to:
-- 1. Check for other tables that reference customers
-- 2. Delete those records first
-- 3. Or temporarily disable foreign key checks (not recommended)

