# Quick Setup: BotFather Direct Links

## Step-by-Step Instructions

### Step 1: Create Direct Links in BotFather

1. Open [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/mybots`
3. Select your bot
4. Choose **"Mini Apps"**
5. Choose **"Direct links"**
6. Choose **"Create direct link"**

#### Create Referral Link:

- **Link name:** `refer`
- **URL:** `https://app.survpn.xyz?ref={REFERRAL_CODE}`
  - *(Replace `app.survpn.xyz` with your actual frontend URL)*
- **Title:** `Join VPN with Referral`
- **Description:** `Get started with VPN using a referral link`
- **Choose link for your app:** `t.me/your_bot_username/refer`

✅ **You'll get:** `t.me/your_bot_username/refer`

#### Create Payment Link:

- **Link name:** `payment`
- **URL:** `https://app.survpn.xyz?payment=callback&tx={TRANSACTION_ID}`
  - *(Replace `app.survpn.xyz` with your actual frontend URL)*
- **Title:** `Payment Complete`
- **Description:** `Return to app after payment`
- **Choose link for your app:** `t.me/your_bot_username/payment`

✅ **You'll get:** `t.me/your_bot_username/payment`

### Step 2: Set Environment Variables

**Backend `.env`:**
```bash
BOT_USERNAME=your_bot_username  # Without @ symbol
FRONTEND_URL=https://app.survpn.xyz
```

**Frontend `.env`:**
```bash
VITE_BOT_USERNAME=your_bot_username  # Without @ symbol
```

### Step 3: Restart Services

```bash
# Backend
cd backend
npm start

# Frontend
npm run dev
```

## How It Works Now

### Referral Links:
- Generated as: `t.me/your_bot/refer?ref=ABC123`
- When clicked → Opens Mini App
- App reads `?ref=ABC123` → Syncs user with referral code

### Payment Callbacks:
- Generated as: `t.me/your_bot/payment?tx=ORDER123`
- When clicked → Opens Mini App
- App reads `?payment=callback&tx=ORDER123` → Navigates to wallet page

## Testing

1. **Test Referral:**
   - Copy link from Wallet page
   - Should be: `t.me/bot/refer?ref=CODE`
   - Open in new chat → Verify Mini App opens

2. **Test Payment:**
   - Create test payment
   - Complete on Plisio
   - Click "To the site" → Should redirect to `t.me/bot/payment?tx=ID`

## Done! ✅

Your Direct Links are now configured and working!
