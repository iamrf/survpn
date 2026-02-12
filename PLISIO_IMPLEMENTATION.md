# Plisio Payment Gateway Implementation Guide

## Overview
This document explains how Plisio payment gateway is integrated and how to handle callbacks properly.

## Key Concepts

### 1. Transaction IDs
- **`order_number`**: Our internal transaction ID (stays fixed, never changes)
- **`txn_id`**: Plisio's invoice ID (changes when user switches cryptocurrency)
- **Important**: Always use `order_number` to find transactions in database

### 2. Currency Changes
When a user changes cryptocurrency in Plisio:
- `order_number` stays the same (our transaction ID)
- `txn_id` changes (new invoice created for new currency)
- The callback will still use the same `order_number`

### 3. Callback URL Setup

#### Backend URL Configuration
Set the `BACKEND_URL` environment variable to your public backend URL:
```bash
BACKEND_URL=https://your-backend-domain.com
```

#### Callback Endpoint
The callback endpoint is: `/api/payment/callback`

Full callback URL: `https://your-backend-domain.com/api/payment/callback`

**Important Notes:**
- The Telegram guard only affects the frontend React app
- Backend API endpoints (like `/api/payment/callback`) are **always publicly accessible**
- Plisio will POST to this URL when payment status changes
- The endpoint must return `200 OK` to acknowledge receipt

### 4. Plisio Workflow

1. **Create Invoice**:
   - User requests payment
   - Backend creates Plisio invoice with `order_number` (our transaction ID)
   - Plisio returns `txn_id` (invoice ID) and `invoice_url`
   - We store `txn_id` as `plisio_invoice_id` in database

2. **User Pays**:
   - User is redirected to Plisio payment page
   - User can change cryptocurrency (creates new `txn_id` but `order_number` stays same)
   - User completes payment

3. **Callback Received**:
   - Plisio POSTs to `/api/payment/callback` with:
     - `order_number`: Our transaction ID (use this to find transaction)
     - `txn_id`: Current invoice ID (may have changed if user switched crypto)
     - `status`: Payment status (`completed`, `paid`, `pending`, etc.)
   - Backend finds transaction by `order_number`
   - Updates transaction status and credits user balance

4. **Manual Verification** (if callback fails):
   - Admin can manually verify using `/api/payment/verify-plisio`
   - Uses `order_number` to look up transaction in Plisio
   - Updates database if payment is confirmed

### 5. Status Values

**Successful Payments:**
- `completed`: Payment fully completed
- `paid`: Payment received
- `mismatch`: Partial payment (user paid different amount)

**Pending:**
- `pending`: Waiting for payment
- `new`: Invoice created, not paid yet

**Failed:**
- `cancelled`: User cancelled payment
- `expired`: Invoice expired
- `failed`: Payment failed

### 6. Implementation Checklist

- [x] Set `BACKEND_URL` environment variable
- [x] Callback endpoint is publicly accessible (`/api/payment/callback`)
- [x] Use `order_number` to find transactions (not `txn_id`)
- [x] Handle all status values correctly
- [x] Prevent double crediting (check if already processed)
- [x] Process referral commissions for deposits
- [x] Manual verification endpoint available
- [ ] Implement signature verification (optional but recommended)

### 7. Testing

To test callbacks:
1. Create a test payment
2. Check server logs for callback receipt
3. Verify transaction status updates in database
4. Check user balance is credited

If callbacks don't work:
1. Verify `BACKEND_URL` is set correctly
2. Check backend is publicly accessible
3. Test callback URL manually: `curl -X POST https://your-backend.com/api/payment/callback`
4. Use manual verification as fallback

### 8. Troubleshooting

**Problem**: Callbacks not received
- **Solution**: Check `BACKEND_URL` is set and backend is publicly accessible

**Problem**: Transaction not found in callback
- **Solution**: Ensure using `order_number` (not `txn_id`) to find transaction

**Problem**: Status not updating
- **Solution**: Check callback handler logs, verify status value matches expected format

**Problem**: Double crediting
- **Solution**: Already handled - checks if transaction is already `completed` before processing
