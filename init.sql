-- =====================================================
-- AI Video Generator - Database Schema
-- Version: 1.0
-- =====================================================

-- Create database (run this separately if needed)
-- CREATE DATABASE IF NOT EXISTS ai_video_generator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE ai_video_generator;

-- =====================================================
-- TABLE: users
-- Stores user accounts and authentication data
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    credits INT DEFAULT 0,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255) NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expiry DATETIME NULL,
    api_key VARCHAR(255) NULL UNIQUE COMMENT 'Admin-assigned GeminiGen API key',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_api_key (api_key),
    INDEX idx_verification_token (verification_token),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: user_sessions
-- Stores JWT session tokens for authentication
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL COMMENT 'Hashed JWT token',
    refresh_token_hash VARCHAR(255) NULL COMMENT 'Hashed refresh token',
    user_agent TEXT NULL,
    ip_address VARCHAR(45) NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: plans
-- Credit pricing plans
-- =====================================================
CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    credits INT NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default pricing plans
INSERT INTO plans (name, price, credits, description) VALUES
('Free', 0.00, 20, 'Signup bonus - 20 free credits'),
('Basic Creator', 20.00, 1000, 'Perfect for getting started'),
('Pro Creator', 50.00, 3000, 'Best value for regular creators'),
('Max Plan', 100.00, 6500, 'For serious content creators'),
('Agency Plan', 300.00, 20000, 'For agencies and teams');

-- =====================================================
-- TABLE: credits_ledger
-- Transaction history for all credit changes
-- =====================================================
CREATE TABLE IF NOT EXISTS credits_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount INT NOT NULL COMMENT 'Positive for additions, negative for deductions',
    balance_after INT NOT NULL COMMENT 'User balance after this transaction',
    transaction_type ENUM(
        'signup_bonus',
        'purchase',
        'admin_topup',
        'admin_deduction',
        'image_generation',
        'video_generation',
        'refund'
    ) NOT NULL,
    reference_id VARCHAR(255) NULL COMMENT 'UUID or request reference',
    model_used VARCHAR(100) NULL COMMENT 'AI model used for generation',
    tool_type ENUM('youtube_story', 'script_to_video', 'text_to_video', 'text_to_image') NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_created_at (created_at),
    INDEX idx_reference_id (reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: credit_requests
-- User requests to purchase credits (manual approval)
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL COMMENT 'Payment amount',
    credits INT NOT NULL COMMENT 'Credits to be added',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    payment_proof TEXT NULL COMMENT 'URL or base64 of payment screenshot',
    user_notes TEXT NULL COMMENT 'Notes from user',
    admin_notes TEXT NULL COMMENT 'Notes from admin',
    approved_by INT NULL COMMENT 'Admin user ID who approved/rejected',
    processed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id),
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: generation_logs
-- Logs all AI generation requests (images, videos, text)
-- Single table for ALL tools (v2 + new tools)
-- =====================================================
CREATE TABLE IF NOT EXISTS generation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tool_type ENUM('youtube_story', 'script_to_video', 'text_to_video', 'text_to_image') NOT NULL,
    generation_type ENUM('image', 'video', 'text') NOT NULL,
    model VARCHAR(100) NOT NULL COMMENT 'AI model used',
    credits_charged INT NOT NULL COMMENT 'Credits we charged user (fixed cost)',
    actual_credits_used INT NULL COMMENT 'Actual API credits from webhook',
    request_uuid VARCHAR(255) NOT NULL COMMENT 'UUID for webhook matching',
    prompt TEXT NULL,
    result_url TEXT NULL COMMENT 'URL of generated media',
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT NULL,
    webhook_received BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_request_uuid (request_uuid),
    INDEX idx_user_id (user_id),
    INDEX idx_tool_type (tool_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: admin_actions
-- Audit log for admin activities
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type ENUM(
        'credit_topup',
        'credit_deduction',
        'approve_request',
        'reject_request',
        'assign_api_key',
        'verify_user',
        'delete_user',
        'update_user'
    ) NOT NULL,
    target_user_id INT NULL,
    details JSON NULL COMMENT 'Additional action details',
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: webhook_logs
-- Logs all incoming webhooks for debugging
-- Single endpoint handles ALL tools
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_uuid VARCHAR(255) NULL,
    event_name VARCHAR(100) NULL,
    payload JSON NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_request_uuid (request_uuid),
    INDEX idx_event_name (event_name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED: Admin User
-- Email: PillowPotion.com@gmail.com
-- Password: Ayesha786$
-- =====================================================

INSERT INTO users (email, password_hash, role, credits, email_verified, api_key) VALUES
(
    'pillowpotion.com@gmail.com',
    '$2y$10$8K1p/a0dL1LXMIgoEDFrOOemTNgdQ0.VPXqB3rlHXHfBYLGXU1N9u',
    'admin',
    999999,
    TRUE,
    NULL
);

-- =====================================================
-- VIEWS: Useful reporting views
-- =====================================================

-- View: User statistics
CREATE OR REPLACE VIEW view_user_stats AS
SELECT
    u.id,
    u.email,
    u.credits,
    u.created_at,
    COUNT(DISTINCT gl.id) as total_generations,
    SUM(CASE WHEN gl.generation_type = 'image' THEN 1 ELSE 0 END) as image_count,
    SUM(CASE WHEN gl.generation_type = 'video' THEN 1 ELSE 0 END) as video_count,
    COALESCE(SUM(ABS(cl.amount)), 0) as credits_used
FROM users u
LEFT JOIN generation_logs gl ON u.id = gl.user_id
LEFT JOIN credits_ledger cl ON u.id = cl.user_id AND cl.amount < 0
WHERE u.role = 'user'
GROUP BY u.id;

-- View: Admin dashboard summary
CREATE OR REPLACE VIEW view_admin_dashboard AS
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'user' AND email_verified = TRUE) as verified_users,
    (SELECT SUM(credits) FROM users WHERE role = 'user') as total_credits_balance,
    (SELECT COUNT(*) FROM credit_requests WHERE status = 'pending') as pending_requests,
    (SELECT COUNT(*) FROM generation_logs WHERE DATE(created_at) = CURDATE()) as generations_today,
    (SELECT SUM(credits_charged) FROM generation_logs WHERE DATE(created_at) = CURDATE()) as credits_used_today;

-- =====================================================
-- INDEXES: Additional performance indexes
-- =====================================================

-- For frequent queries
CREATE INDEX idx_users_role_verified ON users(role, email_verified);
CREATE INDEX idx_generation_logs_user_tool ON generation_logs(user_id, tool_type);
CREATE INDEX idx_credits_ledger_user_type ON credits_ledger(user_id, transaction_type);
