import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import axios from 'axios';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db, { initDB } from './database/db.js';
import { marzban } from './marzban.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize Database
initDB();

// Basic root route
app.get('/', (req, res) => {
    res.json({ message: 'Persian Mini App Backend is running', documentation: '/health' });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate unique referral code (5 alphanumeric characters: A-Z and 0-9)
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        code += chars[randomIndex];
    }
    return code;
}

function getUniqueReferralCode() {
    let code;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 20) {
        code = generateReferralCode();
        const existing = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(code);
        if (!existing) {
            isUnique = true;
        }
        attempts++;
    }
    return code;
}

// Get user by referral code (case-insensitive)
function getUserByReferralCode(code) {
    if (!code || typeof code !== 'string') {
        console.log('[REFERRAL] Invalid referral code format:', code);
        return null;
    }
    // Convert to uppercase for consistency (referral codes are stored in uppercase)
    const upperCode = code.toUpperCase().trim();
    console.log('[REFERRAL] Looking up referral code:', upperCode);
    const result = db.prepare('SELECT id, referral_bonus_rate, referral_registration_bonus FROM users WHERE UPPER(referral_code) = ?').get(upperCode);
    console.log('[REFERRAL] Lookup result:', result ? `Found user ${result.id}` : 'Not found');
    return result;
}

