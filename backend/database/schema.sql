CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT,
    username TEXT,
    language_code TEXT,
    photo_url TEXT,
    role TEXT DEFAULT 'user',
    balance DECIMAL(18, 8) DEFAULT 0,
    referral_code TEXT UNIQUE,
    phone_number TEXT,
    wallet_address TEXT,
    withdrawal_passkey TEXT,
    has_welcome_bonus BOOLEAN DEFAULT 0,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    currency TEXT NOT NULL,
    type TEXT DEFAULT 'deposit', -- 'deposit' or 'withdrawal'
    status TEXT DEFAULT 'pending',
    plisio_invoice_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    currency TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);

CREATE TABLE IF NOT EXISTS configs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT OR IGNORE INTO
    configs (key, value)
VALUES ('welcome_bonus_traffic', '5');

INSERT OR IGNORE INTO
    configs (key, value)
VALUES ('welcome_bonus_duration', '7');

CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    traffic INTEGER NOT NULL, -- in GB
    duration INTEGER NOT NULL, -- in days
    price DECIMAL(18, 8) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_active ON plans (is_active);
CREATE INDEX IF NOT EXISTS idx_plans_order ON plans (display_order);

-- Insert default plans
INSERT OR IGNORE INTO plans (id, name, traffic, duration, price, description, display_order) VALUES
    ('bronze', 'برنز (اقتصادی)', 10, 30, 2, 'مناسب برای وب‌گردی روزمره', 1),
    ('silver', 'نقره‌ای (استاندارد)', 50, 60, 7, 'پیشنهاد ویژه برای استفاده مداوم', 2),
    ('gold', 'طلایی (نامحدود*)', 200, 90, 15, 'برترین کیفیت بدون نگرانی از حجم', 3);