-- Default admin user (password: admin123 - CHANGE IN PRODUCTION)
-- Hash generated with bcrypt rounds=10 for password 'admin123'
INSERT INTO users (username, password_hash, role) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
('inspector1', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'inspector')
ON CONFLICT (username) DO NOTHING;

-- Default model
INSERT INTO models (name, version, checksum, config, is_active) VALUES
('cone-tip-classifier', 'v1.0.0', 'placeholder-checksum', '{"type": "local", "runtime": "yolo"}', true)
ON CONFLICT (name, version) DO NOTHING;
