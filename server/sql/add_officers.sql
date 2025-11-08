-- Add 12 Retention Officers with Rwandan Names
-- Password for all: 'password123' (bcrypt hash)
-- Author: Steven SHYAKA
-- Date: 10/2025

-- Note: This script will add officers only if they don't already exist (using ON CONFLICT)
-- The password hash is for 'password123'

INSERT INTO users (email, password, name, role, is_active) VALUES
-- Existing officers (officer1 and officer2 already exist, so these will be skipped if they exist)
('officer1@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John MUGISHA', 'retentionOfficer', true),
('officer2@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marie UWIMANA', 'retentionOfficer', true),

-- Additional officers to make 12 total
('officer3@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jean Baptiste HABIMANA', 'retentionOfficer', true),
('officer4@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Claire MUKAMANA', 'retentionOfficer', true),
('officer5@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Paul RUTAGANDA', 'retentionOfficer', true),
('officer6@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ange UWERA', 'retentionOfficer', true),
('officer7@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Eric MUNYANEZA', 'retentionOfficer', true),
('officer8@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vestine NYIRAHABIMANA', 'retentionOfficer', true),
('officer9@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Felix KAMANZI', 'retentionOfficer', true),
('officer10@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Immaculee MUKAMUSONI', 'retentionOfficer', true),
('officer11@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'David NSABIMANA', 'retentionOfficer', true),
('officer12@bk.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Grace UWIMANA', 'retentionOfficer', true)

ON CONFLICT (email) DO NOTHING;

-- Verify the count
SELECT 
  COUNT(*) as total_officers,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_officers
FROM users 
WHERE role = 'retentionOfficer';

