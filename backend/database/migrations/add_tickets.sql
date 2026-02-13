-- Migration: Add Tickets System
-- Create table for user support tickets

CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    admin_response TEXT,
    admin_id INTEGER, -- Admin who responded
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (admin_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets (created_at DESC);
