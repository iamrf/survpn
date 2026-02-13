-- Migration: Add Ticket Replies System
-- Create table for ticket conversation/replies

CREATE TABLE IF NOT EXISTS ticket_replies (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    user_id INTEGER, -- NULL for admin replies, user_id for user replies
    admin_id INTEGER, -- NULL for user replies, admin_id for admin replies
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (admin_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON ticket_replies (ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_created_at ON ticket_replies (created_at);
