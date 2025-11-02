-- BK Pulse Sample Data
-- Author: Steven SHYAKA
-- Date: 10/2025

-- Insert sample users (passwords are 'password123' hashed with bcrypt)
INSERT INTO users (email, password, name, role) VALUES
('officer1@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John MUGISHA', 'retentionOfficer'),
('officer2@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marie UWIMANA', 'retentionOfficer'),
('analyst1@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Peter KAYITARE', 'retentionAnalyst'),
('analyst2@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Grace MUKAMANA', 'retentionAnalyst'),
('manager1@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'David HABIMANA', 'retentionManager'),
('admin@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Steven SHYAKA', 'admin');

-- Insert sample customers
INSERT INTO customers (customer_id, name, email, phone, segment, branch, product_type, account_balance, churn_score, risk_level, assigned_officer_id) VALUES
('CUST001', 'Jean BAPTISTE', 'jean.baptiste@email.com', '+250788123456', 'retail', 'Kigali Main', 'Savings', 2500000.00, 85.5, 'high', 1),
('CUST002', 'Claire MUKAMANA', 'claire.mukamana@email.com', '+250788234567', 'retail', 'Nyarugenge', 'Current', 850000.00, 45.2, 'medium', 1),
('CUST003', 'Paul RUTAGANDA', 'paul.rutaganda@email.com', '+250788345678', 'retail', 'Kimisagara', 'Savings', 150000.00, 25.8, 'low', 2),
('CUST004', 'Ange UWERA', 'ange.uwera@email.com', '+250788456789', 'corporate', 'Kacyiru', 'Investment', 5000000.00, 92.3, 'high', 2),
('CUST005', 'Eric MUNYANEZA', 'eric.munyaneza@email.com', '+250788567890', 'sme', 'Remera', 'Current', 650000.00, 38.7, 'medium', 1),
('CUST006', 'Vestine NYIRAHABIMANA', 'vestine.nyirahabimana@email.com', '+250788678901', 'corporate', 'Kigali Main', 'Savings', 3200000.00, 78.9, 'high', 2),
('CUST007', 'Felix KAMANZI', 'felix.kamanzi@email.com', '+250788789012', 'retail', 'Kimisagara', 'Savings', 200000.00, 15.2, 'low', 1),
('CUST008', 'Immaculee MUKAMUSONI', 'immaculee.mukamusoni@email.com', '+250788890123', 'sme', 'Nyarugenge', 'Current', 450000.00, 42.1, 'medium', 2),
('CUST009', 'Rwanda Development Bank', 'contact@rdb.rw', '+250788901234', 'institutional_banking', 'Kigali Main', 'Treasury', 50000000.00, 65.4, 'medium', 1),
('CUST010', 'Kigali International Airport', 'finance@kia.rw', '+250788012345', 'institutional_banking', 'Kacyiru', 'Corporate Banking', 25000000.00, 45.8, 'low', 2);

-- Insert sample actions
INSERT INTO actions (customer_id, officer_id, action_type, description, status, priority, due_date) VALUES
(1, 1, 'Phone Call', 'Call customer to discuss account concerns and retention offers', 'pending', 'high', '2024-01-15'),
(2, 1, 'Email Follow-up', 'Send personalized email with product recommendations', 'in_progress', 'medium', '2024-01-16'),
(4, 2, 'Meeting', 'Schedule in-person meeting to discuss investment options', 'pending', 'high', '2024-01-17'),
(6, 2, 'Phone Call', 'Follow up on previous conversation about account upgrade', 'completed', 'high', '2024-01-14'),
(5, 1, 'Email Follow-up', 'Send information about new savings products', 'pending', 'low', '2024-01-20'),
(8, 2, 'Phone Call', 'Initial contact to understand customer needs', 'in_progress', 'medium', '2024-01-18');

-- Insert sample recommendations
INSERT INTO recommendations (customer_id, model_version, recommended_action, confidence_score, expected_impact, status) VALUES
(1, 'v2.1', 'Offer premium savings account with higher interest rate', 0.87, 'high', 'pending'),
(2, 'v2.1', 'Provide financial advisory consultation', 0.72, 'medium', 'pending'),
(4, 'v2.1', 'Recommend investment portfolio diversification', 0.91, 'high', 'approved'),
(6, 'v2.1', 'Offer loyalty rewards program membership', 0.68, 'medium', 'pending'),
(5, 'v2.1', 'Send educational content about financial planning', 0.55, 'low', 'pending'),
(8, 'v2.1', 'Schedule branch visit for personalized service', 0.74, 'medium', 'pending');

-- Insert sample model performance data
INSERT INTO model_performance (model_version, metric_name, metric_value, evaluation_date, segment) VALUES
('v2.1', 'accuracy', 0.942, '2024-01-01', 'retail'),
('v2.1', 'precision', 0.891, '2024-01-01', 'retail'),
('v2.1', 'recall', 0.876, '2024-01-01', 'retail'),
('v2.1', 'f1_score', 0.883, '2024-01-01', 'retail'),
('v2.1', 'accuracy', 0.918, '2024-01-01', 'sme'),
('v2.1', 'precision', 0.845, '2024-01-01', 'sme'),
('v2.1', 'recall', 0.823, '2024-01-01', 'sme'),
('v2.1', 'f1_score', 0.834, '2024-01-01', 'sme'),
('v2.1', 'accuracy', 0.901, '2024-01-01', 'corporate'),
('v2.1', 'precision', 0.812, '2024-01-01', 'corporate'),
('v2.1', 'recall', 0.798, '2024-01-01', 'corporate'),
('v2.1', 'f1_score', 0.805, '2024-01-01', 'corporate'),
('v2.1', 'accuracy', 0.925, '2024-01-01', 'institutional_banking'),
('v2.1', 'precision', 0.878, '2024-01-01', 'institutional_banking'),
('v2.1', 'recall', 0.865, '2024-01-01', 'institutional_banking'),
('v2.1', 'f1_score', 0.871, '2024-01-01', 'institutional_banking');

-- Insert sample retention notes (only if table exists)
INSERT INTO retention_notes (customer_id, officer_id, note, priority, follow_up_date, status, tags)
SELECT 
  c.id as customer_id,
  u.id as officer_id,
  notes.note,
  notes.priority,
  notes.follow_up_date::DATE,
  notes.status,
  notes.tags::TEXT[]
FROM (VALUES
  (1, 1, 'Customer expressed concerns about account fees. Discussed fee waiver options for next quarter.', 'high', CURRENT_DATE + INTERVAL '2 days', 'active', ARRAY['Call']),
  (2, 1, 'Followed up on previous conversation about savings products. Customer showed interest in premium account.', 'medium', CURRENT_DATE + INTERVAL '5 days', 'active', ARRAY['Call']),
  (4, 2, 'High-value customer requested meeting to discuss investment opportunities. Scheduled for next week.', 'high', CURRENT_DATE + INTERVAL '7 days', 'active', ARRAY['Meeting']),
  (1, 1, 'Sent personalized email with account analysis and recommendations. Waiting for response.', 'medium', NULL, 'active', ARRAY['Email']),
  (6, 2, 'Customer called regarding account upgrade inquiry. Provided detailed information about premium benefits.', 'medium', CURRENT_DATE + INTERVAL '3 days', 'active', ARRAY['Call']),
  (3, 2, 'Regular check-in call completed. Customer satisfied with current services. No immediate concerns.', 'low', CURRENT_DATE + INTERVAL '30 days', 'resolved', ARRAY['Call']),
  (5, 1, 'Follow-up required on fee waiver offer. Customer needs to review and respond.', 'medium', CURRENT_DATE + INTERVAL '1 day', 'active', ARRAY['Call']),
  (7, 1, 'Customer visited branch. Discussed mobile banking features and benefits.', 'low', NULL, 'resolved', ARRAY['Meeting'])
) AS notes(customer_num, officer_num, note, priority, follow_up_date, status, tags)
LEFT JOIN customers c ON c.id = notes.customer_num
LEFT JOIN users u ON u.id = notes.officer_num
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'retention_notes')
ON CONFLICT DO NOTHING;

-- Insert sample system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('churn_threshold_high', '75', 'Churn score threshold for high risk customers'),
('churn_threshold_medium', '50', 'Churn score threshold for medium risk customers'),
('model_retrain_frequency', '30', 'Days between model retraining'),
('notification_email', 'admin@bk.rw', 'Email for system notifications'),
('max_customers_per_officer', '50', 'Maximum customers assigned per retention officer'),
('data_retention_days', '2555', 'Days to retain customer data (7 years)');

