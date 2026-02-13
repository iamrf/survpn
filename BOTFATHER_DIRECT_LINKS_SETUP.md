# BotFather Direct Links Setup Guide

## Understanding Direct Links

BotFather's Direct Links feature creates branded links like `t.me/your_bot/refer` or `t.me/your_bot/payment`. However, since we need **dynamic** links (each user has a different referral code, each payment has a different transaction ID), we'll use a hybrid approach:

1. **Create base Direct Links in BotFather** (for branding)
2. **Use query parameters** to pass dynamic data (referral codes, transaction IDs)
3. **Update the app** to handle these query parameters

## Step-by-Step Setup

### Step 1: Create Direct Links in BotFather

#### 1.1 Open BotFather
- Open [@BotFather](https://t.me/BotFather) on Telegram
- Send `/mybots`
- Select your bot
- Choose **"Mini Apps"**
- Choose **"Direct links"**
- Choose **"Create direct link"**

#### 1.2 Create Referral Base Link

**Link name:** `refer` (or `ref`, `invite` - your choice)

**URL:** 
```
https://app.survpn.xyz?ref={REFERRAL_CODE}
```
*(Replace `app.survpn.xyz` with your actual frontend URL)*

**Metadata:**
- **Title:** `Join VPN with Referral`
- **Description:** `Get started with VPN using a referral link`

**Choose link for your app:** `t.me/your_bot_username/refer`

**✅ Save this link!** You'll get: `t.me/your_bot_username/refer`

#### 1.3 Create Payment Callback Base Link

**Link name:** `payment` (or `pay`, `callback` - your choice)

**URL:**
```
https://app.survpn.xyz?payment=callback&tx={TRANSACTION_ID}
```
*(Replace `app.survpn.xyz` with your actual frontend URL)*

**Metadata:**
- **Title:** `Payment Complete`
- **Description:** `Return to app after payment`

**Choose link for your app:** `t.me/your_bot_username/payment`

**✅ Save this link!** You'll get: `t.me/your_bot_username/payment`

### Step 2: Update Backend to Use Direct Links

We need to update the backend to construct direct links with query parameters.

#### 2.1 Update `backend/server.js`

Find the Plisio invoice creation section (around line 1040) and update it:

```javascript
// Telegram Direct Link Mini App URLs for user redirects
const botUsername = (process.env.BOT_USERNAME || '').trim();
const frontendUrl = process.env.FRONTEND_URL || 'https://app.survpn.xyz';

// Success URL: Use BotFather Direct Link with query parameter
// Format: t.me/bot_username/payment?tx=ORDERID
const successInvoiceUrl = botUsername 
    ? `https://t.me/${botUsername}/payment?tx=${orderId}`
    : `${frontendUrl}/wallet?payment=pending&tx=${orderId}`;

// Fail URL: Use Direct Link to wallet
const failInvoiceUrl = botUsername
    ? `https://t.me/${botUsername}/payment?tx=${orderId}&status=failed`
    : `${frontendUrl}/wallet`;
```

### Step 3: Update Frontend to Handle Direct Links

#### 3.1 Update `src/pages/WalletPage.tsx`

Update the referral link generation (around line 206):

```typescript
useEffect(() => {
  if (!referralCode) {
    setReferralLink("");
    return;
  }
  import('@/lib/telegram').then(({ getTelegramBotUsername }) => {
    const botUsername = getTelegramBotUsername();
    // Use BotFather Direct Link with query parameter
    setReferralLink(`https://t.me/${botUsername}/refer?ref=${referralCode}`);
  });
}, [referralCode]);
```

#### 3.2 Update `src/App.tsx` to Handle Query Parameters

We need to handle both:
- `?ref=CODE` (from referral direct link)
- `?payment=callback&tx=ID` (from payment direct link)

Update the `StartParamNavigator` component:

```typescript
const StartParamNavigator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigatedRef = useRef(false);

  useEffect(() => {
    const handleNavigation = async () => {
      if (navigatedRef.current) return;
      
      // Check URL query parameters (from Direct Links)
      const params = new URLSearchParams(location.search);
      
      // Handle payment callback from Direct Link
      if (params.get('payment') === 'callback') {
        const txId = params.get('tx');
        const status = params.get('status');
        if (txId) {
          navigatedRef.current = true;
          setTimeout(() => {
            navigate(`/wallet?payment=${status === 'failed' ? 'failed' : 'pending'}&tx=${txId}`);
          }, 100);
          return;
        }
      }
      
      // Handle referral code from Direct Link
      const refCode = params.get('ref');
      if (refCode) {
        navigatedRef.current = true;
        // Sync user with referral code
        const tgUser = getTelegramUser();
        if (tgUser) {
          try {
            await syncUser({
              ...tgUser,
              referral_code: refCode,
            }).unwrap();
          } catch (error) {
            console.error("Error syncing user with referral code:", error);
          }
        }
        return;
      }
      
      // Handle start_param (fallback for ?start= links)
      try {
        const { getReferralCodeFromStartParam } = await import('@/lib/telegram');
        const startParam = getReferralCodeFromStartParam();

        if (startParam) {
          if (startParam.startsWith('payment_tx_')) {
            const txId = startParam.replace('payment_tx_', '');
            navigatedRef.current = true;
            setTimeout(() => {
              navigate(`/wallet?payment=pending&tx=${txId}`);
            }, 100);
          } else if (startParam === 'wallet') {
            navigatedRef.current = true;
            setTimeout(() => {
              navigate('/wallet');
            }, 100);
          } else {
            // Referral code
            console.log('[REFERRAL] Referral code from start param:', startParam);
            const tgUser = getTelegramUser();
            if (tgUser) {
              try {
                await syncUser({
                  ...tgUser,
                  referral_code: startParam,
                }).unwrap();
              } catch (error) {
                console.error("Error syncing user with referral code:", error);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in navigation handler:", error);
      }
    };
    
    handleNavigation();
  }, [location, navigate]);
  
  return null;
};
```

### Step 4: Set Environment Variables

Make sure you have these in your `.env` files:

**Backend `.env`:**
```bash
BOT_USERNAME=your_bot_username  # Without @
BACKEND_URL=https://your-backend-domain.com
FRONTEND_URL=https://app.survpn.xyz
```

**Frontend `.env`:**
```bash
VITE_BOT_USERNAME=your_bot_username  # Without @
```

### Step 5: Restart Services

```bash
# Restart backend
cd backend
npm start

# Restart frontend
npm run dev
```

## How It Works

### Referral Link Flow:
1. User gets referral link: `t.me/your_bot/refer?ref=ABC123`
2. User clicks link → Telegram opens Mini App
3. App reads `?ref=ABC123` from URL
4. App syncs user with referral code `ABC123`

### Payment Callback Flow:
1. User completes payment on Plisio
2. Plisio redirects to: `t.me/your_bot/payment?tx=ORDER123`
3. Telegram opens Mini App
4. App reads `?payment=callback&tx=ORDER123` from URL
5. App navigates to `/wallet?payment=pending&tx=ORDER123`
6. Wallet page shows pending transaction

## Testing

### Test Referral Direct Link:
1. Copy referral link from Wallet page (should be `t.me/bot/refer?ref=CODE`)
2. Open in new chat/test account
3. Verify Mini App opens
4. Check browser console for referral code detection
5. Verify user is synced with referral code

### Test Payment Direct Link:
1. Create test payment
2. Complete payment on Plisio
3. Click "To the site" button
4. Verify redirect to `t.me/bot/payment?tx=ID`
5. Verify Mini App opens
6. Verify wallet page shows pending transaction

## Alternative: Keep Using ?start= Links

If you prefer to keep using the standard `?start=` parameter links (which work automatically without BotFather setup), you can skip the Direct Links setup. The current implementation already supports:

- `https://t.me/bot?start=REFERRAL_CODE` ✅
- `https://t.me/bot?start=payment_tx_ORDER_ID` ✅

These work automatically - no BotFather configuration needed!

## Troubleshooting

### Issue: Direct links don't open Mini App
- Verify Mini App is configured in BotFather
- Check that Direct Link URL points to your frontend
- Try opening link from within Telegram (not external browser)

### Issue: Query parameters not detected
- Check browser console for URL parameters
- Verify `location.search` contains the parameters
- Check that navigation handler is running

### Issue: Referral code not applied
- Check browser console for referral code detection
- Verify backend logs for user sync
- Check that `ref` parameter is in URL

## Summary

**Option 1: Use BotFather Direct Links** (Branded links)
- Create `t.me/bot/refer` and `t.me/bot/payment` in BotFather
- Use query parameters for dynamic data
- More branded, professional appearance

**Option 2: Use Standard ?start= Links** (Current implementation)
- No BotFather setup needed
- Works automatically
- Format: `t.me/bot?start=CODE`

Both work! Choose based on your preference for branding vs. simplicity.
