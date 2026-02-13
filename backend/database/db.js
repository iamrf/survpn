import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '../database.sqlite');
console.log(`Connecting to database at ${dbPath}`);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize database
export function initDB() {
    try {
        const schemaPath = join(__dirname, 'schema.sql');
        const schema = readFileSync(schemaPath, 'utf8');
        db.exec(schema);
        console.log('Database initialized successfully');
        
        // Run migrations
        runMigrations();
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Run database migrations
function runMigrations() {
    try {
        // Check if referral system migration is needed
        const tableInfo = db.prepare("PRAGMA table_info(users)").all();
        const hasReferredBy = tableInfo.some(col => col.name === 'referred_by');
        const hasReferralBonusRate = tableInfo.some(col => col.name === 'referral_bonus_rate');
        const hasReferralRegistrationBonus = tableInfo.some(col => col.name === 'referral_registration_bonus');
        
        if (!hasReferredBy || !hasReferralBonusRate || !hasReferralRegistrationBonus) {
            console.log('Running referral system migration...');
            
            // Add columns if they don't exist
            if (!hasReferredBy) {
                try {
                    db.exec('ALTER TABLE users ADD COLUMN referred_by INTEGER');
                    console.log('Added referred_by column');
                } catch (e) {
                    console.log('referred_by column may already exist');
                }
            }
            
            if (!hasReferralBonusRate) {
                try {
                    db.exec('ALTER TABLE users ADD COLUMN referral_bonus_rate DECIMAL(5, 2) DEFAULT 10.00');
                    console.log('Added referral_bonus_rate column');
                } catch (e) {
                    console.log('referral_bonus_rate column may already exist');
                }
            }
            
            if (!hasReferralRegistrationBonus) {
                try {
                    db.exec('ALTER TABLE users ADD COLUMN referral_registration_bonus DECIMAL(18, 8) DEFAULT 0');
                    console.log('Added referral_registration_bonus column');
                } catch (e) {
                    console.log('referral_registration_bonus column may already exist');
                }
            }
            
            // Create index for referred_by
            try {
                db.exec('CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users (referred_by)');
            } catch (e) {
                // Index might already exist
            }
        }
        
        // Check if referral_commissions table exists
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='referral_commissions'").get();
        if (!tables) {
            console.log('Creating referral_commissions table...');
            db.exec(`
                CREATE TABLE IF NOT EXISTS referral_commissions (
                    id TEXT PRIMARY KEY,
                    referrer_id INTEGER NOT NULL,
                    referred_user_id INTEGER NOT NULL,
                    transaction_id TEXT,
                    amount DECIMAL(18, 8) NOT NULL,
                    commission_rate DECIMAL(5, 2) NOT NULL,
                    commission_amount DECIMAL(18, 8) NOT NULL,
                    type TEXT DEFAULT 'transaction',
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    paid_at DATETIME,
                    FOREIGN KEY (referrer_id) REFERENCES users (id),
                    FOREIGN KEY (referred_user_id) REFERENCES users (id)
                );
                CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON referral_commissions (referrer_id);
                CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred ON referral_commissions (referred_user_id);
            `);
            console.log('referral_commissions table created');
        }
        
        // Add default configs for referral system
        try {
            db.exec(`
                INSERT OR IGNORE INTO configs (key, value) VALUES ('referral_registration_bonus', '1.00');
                INSERT OR IGNORE INTO configs (key, value) VALUES ('default_referral_commission_rate', '10.00');
            `);
        } catch (e) {
            // Configs might already exist
        }
        
        // Add default configs for custom subscription pricing
        try {
            db.exec(`
                INSERT OR IGNORE INTO configs (key, value) VALUES ('custom_subscription_traffic_price', '0.07');
                INSERT OR IGNORE INTO configs (key, value) VALUES ('custom_subscription_duration_price', '0.03');
            `);
        } catch (e) {
            // Configs might already exist
        }
        
        // Add default config for Telegram Stars per USD
        try {
            db.exec(`
                INSERT OR IGNORE INTO configs (key, value) VALUES ('telegram_stars_per_usd', '100');
            `);
        } catch (e) {
            // Config might already exist
        }
        
        // Check if plan offers migration is needed
        const plansTableInfo = db.prepare("PRAGMA table_info(plans)").all();
        const hasOriginalPrice = plansTableInfo.some(col => col.name === 'original_price');
        const hasOfferPrice = plansTableInfo.some(col => col.name === 'offer_price');
        
        if (!hasOriginalPrice || !hasOfferPrice) {
            console.log('Running plan offers migration...');
            
            if (!hasOriginalPrice) {
                try {
                    db.exec('ALTER TABLE plans ADD COLUMN original_price DECIMAL(18, 8)');
                    console.log('Added original_price column');
                } catch (e) {
                    console.log('original_price column may already exist');
                }
            }
            
            if (!hasOfferPrice) {
                try {
                    db.exec('ALTER TABLE plans ADD COLUMN offer_price DECIMAL(18, 8)');
                    console.log('Added offer_price column');
                } catch (e) {
                    console.log('offer_price column may already exist');
                }
            }
            
            // Set default values: use current price as both original and offer if not set
            try {
                db.exec('UPDATE plans SET original_price = price WHERE original_price IS NULL');
                db.exec('UPDATE plans SET offer_price = price WHERE offer_price IS NULL');
            } catch (e) {
                // May fail if columns don't exist yet
            }
        }
        
        // Check if admin_messages table exists
        const adminMessagesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_messages'").get();
        if (!adminMessagesTable) {
            console.log('Creating admin_messages table...');
            db.exec(`
                CREATE TABLE IF NOT EXISTS admin_messages (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    type TEXT NOT NULL DEFAULT 'info',
                    target_audience TEXT NOT NULL DEFAULT 'all',
                    target_role TEXT,
                    target_days_before_expiry INTEGER,
                    is_active BOOLEAN DEFAULT 1,
                    display_order INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME
                );
                CREATE INDEX IF NOT EXISTS idx_admin_messages_active ON admin_messages (is_active);
                CREATE INDEX IF NOT EXISTS idx_admin_messages_target ON admin_messages (target_audience, is_active);
                CREATE INDEX IF NOT EXISTS idx_admin_messages_order ON admin_messages (display_order);
            `);
            console.log('admin_messages table created');
        }
        
        // Check if tickets table exists
        const ticketsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tickets'").get();
        if (!ticketsTable) {
            console.log('Creating tickets table...');
            db.exec(`
                CREATE TABLE IF NOT EXISTS tickets (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    subject TEXT NOT NULL,
                    message TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'open',
                    priority TEXT DEFAULT 'normal',
                    admin_response TEXT,
                    admin_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    resolved_at DATETIME,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (admin_id) REFERENCES users (id)
                );
                CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets (user_id);
                CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
                CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets (created_at DESC);
            `);
            console.log('tickets table created');
        }
        
        // Check if ticket_replies table exists
        const ticketRepliesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ticket_replies'").get();
        if (!ticketRepliesTable) {
            console.log('Creating ticket_replies table...');
            db.exec(`
                CREATE TABLE IF NOT EXISTS ticket_replies (
                    id TEXT PRIMARY KEY,
                    ticket_id TEXT NOT NULL,
                    user_id INTEGER,
                    admin_id INTEGER,
                    message TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (admin_id) REFERENCES users (id)
                );
                CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON ticket_replies (ticket_id);
                CREATE INDEX IF NOT EXISTS idx_ticket_replies_created_at ON ticket_replies (created_at);
            `);
            console.log('ticket_replies table created');
        }
        
        console.log('Migrations completed');
    } catch (error) {
        console.error('Error running migrations:', error);
        // Don't throw - migrations might fail if already applied
    }
}

export default db;