// Update Wallet Address
app.post('/api/user/wallet', (req, res) => {
    const { id, wallet_address } = req.body;
    if (!id || !wallet_address) {
        return res.status(400).json({ error: 'User ID and wallet address are required' });
    }
    try {
        db.prepare('UPDATE users SET wallet_address = ? WHERE id = ?').run(wallet_address, id);
        res.json({ success: true, message: 'Wallet address updated successfully' });
    } catch (error) {
        console.error('Error updating wallet:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update Withdrawal Passkey
app.post('/api/user/passkey', (req, res) => {
    const { id, passkey } = req.body;
    if (!id || !passkey) {
        return res.status(400).json({ error: 'User ID and passkey are required' });
    }
    try {
        // In a real app, we should hash this
        db.prepare('UPDATE users SET withdrawal_passkey = ? WHERE id = ?').run(passkey, id);
        res.json({ success: true, message: 'Withdrawal passkey updated successfully' });
    } catch (error) {
        console.error('Error updating passkey:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update User Language
app.post('/api/user/language', (req, res) => {
    const { id, language_code } = req.body;
    if (!id || !language_code) {
        return res.status(400).json({ error: 'User ID and language code are required' });
    }
    try {
        db.prepare('UPDATE users SET language_code = ? WHERE id = ?').run(language_code, id);
        res.json({ success: true, message: 'Language updated successfully' });
    } catch (error) {
        console.error('Error updating language:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sync User Data
app.post('/api/sync-user', async (req, res) => {
    const { id, first_name, last_name, username, language_code, photo_url, phone_number, referral_code } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const adminIds = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim());
    const role = adminIds.includes(id.toString()) ? 'admin' : 'user';

    try {
        // Check if user exists
        const existingUser = db.prepare('SELECT id, referred_by, referral_code FROM users WHERE id = ?').get(id);
        const isNewUser = !existingUser;

        // Handle referral code if provided and user is new
        let referredBy = null;
        let registrationBonus = 0;
        if (isNewUser && referral_code) {
            console.log(`[REFERRAL] New user ${id} registering with referral code: ${referral_code}`);
            const referrer = getUserByReferralCode(referral_code);
            console.log(`[REFERRAL] Referrer lookup result:`, referrer);
            if (referrer && referrer.id !== id) {
                referredBy = referrer.id;
                // Get registration bonus amount from referrer's settings or default config
                const defaultBonus = db.prepare("SELECT value FROM configs WHERE key = 'referral_registration_bonus'").get();
                registrationBonus = referrer.referral_registration_bonus || parseFloat(defaultBonus?.value || '1.00');
                console.log(`[REFERRAL] User ${id} referred by ${referredBy}, bonus: $${registrationBonus}`);
            } else {
                console.log(`[REFERRAL] Invalid referral code or self-referral attempt`);
            }
        } else if (isNewUser && !referral_code) {
            console.log(`[REFERRAL] New user ${id} registering without referral code`);
        }

        const defaultCommissionRate = db.prepare("SELECT value FROM configs WHERE key = 'default_referral_commission_rate'").get();
        const commissionRate = parseFloat(defaultCommissionRate?.value || '10.00');

        const stmt = db.prepare(`
            INSERT INTO users (id, first_name, last_name, username, language_code, photo_url, role, phone_number, last_seen, referred_by, referral_bonus_rate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                first_name = excluded.first_name,
                last_name = excluded.last_name,
                username = excluded.username,
                language_code = excluded.language_code,
                photo_url = excluded.photo_url,
                role = excluded.role,
                phone_number = CASE 
                    WHEN excluded.phone_number IS NOT NULL AND excluded.phone_number != '' 
                    THEN excluded.phone_number 
                    ELSE users.phone_number 
                END,
                last_seen = CURRENT_TIMESTAMP,
                referred_by = COALESCE(users.referred_by, excluded.referred_by)
        `);

        stmt.run(id, first_name, last_name || null, username || null, language_code || null, photo_url || null, role, phone_number || null, referredBy, commissionRate);

        let user = db.prepare('SELECT balance, referral_code, phone_number, created_at, last_seen, language_code, wallet_address, withdrawal_passkey, has_welcome_bonus, referred_by, referral_bonus_rate, referral_registration_bonus FROM users WHERE id = ?').get(id);

        // Handle referral registration bonus for new users
        if (isNewUser && referredBy && registrationBonus > 0) {
            try {
                // Give bonus to referrer
                db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(registrationBonus, referredBy);
                
                // Record commission
                const commissionId = `ref_reg_${Date.now()}_${referredBy}_${id}`;
                db.prepare(`
                    INSERT INTO referral_commissions (id, referrer_id, referred_user_id, amount, commission_rate, commission_amount, type, status)
                    VALUES (?, ?, ?, ?, 100.00, ?, 'registration', 'paid')
                `).run(commissionId, referredBy, id, registrationBonus, registrationBonus);
                
                console.log(`Referral bonus: User ${referredBy} earned $${registrationBonus} for referring user ${id}`);
            } catch (refErr) {
                console.error('Error processing referral bonus:', refErr);
            }
        }

        if (!user.referral_code) {
            const newCode = getUniqueReferralCode();
            db.prepare('UPDATE users SET referral_code = ? WHERE id = ?').run(newCode, id);
            user.referral_code = newCode;
        }

        // Marzban User Integration
        const marzbanUsername = username || `user_${id}`;
        let subscriptionUrl = '';
        let dataLimit = 0;
        let dataUsed = 0;
        let mUser = null;

        try {
            mUser = await marzban.getUser(marzbanUsername);

            // Welcome Bonus Logic
            let welcomeTraffic = 5; // Default 5GB
            let welcomeDuration = 7; // Default 7 days

            const confTraffic = db.prepare("SELECT value FROM configs WHERE key = 'welcome_bonus_traffic'").get();
            if (confTraffic) welcomeTraffic = Number(confTraffic.value);

            const confDuration = db.prepare("SELECT value FROM configs WHERE key = 'welcome_bonus_duration'").get();
            if (confDuration) welcomeDuration = Number(confDuration.value);

            const WELCOME_BONUS = welcomeTraffic * 1024 * 1024 * 1024;
            const WELCOME_EXPIRE = Math.floor(Date.now() / 1000) + (welcomeDuration * 24 * 60 * 60);

            // Welcome bonus only for new users on signup who haven't received it yet
            if (isNewUser && !mUser && user.has_welcome_bonus === 0) {
                console.log(`Creating Marzban user with ${welcomeTraffic}GB and ${welcomeDuration} days Welcome Bonus for new user: ${marzbanUsername}`);
                mUser = await marzban.createUser(marzbanUsername, WELCOME_BONUS, WELCOME_EXPIRE);
                db.prepare('UPDATE users SET has_welcome_bonus = 1 WHERE id = ?').run(id);
            } else if (mUser) {
                // For existing users, just fetch their current data
                console.log(`Fetching existing Marzban user data: ${marzbanUsername}`);
            } else if (user.has_welcome_bonus === 1) {
                // User already received welcome bonus, don't grant again
                console.log(`User ${marzbanUsername} already received welcome bonus, skipping`);
            }

            subscriptionUrl = mUser?.subscription_url || '';
            dataLimit = mUser?.data_limit || 0;
            dataUsed = mUser?.used_traffic || 0;
        } catch (mErr) {
            console.error(`Error syncing with Marzban for ${marzbanUsername}:`, mErr.message);
        }

        console.log(`User ${id} synced. Role: ${role}, Bonus: ${user.has_welcome_bonus}, Link: ${subscriptionUrl}`);
        res.json({
            success: true,
            message: 'User synchronized successfully',
            isAdmin: role === 'admin',
            balance: user?.balance || 0,
            referralCode: user?.referral_code,
            phoneNumber: user?.phone_number,
            createdAt: user?.created_at,
            lastSeen: user?.last_seen,
            subscriptionUrl,
            dataLimit,
            dataUsed,
            expire: mUser?.expire,
            status: mUser?.status,
            username: marzbanUsername,
            languageCode: user?.language_code,
            walletAddress: user?.wallet_address,
            hasPasskey: !!user?.withdrawal_passkey
        });
    } catch (error) {
        console.error('Error syncing user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Check Admin Status
app.get('/api/check-admin/:id', (req, res) => {
    const { id } = req.params;

    try {
        const user = db.prepare('SELECT role FROM users WHERE id = ?').get(id);
        res.json({ isAdmin: !!(user && user.role === 'admin') });
    } catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get All Users
app.get('/api/admin/users', (req, res) => {
    try {
        const users = db.prepare('SELECT * FROM users ORDER BY last_seen DESC').all();
        console.log(`Fetched ${users.length} users for admin panel`);
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users for admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get Single User Detail
app.get('/api/admin/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch Marzban user data
        const marzbanUsername = user.username || `user_${id}`;
        let marzbanData = null;
        try {
            const mUser = await marzban.getUser(marzbanUsername);
            if (mUser) {
                marzbanData = {
                    username: marzbanUsername,
                    status: mUser.status || 'unknown',
                    dataLimit: mUser.data_limit || 0,
                    dataUsed: mUser.used_traffic || 0,
                    expire: mUser.expire || null,
                    subscriptionUrl: mUser.subscription_url || '',
                    onlineAt: mUser.online_at || null,
                    lastSeen: mUser.online_at || null, // Marzban uses online_at for last seen
                    proxies: mUser.proxies || {},
                    inbounds: mUser.inbounds || {}
                };
            }
        } catch (mErr) {
            console.error(`Error fetching Marzban data for ${marzbanUsername}:`, mErr.message);
            // Continue without Marzban data if it fails
        }

        res.json({ 
            success: true, 
            user: {
                ...user,
                marzban: marzbanData
            }
        });
    } catch (error) {
        console.error('Error fetching user detail for admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Update User Balance
app.post('/api/admin/user/:id/balance', (req, res) => {
    const { id } = req.params;
    const { amount, type } = req.body; // type: 'set', 'add', 'subtract'

    if (amount === undefined || isNaN(amount)) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    try {
        let sql = '';
        if (type === 'add') {
            sql = 'UPDATE users SET balance = balance + ? WHERE id = ?';
        } else if (type === 'subtract') {
            sql = 'UPDATE users SET balance = balance - ? WHERE id = ?';
        } else {
            sql = 'UPDATE users SET balance = ? WHERE id = ?';
        }

        db.prepare(sql).run(amount, id);

        // Log this as a manual adjustment in transactions? 
        // Maybe later. For now just update.

        res.json({ success: true, message: 'Balance updated successfully' });
    } catch (error) {
        console.error('Error updating balance for admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Update User Security (Wallet & Passkey)
app.post('/api/admin/user/:id/security', (req, res) => {
    const { id } = req.params;
    const { wallet_address, withdrawal_passkey } = req.body;

    try {
        db.prepare('UPDATE users SET wallet_address = ?, withdrawal_passkey = ? WHERE id = ?')
            .run(wallet_address, withdrawal_passkey, id);
        res.json({ success: true, message: 'Security details updated successfully' });
    } catch (error) {
        console.error('Error updating security details for admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Update User Referral Settings
app.post('/api/admin/user/:id/referral', (req, res) => {
    const { id } = req.params;
    const { referral_bonus_rate, referral_registration_bonus, referral_code } = req.body;

    try {
        const updates = [];
        const values = [];

        if (referral_bonus_rate !== undefined) {
            updates.push('referral_bonus_rate = ?');
            values.push(referral_bonus_rate);
        }
        if (referral_registration_bonus !== undefined) {
            updates.push('referral_registration_bonus = ?');
            values.push(referral_registration_bonus);
        }
        if (referral_code !== undefined && referral_code !== null && referral_code !== '') {
            // Validate referral code format (5 alphanumeric characters)
            const codeRegex = /^[A-Z0-9]{5}$/;
            if (!codeRegex.test(referral_code)) {
                return res.status(400).json({ error: 'Referral code must be exactly 5 alphanumeric characters (A-Z, 0-9)' });
            }
            
            // Check if code is already used by another user
            const existingUser = db.prepare('SELECT id FROM users WHERE referral_code = ? AND id != ?').get(referral_code, id);
            if (existingUser) {
                return res.status(400).json({ error: 'This referral code is already in use by another user' });
            }
            
            updates.push('referral_code = ?');
            values.push(referral_code);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        res.json({ success: true, message: 'Referral settings updated successfully' });
    } catch (error) {
        console.error('Error updating referral settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get User Referral Stats
app.get('/api/user/:id/referral-stats', (req, res) => {
    const { id } = req.params;
    try {
        console.log(`[REFERRAL STATS] Fetching stats for user ${id}`);
        
        // Count referrals
        const referralCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE referred_by = ?').get(id);
        console.log(`[REFERRAL STATS] Referral count: ${referralCount?.count || 0}`);
        
        // Total commissions earned
        const totalCommissions = db.prepare(`
            SELECT SUM(commission_amount) as total 
            FROM referral_commissions 
            WHERE referrer_id = ? AND status = 'paid'
        `).get(id);
        console.log(`[REFERRAL STATS] Total commissions: ${totalCommissions?.total || 0}`);
        
        // Recent commissions
        const recentCommissions = db.prepare(`
            SELECT * FROM referral_commissions 
            WHERE referrer_id = ? 
            ORDER BY created_at DESC 
            LIMIT 10
        `).all(id);
        console.log(`[REFERRAL STATS] Recent commissions: ${recentCommissions.length}`);

        // List of referred users with their details
        const referredUsers = db.prepare(`
            SELECT 
                id,
                first_name,
                last_name,
                username,
                created_at,
                balance,
                phone_number
            FROM users 
            WHERE referred_by = ? 
            ORDER BY created_at DESC
        `).all(id);
        console.log(`[REFERRAL STATS] Referred users found: ${referredUsers.length}`);

        // Get commission count per referred user
        const referredUsersWithStats = referredUsers.map(user => {
            const userCommissions = db.prepare(`
                SELECT 
                    COUNT(*) as transaction_count,
                    SUM(commission_amount) as total_earned
                FROM referral_commissions 
                WHERE referrer_id = ? AND referred_user_id = ? AND status = 'paid'
            `).get(id, user.id);
            
            return {
                ...user,
                transactionCount: userCommissions?.transaction_count || 0,
                totalEarned: parseFloat(userCommissions?.total_earned || 0)
            };
        });

        const response = {
            success: true,
            stats: {
                referralCount: referralCount?.count || 0,
                totalCommissions: totalCommissions?.total || 0,
                recentCommissions,
                referredUsers: referredUsersWithStats
            }
        };
        console.log(`[REFERRAL STATS] Response for user ${id}:`, {
            referralCount: response.stats.referralCount,
            totalCommissions: response.stats.totalCommissions,
            recentCommissionsCount: response.stats.recentCommissions.length,
            referredUsersCount: response.stats.referredUsers.length
        });
        res.json(response);
    } catch (error) {
        console.error('Error fetching referral stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Update Withdrawal Status
app.post('/api/admin/withdraw/status', (req, res) => {
    const { id, status } = req.body; // id is withdrawalId, status is 'completed' or 'failed'

    if (!id || !['completed', 'failed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
        const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(id);
        if (!withdrawal) {
            return res.status(404).json({ error: 'Withdrawal request not found' });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending requests can be updated' });
        }

        db.transaction(() => {
            db.prepare('UPDATE withdrawals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(status, id);

            // If rejected, refund the balance
            if (status === 'failed') {
                db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?')
                    .run(withdrawal.amount, withdrawal.user_id);
            }
        })();

        res.json({ success: true, message: `Withdrawal ${status === 'completed' ? 'approved' : 'rejected'} successfully` });
    } catch (error) {
        console.error('Error updating withdrawal status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get user finance summary
app.get('/api/admin/user/:userId/finance-summary', (req, res) => {
    const { userId } = req.params;
    try {
        // Total Deposits
        const totalDeposits = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND status = 'completed' AND type = 'deposit'").get(userId).total || 0;

        // Total Withdrawals
        const totalWithdrawals = db.prepare("SELECT SUM(amount) as total FROM withdrawals WHERE user_id = ? AND status = 'completed'").get(userId).total || 0;

        // Last Successful Deposit
        const lastDeposit = db.prepare("SELECT amount, created_at FROM transactions WHERE user_id = ? AND status = 'completed' AND type = 'deposit' ORDER BY created_at DESC LIMIT 1").get(userId);

        // Last Successful Withdrawal
        const lastWithdrawal = db.prepare("SELECT amount, created_at FROM withdrawals WHERE user_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1").get(userId);

        res.json({
            success: true,
            summary: {
                totalDeposits,
                totalWithdrawals,
                lastDeposit,
                lastWithdrawal
            }
        });
    } catch (error) {
        console.error('Error fetching user finance summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get all withdrawal requests
app.get('/api/admin/withdrawals', (req, res) => {
    try {
        const sql = `
            SELECT w.*, u.first_name, u.last_name, u.username
            FROM withdrawals w
            JOIN users u ON w.user_id = u.id
            ORDER BY 
                CASE WHEN w.status = 'pending' THEN 0 ELSE 1 END,
                w.created_at DESC
        `;
        const withdrawals = db.prepare(sql).all();
        console.log(`Fetched ${withdrawals.length} withdrawals for admin panel`);
        res.json({ success: true, withdrawals });
    } catch (error) {
        console.error('Error fetching withdrawals for admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get total successful deposits
app.get('/api/admin/stats/total-deposits', (req, res) => {
    try {
        const result = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE status = 'completed' AND type = 'deposit'").get();
        const total = result.total || 0;
        res.json({ success: true, total });
    } catch (error) {
        console.error('Error calculating total deposits:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get Configs
app.get('/api/admin/configs', (req, res) => {
    try {
        const configs = db.prepare('SELECT * FROM configs').all();
        const configMap = {};
        configs.forEach(c => configMap[c.key] = c.value);
        res.json({ success: true, configs: configMap });
    } catch (error) {
        console.error('Error fetching configs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Update Configs
app.post('/api/admin/configs', (req, res) => {
    const { key, value } = req.body;
    if (!key || value === undefined) {
        return res.status(400).json({ error: 'Key and value are required' });
    }

    try {
        db.prepare('INSERT INTO configs (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value));
        res.json({ success: true, message: 'Config updated successfully' });
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get All Plans (including inactive)
app.get('/api/admin/plans', (req, res) => {
    try {
        const plans = db.prepare('SELECT * FROM plans ORDER BY display_order ASC, created_at DESC').all();
        res.json({ success: true, plans });
    } catch (error) {
        console.error('Error fetching plans for admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get Single Plan
app.get('/api/admin/plans/:id', (req, res) => {
    const { id } = req.params;
    try {
        const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        res.json({ success: true, plan });
    } catch (error) {
        console.error('Error fetching plan for admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Create Plan
app.post('/api/admin/plans', (req, res) => {
    const { id, name, traffic, duration, price, description, is_active, display_order } = req.body;

    if (!id || !name || traffic === undefined || duration === undefined || price === undefined) {
        return res.status(400).json({ error: 'ID, name, traffic, duration, and price are required' });
    }

    try {
        db.prepare(`
            INSERT INTO plans (id, name, traffic, duration, price, description, is_active, display_order, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
            id,
            name,
            traffic,
            duration,
            price,
            description || null,
            is_active !== undefined ? (is_active ? 1 : 0) : 1,
            display_order || 0
        );
        res.json({ success: true, message: 'Plan created successfully' });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Plan ID already exists' });
        }
        console.error('Error creating plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Update Plan
app.put('/api/admin/plans/:id', (req, res) => {
    const { id } = req.params;
    const { name, traffic, duration, price, description, is_active, display_order } = req.body;

    try {
        const existingPlan = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
        if (!existingPlan) {
            return res.status(404).json({ error: 'Plan not found' });
        }

        // Build update query dynamically based on provided fields
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (traffic !== undefined) {
            updates.push('traffic = ?');
            values.push(traffic);
        }
        if (duration !== undefined) {
            updates.push('duration = ?');
            values.push(duration);
        }
        if (price !== undefined) {
            updates.push('price = ?');
            values.push(price);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active ? 1 : 0);
        }
        if (display_order !== undefined) {
            updates.push('display_order = ?');
            values.push(display_order);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        db.prepare(`
            UPDATE plans 
            SET ${updates.join(', ')}
            WHERE id = ?
        `).run(...values);

        res.json({ success: true, message: 'Plan updated successfully' });
    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Delete Plan
app.delete('/api/admin/plans/:id', (req, res) => {
    const { id } = req.params;
    try {
        const result = db.prepare('DELETE FROM plans WHERE id = ?').run(id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        res.json({ success: true, message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create Payment Invoice
app.post('/api/payment/create', async (req, res) => {
    const { userId, amount, currency = 'USD', paymentMethod = 'plisio' } = req.body;

    if (!userId || !amount) {
        return res.status(400).json({ error: 'User ID and amount are required' });
    }

    try {
        const orderId = `${Date.now()}`.slice(-10); // Shorter order number

        if (paymentMethod === 'telegram_stars') {
            // Telegram Stars payment
            // Get Stars per USD from configs (default: 100 Stars per USD)
            const starsConfig = db.prepare("SELECT value FROM configs WHERE key = 'telegram_stars_per_usd'").get();
            const starsPerUSD = parseFloat(starsConfig?.value || process.env.TELEGRAM_STARS_PER_USD || '100');
            const starsAmount = Math.ceil(amount * starsPerUSD);
            const botToken = process.env.BOT_TOKEN;

            if (!botToken) {
                return res.status(500).json({ error: 'Bot token not configured' });
            }

            // Save transaction with pending status
            try {
                db.prepare(`
                    INSERT INTO transactions (id, user_id, amount, currency, status, type, payment_method)
                    VALUES (?, ?, ?, ?, ?, 'deposit', 'telegram_stars')
                `).run(orderId, userId, amount, currency, 'pending');
            } catch (dbError) {
                // If payment_method column doesn't exist, try without it
                db.prepare(`
                    INSERT INTO transactions (id, user_id, amount, currency, status, type)
                    VALUES (?, ?, ?, ?, ?, 'deposit')
                `).run(orderId, userId, amount, currency, 'pending');
            }

            // Create invoice link using Telegram Bot API
            const callbackUrl = process.env.BACKEND_URL
                ? `${process.env.BACKEND_URL}/api/payment/telegram-stars-callback`
                : null;

            try {
                // Use createInvoiceLink method for Telegram Stars
                const invoiceResponse = await axios.post(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
                    title: `Top Up ${amount} USD`,
                    description: `Account top-up for user ${userId}`,
                    payload: orderId,
                    provider_token: '', // Empty for Stars
                    currency: 'XTR', // Telegram Stars currency code
                    prices: [{
                        label: `${amount} USD`,
                        amount: starsAmount * 100 // Amount in smallest currency unit (cents for Stars)
                    }],
                    ...(callbackUrl && { provider_data: JSON.stringify({ callback_url: callbackUrl }) })
                });

                if (invoiceResponse.data.ok && invoiceResponse.data.result) {
                    res.json({ 
                        success: true, 
                        payment_method: 'telegram_stars',
                        invoice_url: invoiceResponse.data.result,
                        stars_amount: starsAmount,
                        order_id: orderId,
                        amount: amount
                    });
                } else {
                    throw new Error(invoiceResponse.data.description || 'Failed to create invoice');
                }
            } catch (invoiceError) {
                console.error('Error creating Telegram Stars invoice:', invoiceError.response?.data || invoiceError.message);
                // Return error but still save transaction for manual processing
                res.status(500).json({ 
                    error: 'Failed to create Telegram Stars invoice',
                    details: invoiceError.response?.data?.description || invoiceError.message
                });
            }
        } else {
            // Plisio crypto payment
        const plisioApiKey = (process.env.PLISIO_API_KEY || '').trim();

        // Use ngrok URL if available, otherwise null
        const callbackUrl = process.env.BACKEND_URL
            ? `${process.env.BACKEND_URL}/api/payment/callback`
            : null;

        const params = {
            api_key: plisioApiKey,
            order_name: `TopUp${userId}`,
            order_number: orderId,
            source_currency: currency,
            source_amount: Number(amount), // Send as number
            callback_url: callbackUrl
        };

        console.log('Attempting Plisio Invoice:', JSON.stringify(params, null, 2));

        const response = await axios.get('https://api.plisio.net/api/v1/invoices/new', {
            params,
            timeout: 30000 // 30s timeout
        });

        if (response.data.status === 'error') {
            const errorMsg = response.data.data?.message || JSON.stringify(response.data.data) || 'Plisio error';
            throw new Error(errorMsg);
        }

        const invoice = response.data.data;

        // Plisio returns multiple IDs: txn_id (invoice ID), id (internal ID), etc.
        // We need to store the txn_id which is used for lookups
        const plisioInvoiceId = invoice.txn_id || invoice.id;
        
        console.log('Plisio invoice response:', JSON.stringify(invoice, null, 2));
        console.log('Storing Plisio invoice ID:', plisioInvoiceId, 'for transaction:', orderId);

        // Save transaction
            try {
                db.prepare(`
                    INSERT INTO transactions (id, user_id, amount, currency, status, plisio_invoice_id, type, payment_method)
                    VALUES (?, ?, ?, ?, ?, ?, 'deposit', 'plisio')
                `).run(orderId, userId, amount, currency, 'pending', plisioInvoiceId);
            } catch (dbError) {
                // If payment_method column doesn't exist, try without it
        db.prepare(`
            INSERT INTO transactions (id, user_id, amount, currency, status, plisio_invoice_id, type)
            VALUES (?, ?, ?, ?, ?, ?, 'deposit')
        `).run(orderId, userId, amount, currency, 'pending', plisioInvoiceId);
            }

            res.json({ success: true, invoice_url: invoice.invoice_url, payment_method: 'plisio' });
        }
    } catch (error) {
        console.error('Error creating payment:');
        if (error.response) {
            console.error('Plisio Response Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Plisio Response Status:', error.response.status);
        } else if (error.request) {
            console.error('Plisio Request Error (No Response):', error.request);
        } else {
            console.error('Error Message:', error.message);
        }
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Telegram Stars Payment Callback
app.post('/api/payment/telegram-stars-callback', (req, res) => {
    const data = req.body;
    console.log('Telegram Stars callback received:', data);

    const { order_id, status, stars_amount } = data;

    if (!order_id || !status) {
        return res.status(400).send('Invalid callback data');
    }

    try {
        const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(order_id);

        if (!transaction) {
            console.error('Transaction not found:', order_id);
            return res.status(404).send('Transaction not found');
        }

        // status 'paid' means payment was successful
        if (status === 'paid') {
            let userId = transaction.user_id;
            let transactionAmount = transaction.amount;
            
            db.transaction(() => {
                db.prepare('UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                    .run('completed', order_id);

                db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?')
                    .run(transactionAmount, userId);
            })();
            console.log(`Telegram Stars payment successful for user ${userId}, amount: ${transactionAmount}`);

            // Process referral commission for deposits
            try {
                const user = db.prepare('SELECT referred_by, referral_bonus_rate FROM users WHERE id = ?').get(userId);
                if (user && user.referred_by) {
                    const referrer = db.prepare('SELECT id, referral_bonus_rate FROM users WHERE id = ?').get(user.referred_by);
                    if (referrer) {
                        const commissionRate = user.referral_bonus_rate || referrer.referral_bonus_rate || 10.00;
                        const commissionAmount = (transactionAmount * commissionRate) / 100;
                        
                        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(commissionAmount, referrer.id);
                        
                        const commissionId = `ref_${Date.now()}_${referrer.id}_${userId}`;
                        db.prepare(`
                            INSERT INTO referral_commissions (id, referrer_id, referred_user_id, transaction_id, amount, commission_rate, commission_amount, type, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 'transaction', 'paid')
                        `).run(commissionId, referrer.id, userId, order_id, transactionAmount, commissionRate, commissionAmount);
                        
                        console.log(`Referral commission: User ${referrer.id} earned $${commissionAmount} (${commissionRate}%) from user ${userId}'s deposit`);
                    }
                }
            } catch (commErr) {
                console.error('Error processing referral commission for deposit:', commErr);
            }

            res.status(200).send('OK');
        } else {
            // Payment failed or cancelled
            db.prepare('UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run('failed', order_id);
            res.status(200).send('OK');
        }
    } catch (error) {
        console.error('Error handling Telegram Stars callback:', error);
        res.status(500).send('Internal server error');
    }
});

// Plisio Callback
app.post('/api/payment/callback', (req, res) => {
    const data = req.body;
    console.log('Plisio callback received:', JSON.stringify(data, null, 2));
    console.log('Plisio callback headers:', JSON.stringify(req.headers, null, 2));

    // Plisio may send data in different formats - try multiple field names
    const order_number = data.order_number || data.order_id || data.orderNumber || data.orderId;
    const status = data.status || data.state || data.payment_status;
    const txn_id = data.txn_id || data.transaction_id || data.txnId || data.transactionId;

    console.log('Extracted callback data:', { order_number, status, txn_id });

    if (!order_number || !status) {
        console.error('Invalid callback data - missing order_number or status:', { order_number, status, fullData: data });
        return res.status(400).send('Invalid callback data');
    }

    try {
        // Try to find transaction by order_number first, then by plisio_invoice_id (txn_id)
        let transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(order_number);
        
        if (!transaction && txn_id) {
            console.log(`Transaction not found by order_number ${order_number}, trying txn_id ${txn_id}`);
            transaction = db.prepare('SELECT * FROM transactions WHERE plisio_invoice_id = ?').get(txn_id);
        }

        if (!transaction) {
            console.error('Transaction not found:', { order_number, txn_id });
            return res.status(404).send('Transaction not found');
        }

        console.log('Found transaction:', { id: transaction.id, current_status: transaction.status, user_id: transaction.user_id, amount: transaction.amount });

        // Check if already processed to avoid double crediting
        if (transaction.status === 'completed' || transaction.status === 'paid') {
            console.log(`Transaction ${order_number} already processed with status: ${transaction.status}`);
            return res.send('OK - Already processed');
        }

        // Plisio status values: 'completed', 'mismatch', 'paid', 'pending', 'cancelled', 'expired'
        // Treat 'completed', 'mismatch', and 'paid' as successful payments
        if (status === 'completed' || status === 'mismatch' || status === 'paid') {
            let userId = transaction.user_id;
            let transactionAmount = transaction.amount;
            
            console.log(`Processing successful payment for user ${userId}, amount: ${transactionAmount}, status: ${status}`);
            
            db.transaction(() => {
                // Update transaction status to 'completed' (normalize status)
                db.prepare('UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                    .run('completed', order_number);

                // Credit user balance
                db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?')
                    .run(transactionAmount, userId);
            })();
            
            console.log(`Payment successful for user ${userId}, amount: ${transactionAmount}, balance updated`);

            // Process referral commission for deposits
            try {
                const user = db.prepare('SELECT referred_by, referral_bonus_rate FROM users WHERE id = ?').get(userId);
                if (user && user.referred_by) {
                    const referrer = db.prepare('SELECT id, referral_bonus_rate FROM users WHERE id = ?').get(user.referred_by);
                    if (referrer) {
                        const commissionRate = user.referral_bonus_rate || referrer.referral_bonus_rate || 10.00;
                        const commissionAmount = (transactionAmount * commissionRate) / 100;
                        
                        // Add commission to referrer's balance
                        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(commissionAmount, referrer.id);
                        
                        // Record commission
                        const commissionId = `ref_dep_${Date.now()}_${referrer.id}_${userId}`;
                        db.prepare(`
                            INSERT INTO referral_commissions (id, referrer_id, referred_user_id, transaction_id, amount, commission_rate, commission_amount, type, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 'transaction', 'paid')
                        `).run(commissionId, referrer.id, userId, order_number, transactionAmount, commissionRate, commissionAmount);
                        
                        console.log(`Referral commission: User ${referrer.id} earned $${commissionAmount} (${commissionRate}%) from user ${userId}'s deposit`);
                    }
                }
            } catch (commErr) {
                console.error('Error processing referral commission for deposit:', commErr);
            }
        } else {
            // Update status for other states (pending, cancelled, expired, etc.)
            console.log(`Updating transaction ${order_number} status to: ${status}`);
            db.prepare('UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(status, order_number);
        }

        res.send('OK');
    } catch (error) {
        console.error('Error handling Plisio callback:', error);
        console.error('Error stack:', error.stack);
        res.status(500).send('Internal server error');
    }
});

// Manual Plisio Transaction Verification Endpoint
app.post('/api/payment/verify-plisio', async (req, res) => {
    const { order_number, txn_id } = req.body;

    if (!order_number && !txn_id) {
        return res.status(400).json({ error: 'order_number or txn_id is required' });
    }

    try {
        const plisioApiKey = (process.env.PLISIO_API_KEY || '').trim();
        if (!plisioApiKey) {
            return res.status(500).json({ error: 'Plisio API key not configured' });
        }

        // Get transaction from database
        let transaction = null;
        if (order_number) {
            transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(order_number);
        }
        if (!transaction && txn_id) {
            transaction = db.prepare('SELECT * FROM transactions WHERE plisio_invoice_id = ?').get(txn_id);
        }

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found in database' });
        }

        // Verify with Plisio API - check both invoice and operations
        // Use plisio_invoice_id from database (this is the txn_id from Plisio)
        const invoiceId = transaction.plisio_invoice_id || txn_id;
        
        console.log('=== Verification Debug ===');
        console.log('Database transaction ID:', transaction.id);
        console.log('Database plisio_invoice_id:', transaction.plisio_invoice_id);
        console.log('Request txn_id:', txn_id);
        console.log('Using invoiceId for Plisio lookup:', invoiceId);
        
        if (!invoiceId) {
            return res.status(400).json({ 
                error: 'No Plisio invoice ID found. Cannot verify transaction.',
                transaction_id: transaction.id,
                plisio_invoice_id: transaction.plisio_invoice_id
            });
        }
        
        const verifyParams = {
            api_key: plisioApiKey,
            txn_id: invoiceId
        };

        console.log('Verifying Plisio transaction:', verifyParams);

        // Try to get invoice details first (more accurate for payment status)
        let verifyResponse;
        let invoiceData = null;
        
        try {
            const invoiceResponse = await axios.get('https://api.plisio.net/api/v1/invoices', {
                params: { api_key: plisioApiKey, txn_id: invoiceId },
                timeout: 30000
            });
            if (invoiceResponse.data.status === 'success' && invoiceResponse.data.data) {
                invoiceData = Array.isArray(invoiceResponse.data.data) 
                    ? invoiceResponse.data.data[0] 
                    : invoiceResponse.data.data;
                console.log('Invoice data from invoices endpoint:', JSON.stringify(invoiceData, null, 2));
            }
        } catch (invoiceError) {
            console.log('Invoice endpoint not available, using operations endpoint');
        }

        // Get operations (payment transactions)
        verifyResponse = await axios.get('https://api.plisio.net/api/v1/operations', {
            params: verifyParams,
            timeout: 30000
        });

        console.log('Plisio verification response:', JSON.stringify(verifyResponse.data, null, 2));
        
        // If no results, try using the transaction ID directly (in case it's the Plisio ID format)
        if (verifyResponse.data.status === 'success' && 
            (!verifyResponse.data.data || 
             (verifyResponse.data.data.operations && verifyResponse.data.data.operations.length === 0))) {
            console.log('No results with plisio_invoice_id, trying transaction ID directly...');
            const altVerifyParams = {
                api_key: plisioApiKey,
                txn_id: transaction.id
            };
            try {
                const altResponse = await axios.get('https://api.plisio.net/api/v1/operations', {
                    params: altVerifyParams,
                    timeout: 30000
                });
                if (altResponse.data.status === 'success' && 
                    altResponse.data.data && 
                    altResponse.data.data.operations && 
                    altResponse.data.data.operations.length > 0) {
                    console.log('Found transaction using transaction ID directly!');
                    verifyResponse = altResponse;
                    // Update the plisio_invoice_id in database for future lookups
                    db.prepare('UPDATE transactions SET plisio_invoice_id = ? WHERE id = ?')
                        .run(transaction.id, transaction.id);
                    transaction.plisio_invoice_id = transaction.id;
                }
            } catch (altError) {
                console.log('Alternative lookup also failed:', altError.message);
            }
        }

        if (verifyResponse.data.status === 'success' && verifyResponse.data.data) {
            // Plisio returns data in data.operations array
            let plisioTransaction = null;
            
            if (verifyResponse.data.data.operations && Array.isArray(verifyResponse.data.data.operations)) {
                // Get the first operation (most recent)
                plisioTransaction = verifyResponse.data.data.operations[0];
            } else if (Array.isArray(verifyResponse.data.data)) {
                // Fallback: if data is directly an array
                plisioTransaction = verifyResponse.data.data[0];
            } else {
                // Fallback: if data is an object
                plisioTransaction = verifyResponse.data.data;
            }
            
            if (!plisioTransaction) {
                return res.json({
                    success: false,
                    error: 'No transaction found in Plisio response',
                    response: verifyResponse.data
                });
            }

            // Use invoice data if available (more accurate), otherwise use operation data
            const transactionData = invoiceData || plisioTransaction;
            
            // Try multiple possible status field names
            const plisioStatus = transactionData.status || 
                                transactionData.payment_status || 
                                transactionData.state ||
                                transactionData.paymentStatus ||
                                transactionData.paymentState ||
                                plisioTransaction.status;
            
            // Also check if there are confirmations (indicates payment received)
            const hasConfirmations = (transactionData.confirmations > 0) || 
                                    (transactionData.confirmations_count > 0) ||
                                    (transactionData.confirmed === true) ||
                                    (transactionData.confirmed === 1) ||
                                    (plisioTransaction.confirmations > 0);
            
            // Check if there are any completed payment operations in the operations array
            let hasCompletedPayment = false;
            if (verifyResponse.data.data && verifyResponse.data.data.operations && Array.isArray(verifyResponse.data.data.operations)) {
                const completedOps = verifyResponse.data.data.operations.filter((op) => 
                    (op.status === 'completed' || op.status === 'paid') && op.type === 'payment'
                );
                hasCompletedPayment = completedOps.length > 0;
                if (hasCompletedPayment) {
                    console.log(`Found ${completedOps.length} completed payment operation(s)`);
                    console.log('Completed payment operations:', JSON.stringify(completedOps, null, 2));
                }
            }
            
            console.log('=== Plisio Verification Debug ===');
            console.log('Plisio transaction status:', plisioStatus);
            console.log('Database transaction status:', transaction.status);
            console.log('Has confirmations:', hasConfirmations);
            console.log('Has completed payment operations:', hasCompletedPayment);
            console.log('Invoice data available:', !!invoiceData);
            console.log('Full Plisio transaction data:', JSON.stringify(plisioTransaction, null, 2));
            if (invoiceData) {
                console.log('Invoice data:', JSON.stringify(invoiceData, null, 2));
            }
            console.log('Transaction ID:', transaction.id);
            console.log('Transaction amount:', transaction.amount);
            console.log('================================');
            
            // Check if Plisio confirms payment is completed/paid
            // Plisio status values: 'new' (pending), 'pending', 'completed', 'paid', 'mismatch', 'expired', 'cancelled'
            // Accept multiple status values and confirmation indicators
            const isPlisioPaid = plisioStatus === 'completed' || 
                                 plisioStatus === 'paid' || 
                                 plisioStatus === 'mismatch' ||
                                 plisioStatus === 'success' ||
                                 plisioStatus === 'confirmed' ||
                                 plisioStatus === 1 ||
                                 plisioStatus === '1' ||
                                 hasConfirmations ||
                                 (plisioTransaction.amount && plisioTransaction.amount > 0 && plisioTransaction.confirmations >= 1);
            
            // Check if status indicates pending (not paid)
            const isPlisioPending = plisioStatus === 'new' || 
                                   plisioStatus === 'pending' || 
                                   plisioStatus === 'expired' || 
                                   plisioStatus === 'cancelled' ||
                                   !plisioStatus;
            
            // Check if transaction is already completed in our DB (to avoid double crediting)
            const isAlreadyCompleted = transaction.status === 'completed' || transaction.status === 'paid';
            
            console.log('Payment check results:');
            console.log('- Plisio status:', plisioStatus);
            console.log('- isPlisioPaid:', isPlisioPaid);
            console.log('- isPlisioPending:', isPlisioPending);
            console.log('- isAlreadyCompleted:', isAlreadyCompleted);
            
            // If Plisio shows pending status, don't update
            if (isPlisioPending && !isPlisioPaid) {
                return res.json({
                    success: true,
                    message: `Transaction is still pending in Plisio (status: ${plisioStatus})`,
                    database_status: transaction.status,
                    plisio_status: plisioStatus,
                    needs_update: false,
                    updated: false,
                    note: 'Payment has not been completed yet according to Plisio. Status will update automatically when payment is received.'
                });
            }
            
            if (isPlisioPaid && !isAlreadyCompleted) {
                // Plisio confirms payment, but our DB shows pending - update it
                const userId = transaction.user_id;
                const transactionAmount = transaction.amount;

                console.log(`Updating transaction ${transaction.id} from ${transaction.status} to completed for user ${userId}, amount: ${transactionAmount}`);

                try {
                    db.transaction(() => {
                        // Update transaction status
                        const updateResult = db.prepare('UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                            .run('completed', transaction.id);
                        
                        console.log('Transaction update result:', updateResult);

                        // Credit user balance
                        const balanceResult = db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?')
                            .run(transactionAmount, userId);
                        
                        console.log('Balance update result:', balanceResult);
                        
                        // Verify the update
                        const updatedTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transaction.id);
                        const updatedUser = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
                        
                        console.log('Updated transaction status:', updatedTransaction.status);
                        console.log('Updated user balance:', updatedUser.balance);
                    })();

                    console.log(`Successfully updated payment for user ${userId}, amount: ${transactionAmount}`);

                    // Process referral commission
                    try {
                        const user = db.prepare('SELECT referred_by, referral_bonus_rate FROM users WHERE id = ?').get(userId);
                        if (user && user.referred_by) {
                            const referrer = db.prepare('SELECT id, referral_bonus_rate FROM users WHERE id = ?').get(user.referred_by);
                            if (referrer) {
                                const commissionRate = user.referral_bonus_rate || referrer.referral_bonus_rate || 10.00;
                                const commissionAmount = (transactionAmount * commissionRate) / 100;
                                
                                db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(commissionAmount, referrer.id);
                                
                                const commissionId = `ref_dep_${Date.now()}_${referrer.id}_${userId}`;
                                db.prepare(`
                                    INSERT INTO referral_commissions (id, referrer_id, referred_user_id, transaction_id, amount, commission_rate, commission_amount, type, status)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, 'transaction', 'paid')
                                `).run(commissionId, referrer.id, userId, transaction.id, transactionAmount, commissionRate, commissionAmount);
                                
                                console.log(`Referral commission processed: User ${referrer.id} earned $${commissionAmount}`);
                            }
                        }
                    } catch (commErr) {
                        console.error('Error processing referral commission:', commErr);
                    }

                    // Fetch updated transaction to return
                    const updatedTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transaction.id);
                    
                    return res.json({ 
                        success: true, 
                        message: 'Transaction verified and updated successfully',
                        transaction: {
                            id: updatedTransaction.id,
                            status: updatedTransaction.status,
                            amount: updatedTransaction.amount,
                            previous_status: transaction.status
                        },
                        updated: true
                    });
                } catch (dbError) {
                    console.error('Database error during update:', dbError);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to update transaction in database',
                        details: dbError.message
                    });
                }
            } else if (isAlreadyCompleted) {
                // Already processed
                return res.json({
                    success: true,
                    message: 'Transaction already completed',
                    transaction: {
                        id: transaction.id,
                        status: transaction.status,
                        amount: transaction.amount
                    },
                    updated: false,
                    already_completed: true
                });
            } else {
                // Plisio shows pending or other status
                return res.json({
                    success: true,
                    message: 'Transaction verified but payment not yet completed',
                    database_status: transaction.status,
                    plisio_status: plisioStatus,
                    needs_update: false,
                    updated: false
                });
            }
        }

        return res.json({ 
            success: false, 
            error: 'Could not verify transaction with Plisio',
            response: verifyResponse.data
        });
    } catch (error) {
        console.error('Error verifying Plisio transaction:', error);
        return res.status(500).json({ 
            error: 'Failed to verify transaction',
            details: error.response?.data || error.message
        });
    }
});

// Get User Transactions
app.get('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    try {
        const transactions = db.prepare(`
            SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
        `).all(id);

        const withdrawals = db.prepare(`
            SELECT id, user_id, amount, currency, status, created_at, address, 'withdrawal' as type 
            FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
        `).all(id);

        const allHistory = [...transactions, ...withdrawals].sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );

        res.json({ success: true, history: allHistory });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Request Withdrawal
app.post('/api/withdraw', (req, res) => {
    const { userId, amount, currency, passkey } = req.body;

    if (!userId || !amount || !currency || !passkey) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const user = db.prepare('SELECT balance, wallet_address, withdrawal_passkey FROM users WHERE id = ?').get(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.wallet_address) {
            return res.status(400).json({ error: 'Please set your wallet address in settings first' });
        }

        if (user.withdrawal_passkey !== passkey) {
            return res.status(401).json({ error: 'Invalid withdrawal passkey' });
        }

        if (user.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const withdrawalId = `wdr_${Date.now()}_${userId}`;

        db.transaction(() => {
            // Deduct balance
            db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, userId);

            // Record withdrawal request
            db.prepare('INSERT INTO withdrawals (id, user_id, amount, currency, address, status) VALUES (?, ?, ?, ?, ?, ?)')
                .run(withdrawalId, userId, amount, currency, user.wallet_address, 'pending');
        })();

        res.json({ success: true, message: 'Withdrawal request submitted successfully', balance: user.balance - amount });
    } catch (error) {
        console.error('Error requesting withdrawal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cancel Withdrawal Request
app.post('/api/withdraw/cancel', (req, res) => {
    const { userId, withdrawalId } = req.body;

    if (!userId || !withdrawalId) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    try {
        const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(withdrawalId);

        if (!withdrawal) {
            return res.status(404).json({ error: 'Withdrawal not found' });
        }

        if (withdrawal.user_id !== Number(userId)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending requests can be cancelled' });
        }

        db.transaction(() => {
            // Update status
            db.prepare("UPDATE withdrawals SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                .run(withdrawalId);

            // Refund balance
            db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?')
                .run(withdrawal.amount, userId);
        })();

        res.json({ success: true, message: 'Withdrawal request cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling withdrawal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Telegram Webhook for Contact Sharing
app.post('/api/telegram/webhook', (req, res) => {
    const update = req.body;
    if (update.message?.contact) {
        const { user_id, phone_number } = update.message.contact;
        console.log(`[WEBHOOK] Received contact for user ${user_id}: ${phone_number}`);
        try {
            const stmt = db.prepare('UPDATE users SET phone_number = ? WHERE id = ?');
            stmt.run(phone_number, user_id);
        } catch (err) {
            console.error('[WEBHOOK] Error updating phone number:', err);
        }
    }
    res.status(200).send('OK');
});

// Get Available Plans
app.get('/api/plans', (req, res) => {
    try {
        const plans = db.prepare(`
            SELECT id, name, traffic, duration, price, description 
            FROM plans 
            WHERE is_active = 1 
            ORDER BY display_order ASC
        `).all();
        res.json({ success: true, plans });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Purchase Subscription Plan
app.post('/api/purchase-plan', async (req, res) => {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
        return res.status(400).json({ error: 'User ID and plan ID are required' });
    }

    const plan = db.prepare('SELECT * FROM plans WHERE id = ? AND is_active = 1').get(planId);
    if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
    }

    try {
        const user = db.prepare('SELECT balance, username FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.balance < plan.price) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const marzbanUsername = user.username || `user_${userId}`;
        const dataLimit = plan.traffic * 1024 * 1024 * 1024; // GB to Bytes
        const expiry = Math.floor(Date.now() / 1000) + (plan.duration * 24 * 60 * 60);

        // Update Marzban
        await marzban.updateUser(marzbanUsername, {
            status: 'active',
            data_limit: dataLimit,
            expire: expiry
        });

        // Deduct Balance and Record Transaction
        let transId = '';
        db.transaction(() => {
            db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(plan.price, userId);

            transId = `sub_${Date.now()}_${userId}`;
            db.prepare(`
                INSERT INTO transactions (id, user_id, amount, currency, status, type)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(transId, userId, plan.price, 'USD', 'completed', 'subscription');
        })();

        // Process referral commission if user was referred
        try {
            const user = db.prepare('SELECT referred_by, referral_bonus_rate FROM users WHERE id = ?').get(userId);
            if (user.referred_by) {
                const referrer = db.prepare('SELECT id, referral_bonus_rate FROM users WHERE id = ?').get(user.referred_by);
                if (referrer) {
                    // Use referrer's commission rate (or default 10%)
                    const commissionRate = referrer.referral_bonus_rate || 10.00;
                    const commissionAmount = (plan.price * commissionRate) / 100;
                    
                    // Add commission to referrer's balance
                    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(commissionAmount, referrer.id);
                    
                    // Record commission
                    const commissionId = `ref_comm_${Date.now()}_${referrer.id}_${userId}`;
                    db.prepare(`
                        INSERT INTO referral_commissions (id, referrer_id, referred_user_id, transaction_id, amount, commission_rate, commission_amount, type, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'transaction', 'paid')
                    `).run(commissionId, referrer.id, userId, transId, plan.price, commissionRate, commissionAmount);
                    
                    console.log(`Referral commission: User ${referrer.id} earned $${commissionAmount} (${commissionRate}%) from user ${userId}'s purchase`);
                }
            }
        } catch (commErr) {
            console.error('Error processing referral commission:', commErr);
            // Don't fail the transaction if commission processing fails
        }

        res.json({
            success: true,
            message: `Successfully purchased ${plan.name} plan`,
            newBalance: user.balance - plan.price
        });

    } catch (error) {
        console.error('Error purchasing plan:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'Internal server error';
        res.status(500).json({ error: errorMessage });
    }
});

// Create Custom Subscription
app.post('/api/create-custom-subscription', async (req, res) => {
    const { userId, traffic, duration } = req.body;

    if (!userId || !traffic || !duration) {
        return res.status(400).json({ error: 'User ID, traffic, and duration are required' });
    }

    // Validate inputs
    const trafficGB = parseFloat(traffic);
    const durationDays = parseFloat(duration);
    
    if (trafficGB <= 0 || durationDays <= 0) {
        return res.status(400).json({ error: 'Traffic and duration must be greater than 0' });
    }

    try {
        // Get pricing from configs (default: $0.07 per GB, $0.03 per day)
        const trafficPriceConfig = db.prepare("SELECT value FROM configs WHERE key = 'custom_subscription_traffic_price'").get();
        const durationPriceConfig = db.prepare("SELECT value FROM configs WHERE key = 'custom_subscription_duration_price'").get();
        
        const trafficPrice = parseFloat(trafficPriceConfig?.value || '0.07');
        const durationPrice = parseFloat(durationPriceConfig?.value || '0.03');
        
        // Calculate price
        const price = (trafficGB * trafficPrice) + (durationDays * durationPrice);
        
        // Get user balance
        const user = db.prepare('SELECT balance, username FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.balance < price) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const marzbanUsername = user.username || `user_${userId}`;
        const dataLimit = trafficGB * 1024 * 1024 * 1024; // GB to Bytes
        const expiry = Math.floor(Date.now() / 1000) + (durationDays * 24 * 60 * 60);

        // Update or create user in Marzban
        try {
            const existingUser = await marzban.getUser(marzbanUsername);
            if (existingUser) {
                await marzban.updateUser(marzbanUsername, {
                    status: 'active',
                    data_limit: dataLimit,
                    expire: expiry
                });
            } else {
                await marzban.createUser(marzbanUsername, dataLimit, expiry);
            }
        } catch (mErr) {
            console.error(`Error updating Marzban user ${marzbanUsername}:`, mErr);
            return res.status(500).json({ error: 'Failed to create subscription in Marzban' });
        }

        // Deduct Balance and Record Transaction
        let transId = '';
        db.transaction(() => {
            db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(price, userId);

            transId = `custom_${Date.now()}_${userId}`;
        db.prepare(`
            INSERT INTO transactions (id, user_id, amount, currency, status, type)
            VALUES (?, ?, ?, ?, ?, ?)
            `).run(transId, userId, price, 'USD', 'completed', 'custom_subscription');
        })();

        // Process referral commission if user was referred
        try {
            const userData = db.prepare('SELECT referred_by, referral_bonus_rate FROM users WHERE id = ?').get(userId);
            if (userData.referred_by) {
                const referrer = db.prepare('SELECT id, referral_bonus_rate FROM users WHERE id = ?').get(userData.referred_by);
                if (referrer) {
                    const commissionRate = userData.referral_bonus_rate || referrer.referral_bonus_rate || 10.00;
                    const commissionAmount = (price * commissionRate) / 100;
                    
                    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(commissionAmount, referrer.id);
                    
                    const commissionId = `ref_${Date.now()}_${referrer.id}_${userId}`;
                    db.prepare(`
                        INSERT INTO referral_commissions (id, referrer_id, referred_user_id, transaction_id, amount, commission_rate, commission_amount, type, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'transaction', 'paid')
                    `).run(commissionId, referrer.id, userId, transId, price, commissionRate, commissionAmount);
                    
                    console.log(`Referral commission: User ${referrer.id} earned $${commissionAmount} (${commissionRate}%) from user ${userId}'s custom subscription`);
                }
            }
        } catch (refErr) {
            console.error('Error processing referral commission:', refErr);
        }

        console.log(`Custom subscription created for user ${userId}: ${trafficGB}GB for ${durationDays} days. Price: $${price.toFixed(2)}`);

        res.json({ 
            success: true, 
            message: `اشتراک سفارشی با موفقیت ایجاد شد`,
            price: price,
            newBalance: user.balance - price
        });
    } catch (error) {
        console.error('Error creating custom subscription:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
