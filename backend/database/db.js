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
        
        console.log('Migrations completed');
    } catch (error) {
        console.error('Error running migrations:', error);
        // Don't throw - migrations might fail if already applied
    }
}

export default db;
