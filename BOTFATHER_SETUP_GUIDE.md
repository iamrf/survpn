# BotFather Setup Guide for Direct Links

## Quick Answer

**Good news:** Direct links work automatically! You don't need to do anything special in BotFather to activate them. Direct links are a built-in Telegram feature that works with any bot that has a Mini App configured.

## What You Need to Do

### 1. ✅ Ensure Mini App is Configured in BotFather

If your Mini App is already working, you're good! If not:

1. Open [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/mybots`
3. Select your bot
4. Choose **"Bot Settings"** → **"Configure Mini App"**
5. Set your Mini App URL (e.g., `https://app.survpn.xyz`)

### 2. ✅ Set Environment Variables

#### Backend `.env` file:
```bash
# Your bot username WITHOUT the @ symbol
BOT_USERNAME=your_bot_username

# Your backend URL (for Plisio webhooks)
BACKEND_URL=https://your-backend-domain.com

# Frontend URL (fallback)
FRONTEND_URL=https://app.survpn.xyz
```

#### Frontend `.env` file:
```bash
# Your bot username WITHOUT the @ symbol
VITE_BOT_USERNAME=your_bot_username
```

**Important:** 
- Use your bot username **without** the `@` symbol
- Example: If your bot is `@MyVPNBot`, use `MyVPNBot`

### 3. ✅ Restart Services

After setting environment variables:
```bash
# Restart backend
cd backend
npm start

# Restart frontend (if running dev server)
npm run dev
```

## How Direct Links Work

Direct links are **automatically enabled** for any bot with a Mini App. The format is:
```
https://t.me/your_bot_username?start=parameter
```

When someone clicks this link:
1. Telegram opens your Mini App
2. The `start` parameter is passed to your app via `window.Telegram.WebApp.initDataUnsafe.start_param`
3. Your app handles the parameter (payment redirect, referral code, etc.)

## Testing if Everything Works

### Test 1: Referral Links ✅

1. **Open your app** in Telegram
2. **Go to Wallet page** → Click on "Referral & Affiliate" card
3. **Copy your referral link** (should look like: `https://t.me/your_bot_username?start=ABC12`)
4. **Open the link** in a new chat or test account
5. **Verify:**
   - ✅ Mini App opens automatically
   - ✅ Referral code is detected (check browser console for `[REFERRAL] Referral code from start param: ABC12`)
   - ✅ New user is registered with referral code

### Test 2: Payment Callback Links ✅

1. **Create a test payment** (any amount)
2. **Complete payment** on Plisio
3. **Click "To the site" button** on Plisio
4. **Verify:**
   - ✅ You're redirected to Telegram
   - ✅ Mini App opens automatically
   - ✅ Wallet page shows with pending transaction
   - ✅ Transaction ID is in the URL: `/wallet?payment=pending&tx=ORDER_ID`

### Test 3: Check Environment Variables

**Backend logs should show:**
```
Using Telegram direct link mini app for Plisio redirects: { successInvoiceUrl: 'https://t.me/...', failInvoiceUrl: 'https://t.me/...' }
```

**If you see warnings:**
```
WARNING: BOT_USERNAME not set. Using fallback frontend URL for Plisio redirects.
```
→ This means `BOT_USERNAME` is not set in backend `.env`

**Frontend console should NOT show:**
```
Bot username not configured. Please set VITE_BOT_USERNAME in .env file
```
→ If you see this, `VITE_BOT_USERNAME` is not set in frontend `.env`

## Current Status

### ✅ What's Already Working:

1. **Referral Links:**
   - ✅ Format: `https://t.me/bot?start=REFERRAL_CODE`
   - ✅ Generated correctly in WalletPage
   - ✅ Detected in App.tsx
   - ✅ Synced to backend

2. **Payment Callback Links:**
   - ✅ Format: `https://t.me/bot?start=payment_tx_ORDER_ID`
   - ✅ Generated in backend when creating Plisio invoice
   - ✅ Detected in App.tsx
   - ✅ Navigates to wallet page

3. **UI:**
   - ✅ Beautiful referral link card in WalletPage
   - ✅ Copy and share functionality
   - ✅ RTL/LTR support

### ⚠️ What You Need to Do:

1. **Set `BOT_USERNAME` in backend `.env`**
   - Without this, payment redirects will use fallback frontend URL
   - Direct links won't work for payments

2. **Set `VITE_BOT_USERNAME` in frontend `.env`**
   - Without this, referral links will use fallback
   - Direct links won't work for referrals

3. **Restart both services** after setting environment variables

## Troubleshooting

### Issue: Direct links open browser instead of Mini App

**Solution:**
- Make sure Mini App is configured in BotFather
- Check that the URL in BotFather matches your frontend URL
- Try opening the link from within Telegram (not from external browser)

### Issue: Referral code not detected

**Check:**
1. Browser console for `[REFERRAL] Referral code from start param: ...`
2. Backend logs for referral processing
3. That `VITE_BOT_USERNAME` is set correctly

### Issue: Payment redirect not working

**Check:**
1. Backend logs for `Using Telegram direct link mini app...`
2. That `BOT_USERNAME` is set in backend `.env`
3. Browser console for `[PAYMENT] Payment redirect...`

### Issue: Links show "your_bot_username" instead of actual username

**Solution:**
- `VITE_BOT_USERNAME` or `BOT_USERNAME` is not set
- Set it in `.env` files and restart services

## Summary

**You don't need to activate anything in BotFather** - direct links work automatically once:
1. ✅ Mini App is configured (you probably already have this)
2. ✅ `BOT_USERNAME` is set in backend `.env`
3. ✅ `VITE_BOT_USERNAME` is set in frontend `.env`
4. ✅ Services are restarted

**Everything is implemented and ready to go!** Just set the environment variables and test.
