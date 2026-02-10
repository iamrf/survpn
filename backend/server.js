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

// Generate unique referral code (5 chars, a-z0-9)
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function getUniqueReferralCode() {
    let code;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
        code = generateReferralCode();
        const existing = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(code);
        if (!existing) {
            isUnique = true;
        }
        attempts++;
    }
    return code;
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

// Sync User Data
app.post('/api/sync-user', async (req, res) => {
    const { id, first_name, last_name, username, language_code, photo_url, phone_number } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const adminIds = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim());
    const role = adminIds.includes(id.toString()) ? 'admin' : 'user';

    try {
        const stmt = db.prepare(`
            INSERT INTO users (id, first_name, last_name, username, language_code, photo_url, role, phone_number, last_seen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                first_name = excluded.first_name,
                last_name = excluded.last_name,
                username = excluded.username,
                language_code = excluded.language_code,
                photo_url = excluded.photo_url,
                role = excluded.role,
                phone_number = COALESCE(excluded.phone_number, users.phone_number),
                last_seen = CURRENT_TIMESTAMP
        `);

        stmt.run(id, first_name, last_name || null, username || null, language_code || null, photo_url || null, role, phone_number || null);

        let user = db.prepare('SELECT balance, referral_code, phone_number, created_at, last_seen, language_code, wallet_address, withdrawal_passkey, has_welcome_bonus FROM users WHERE id = ?').get(id);

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

        try {
            let mUser = await marzban.getUser(marzbanUsername);

            // Welcome Bonus Logic (5GB = 5 * 1024^3 bytes)
            const WELCOME_BONUS = 5 * 1024 * 1024 * 1024;

            if (!mUser) {
                console.log(`Creating Marzban user with 5GB Welcome Bonus: ${marzbanUsername}`);
                mUser = await marzban.createUser(marzbanUsername, WELCOME_BONUS);
                db.prepare('UPDATE users SET has_welcome_bonus = 1 WHERE id = ?').run(id);
            } else if (user.has_welcome_bonus === 0) {
                console.log(`Granting 5GB Welcome Bonus to existing Marzban user: ${marzbanUsername}`);
                // Add 5GB to whatever they have (if they have something)
                const newLimit = (mUser.data_limit || 0) + WELCOME_BONUS;
                mUser = await marzban.updateUser(marzbanUsername, { data_limit: newLimit });
                db.prepare('UPDATE users SET has_welcome_bonus = 1 WHERE id = ?').run(id);
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
app.get('/api/admin/user/:id', (req, res) => {
    const { id } = req.params;
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true, user });
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

// Create Payment Invoice
app.post('/api/payment/create', async (req, res) => {
    const { userId, amount, currency = 'USD' } = req.body;

    if (!userId || !amount) {
        return res.status(400).json({ error: 'User ID and amount are required' });
    }

    try {
        const orderId = `${Date.now()}`.slice(-10); // Shorter order number
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

        // Save transaction
        db.prepare(`
            INSERT INTO transactions (id, user_id, amount, currency, status, plisio_invoice_id, type)
            VALUES (?, ?, ?, ?, ?, ?, 'deposit')
        `).run(orderId, userId, amount, currency, 'pending', invoice.txn_id);

        res.json({ success: true, invoice_url: invoice.invoice_url });
    } catch (error) {
        console.error('Error creating payment:');
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Plisio Response Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Plisio Response Status:', error.response.status);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Plisio Request Error (No Response):', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error Message:', error.message);
        }
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Plisio Callback
app.post('/api/payment/callback', (req, res) => {
    const data = req.body;
    console.log('Plisio callback received:', data);

    const { order_number, status, txn_id } = data;

    if (!order_number || !status) {
        return res.status(400).send('Invalid callback data');
    }

    try {
        const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(order_number);

        if (!transaction) {
            console.error('Transaction not found:', order_number);
            return res.status(404).send('Transaction not found');
        }

        // status 'completed' or 'mismatch' (if partially paid, though we should handle it carefully)
        if (status === 'completed' || status === 'mismatch') {
            db.transaction(() => {
                db.prepare('UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                    .run(status, order_number);

                db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?')
                    .run(transaction.amount, transaction.user_id);
            })();
            console.log(`Payment successful for user ${transaction.user_id}, amount: ${transaction.amount}`);
        } else {
            db.prepare('UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run(status, order_number);
        }

        res.send('OK');
    } catch (error) {
        console.error('Error handling Plisio callback:', error);
        res.status(500).send('Internal server error');
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

// Subscription Plans Definition
const SUBSCRIPTION_PLANS = [
    { id: 'bronze', name: 'برنز (اقتصادی)', traffic: 10, duration: 30, price: 2, description: 'مناسب برای وب‌گردی روزمره' },
    { id: 'silver', name: 'نقره‌ای (استاندارد)', traffic: 50, duration: 60, price: 7, description: 'پیشنهاد ویژه برای استفاده مداوم' },
    { id: 'gold', name: 'طلایی (نامحدود*)', traffic: 200, duration: 90, price: 15, description: 'برترین کیفیت بدون نگرانی از حجم' }
];

// Get Available Plans
app.get('/api/plans', (req, res) => {
    res.json({ success: true, plans: SUBSCRIPTION_PLANS });
});

// Purchase Subscription Plan
app.post('/api/purchase-plan', async (req, res) => {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
        return res.status(400).json({ error: 'User ID and plan ID are required' });
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
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
        db.transaction(() => {
            db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(plan.price, userId);

            const transId = `sub_${Date.now()}_${userId}`;
            db.prepare(`
                INSERT INTO transactions (id, user_id, amount, currency, status, type)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(transId, userId, plan.price, 'USD', 'completed', 'subscription');
        })();

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

// Create Custom Subscription Request
app.post('/api/create-custom-subscription', (req, res) => {
    const { userId, traffic, duration, notes } = req.body;

    if (!userId || !traffic || !duration) {
        return res.status(400).json({ error: 'User ID, traffic, and duration are required' });
    }

    try {
        const transId = `custom_${Date.now()}_${userId}`;
        // For custom requests, we just log it as a pending transaction or send a notification to admin
        // For now, let's just record it in a separate table if it exists, or use transactions with status 'pending'
        db.prepare(`
            INSERT INTO transactions (id, user_id, amount, currency, status, type)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(transId, userId, 0, 'USD', 'pending', 'custom_subscription');

        console.log(`Custom subscription request from user ${userId}: ${traffic}GB for ${duration} days. Notes: ${notes}`);

        res.json({ success: true, message: 'Custom subscription request submitted. Our team will contact you soon.' });
    } catch (error) {
        console.error('Error creating custom subscription:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
