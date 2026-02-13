# Telegram Direct Link Mini App Implementation

## Overview

This document explains how Telegram Direct Link Mini Apps are implemented for Plisio payment callbacks and referral links, following the [official Telegram documentation](https://core.telegram.org/bots/webapps#direct-link-mini-apps).

## Key Concepts

### Direct Link Format

Telegram Direct Link Mini Apps use the following format:
```
https://t.me/botusername?start=param
```

The `start` parameter is passed to the Mini App in:
- `window.Telegram.WebApp.initDataUnsafe.start_param`
- GET parameter `tgWebAppStartParam`

## Implementation Details

### 1. Plisio Payment Callbacks

#### Backend Changes (`backend/server.js`)

**Payment Creation:**
- When creating a Plisio invoice, the `success_invoice_url` and `fail_invoice_url` now use Telegram direct link format
- Format: `https://t.me/{BOT_USERNAME}?start=payment_tx_{ORDER_ID}`
- Falls back to frontend URL if `BOT_USERNAME` is not configured

**GET Callback Handler:**
- Updated to redirect users to Telegram direct link mini app
- Extracts transaction ID from query parameters
- Redirects to: `https://t.me/{BOT_USERNAME}?start=payment_tx_{ORDER_ID}`

**Environment Variables:**
- `BOT_USERNAME`: Your Telegram bot username (without @)
- `BACKEND_URL`: Public backend URL for webhooks
- `FRONTEND_URL`: Fallback frontend URL (used if BOT_USERNAME not set)

#### Frontend Changes (`src/App.tsx`)

**Start Parameter Handling:**
- Detects `payment_tx_` prefix in `start_param`
- Extracts transaction ID and navigates to wallet page with pending status
- Format: `/wallet?payment=pending&tx={ORDER_ID}`

**Other Start Parameters:**
- `wallet`: Redirects to wallet page
- Any other value: Treated as referral code

### 2. Referral Links

#### Current Implementation

Referral links already use the correct Telegram direct link format:
```
https://t.me/{BOT_USERNAME}?start={REFERRAL_CODE}
```

#### UI Improvements (`src/pages/WalletPage.tsx`)

**Enhanced Design:**
- Beautiful gradient card with purple/pink theme
- Clear visual hierarchy with icons and labels
- Improved copy and share buttons with better styling
- Info badge explaining commission structure
- Responsive layout with proper RTL/LTR support

**Features:**
- One-click copy button
- Share via native share API (with fallback to copy)
- Visual feedback on actions
- Clean, modern design matching app theme

## Configuration

### Backend Environment Variables

Add to your `.env` file:
```bash
# Telegram Bot Configuration
BOT_USERNAME=your_bot_username  # Without @ symbol

# Backend URL (for Plisio webhooks)
BACKEND_URL=https://your-backend-domain.com

# Frontend URL (fallback)
FRONTEND_URL=https://app.survpn.xyz
```

### Frontend Environment Variables

Add to your `.env` file:
```bash
VITE_BOT_USERNAME=your_bot_username  # Without @ symbol
```

## Usage Examples

### Payment Redirect Flow

1. User completes payment on Plisio
2. User clicks "To the site" button
3. Plisio redirects to: `https://t.me/{BOT_USERNAME}?start=payment_tx_{ORDER_ID}`
4. Telegram opens Mini App with `start_param = "payment_tx_{ORDER_ID}"`
5. App detects payment redirect and navigates to `/wallet?payment=pending&tx={ORDER_ID}`
6. Wallet page shows pending transaction and auto-checks status

### Referral Link Flow

1. User shares referral link: `https://t.me/{BOT_USERNAME}?start={REFERRAL_CODE}`
2. New user clicks link
3. Telegram opens Mini App with `start_param = "{REFERRAL_CODE}"`
4. App detects referral code and syncs user with referral code
5. Referrer receives commission when new user makes transactions

## Benefits

1. **Better UX**: Users stay within Telegram when redirected from payments
2. **Seamless Navigation**: Direct links open the Mini App automatically
3. **No External Browser**: Everything happens within Telegram
4. **Clean URLs**: Telegram handles the deep linking
5. **Mobile Optimized**: Works perfectly on mobile devices

## Testing

### Test Payment Redirect

1. Create a test payment
2. Complete payment on Plisio
3. Click "To the site" button
4. Verify Mini App opens with correct transaction ID
5. Verify wallet page shows pending transaction

### Test Referral Link

1. Copy referral link from wallet page
2. Open link in new Telegram session (or test account)
3. Verify Mini App opens
4. Verify referral code is detected and applied
5. Verify referrer receives commission

## Troubleshooting

### Issue: Direct links not working

**Solution:**
- Verify `BOT_USERNAME` is set correctly (without @)
- Check bot username matches your actual bot
- Ensure Mini App is configured in BotFather

### Issue: Payment redirect not working

**Solution:**
- Check `BOT_USERNAME` environment variable
- Verify Plisio callback URLs in logs
- Check browser console for errors
- Verify `start_param` is being received

### Issue: Referral code not detected

**Solution:**
- Verify referral link format is correct
- Check `start_param` in browser console
- Verify user sync is working
- Check backend logs for referral processing

## References

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [Direct Link Mini Apps](https://core.telegram.org/bots/webapps#direct-link-mini-apps)
- [Plisio API Documentation](https://plisio.net/swagger/docs)
