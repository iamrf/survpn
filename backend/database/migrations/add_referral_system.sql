-- Migration: Add Referral System
-- Add referral tracking fields to users table (SQLite doesn't support IF NOT EXISTS for ALTER TABLE)
-- We check for column existence in the migration runner, but include the SQL here for reference

-- Create referral_commissions table to track commissions earned
CREATE TABLE IF NOT EXISTS referral_commissions (
    id TEXT PRIMARY KEY,
    referrer_id INTEGER NOT NULL,
    referred_user_id INTEGER NOT NULL,
    transaction_id TEXT,
    amount DECIMAL(18, 8) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    commission_amount DECIMAL(18, 8) NOT NULL,
    type TEXT DEFAULT 'transaction', -- 'transaction' or 'registration'
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    FOREIGN KEY (referrer_id) REFERENCES users (id),
    FOREIGN KEY (referred_user_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred ON referral_commissions (referred_user_id);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users (referred_by);

-- Add default configs for referral system
INSERT OR IGNORE INTO configs (key, value) VALUES ('referral_registration_bonus', '0.00');
INSERT OR IGNORE INTO configs (key, value) VALUES ('default_referral_commission_rate', '20.00');
