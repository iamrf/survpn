-- Migration: Add Admin Messages System
-- Create table for admin messages/announcements that can be targeted to specific user groups

CREATE TABLE IF NOT EXISTS admin_messages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'danger', 'success', 'status'
    target_audience TEXT NOT NULL DEFAULT 'all', -- 'all', 'subscribed', 'role', 'expiring_soon'
    target_role TEXT, -- Used when target_audience is 'role'
    target_days_before_expiry INTEGER, -- Used when target_audience is 'expiring_soon' (e.g., 7 for 7 days before)
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME -- Optional: message expiration date
);

CREATE INDEX IF NOT EXISTS idx_admin_messages_active ON admin_messages (is_active);
CREATE INDEX IF NOT EXISTS idx_admin_messages_target ON admin_messages (target_audience, is_active);
CREATE INDEX IF NOT EXISTS idx_admin_messages_order ON admin_messages (display_order);
