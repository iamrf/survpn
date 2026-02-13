# Referral Registration Flow - Database & Redux Integration

## Overview

This document explains how user registration with referral links is handled across the frontend, backend database, and Redux state management.

## Flow Diagram

```
User clicks referral link
    ↓
Telegram opens Mini App with start_param or ?ref=CODE
    ↓
Frontend detects referral code
    ↓
Frontend calls syncUser mutation with referral_code
    ↓
Backend /api/sync-user endpoint
    ↓
Backend checks if user is NEW
    ↓
If NEW + has referral_code:
    - Lookup referrer by code
    - Set referred_by in database
    - Give registration bonus to referrer
    - Record commission in referral_commissions table
    ↓
Backend returns user data + referral status
    ↓
Redux updates state via extraReducers
    ↓
UI reflects updated user data
```

## Implementation Details

### 1. Frontend Detection (`src/App.tsx`)

**Two entry points for referral codes:**

#### A. Start Parameter (`?start=CODE`)
- Detected in `AppContent` component
- Runs immediately when app loads
- Processes referral code BEFORE initial user sync
- Ensures new users get referral processed during registration

```typescript
// In AppContent useEffect
const startParam = getReferralCodeFromStartParam();
if (startParam && !startParam.startsWith('payment_tx_') && startParam !== 'wallet') {
  await syncUser({
    ...tgUser,
    referral_code: startParam,
  }).unwrap();
}
```

#### B. Direct Link Query Parameter (`?ref=CODE`)
- Detected in `StartParamNavigator` component
- Handles BotFather Direct Links
- Uses `referralProcessedRef` to prevent duplicate processing

```typescript
// In StartParamNavigator
const refCode = params.get('ref');
if (refCode && !referralProcessedRef.current) {
  await syncUser({
    ...tgUser,
    referral_code: refCode,
  }).unwrap();
}
```

### 2. Backend Processing (`backend/server.js`)

**Key logic in `/api/sync-user` endpoint:**

```javascript
// Check if user exists
const existingUser = db.prepare('SELECT id, referred_by, referral_code FROM users WHERE id = ?').get(id);
const isNewUser = !existingUser;

// Only process referral codes for NEW users
if (isNewUser && referral_code) {
  // Lookup referrer by code (case-insensitive)
  const referrer = getUserByReferralCode(referral_code);
  
  if (referrer && referrer.id !== id) {
    referredBy = referrer.id;
    // Get registration bonus amount
    registrationBonus = referrer.referral_registration_bonus || defaultBonus;
    
    // Insert user with referred_by
    // Give bonus to referrer
    // Record commission
  }
}
```

**Database operations:**
1. **User Insert/Update:**
   ```sql
   INSERT INTO users (..., referred_by, ...)
   VALUES (..., ?, ...)
   ON CONFLICT(id) DO UPDATE SET
     referred_by = COALESCE(users.referred_by, excluded.referred_by)
   ```
   - `COALESCE` ensures `referred_by` is only set if it's currently NULL
   - Prevents overwriting existing referral relationship

2. **Registration Bonus:**
   ```javascript
   // Give bonus to referrer
   db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?')
     .run(registrationBonus, referredBy);
   
   // Record commission
   db.prepare(`
     INSERT INTO referral_commissions 
     (id, referrer_id, referred_user_id, amount, commission_rate, commission_amount, type, status)
     VALUES (?, ?, ?, ?, 100.00, ?, 'registration', 'paid')
   `).run(commissionId, referredBy, id, registrationBonus, registrationBonus);
   ```

### 3. Redux State Management (`src/store/`)

**State Structure:**
```typescript
interface UserState {
  currentUser: {
    id?: number;
    referralCode?: string;  // User's own referral code
    balance?: number;
    // ... other fields
  } | null;
}
```

**Update Flow:**
1. `syncUser` mutation is called with `referral_code`
2. Backend processes referral (if new user)
3. Backend returns user data including `referralCode`
4. `userSlice.extraReducers` automatically updates Redux state:
   ```typescript
   builder.addMatcher(
     api.endpoints.syncUser.matchFulfilled,
     (state, action) => {
       if (action.payload.success) {
         state.currentUser = extractUserFromPayload(action.payload, userId);
       }
     }
   );
   ```

**Tag Invalidation:**
- `syncUser` mutation invalidates `['User', 'ReferralStats']` tags
- This triggers automatic refetch of:
  - `getCurrentUser` query
  - `getReferralStats` query (if used)

## Database Schema

### `users` Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  referral_code TEXT UNIQUE,      -- User's own referral code
  referred_by INTEGER,            -- ID of user who referred this user
  referral_bonus_rate DECIMAL,    -- Commission rate for this user's referrals
  -- ... other fields
);
```

### `referral_commissions` Table
```sql
CREATE TABLE referral_commissions (
  id TEXT PRIMARY KEY,
  referrer_id INTEGER NOT NULL,      -- User who earned commission
  referred_user_id INTEGER NOT NULL, -- User who was referred
  amount DECIMAL(18, 8) NOT NULL,   -- Transaction amount (for transaction type)
  commission_rate DECIMAL(5, 2),     -- Commission percentage
  commission_amount DECIMAL(18, 8),  -- Actual commission earned
  type TEXT DEFAULT 'transaction',    -- 'transaction' or 'registration'
  status TEXT DEFAULT 'pending',     -- 'pending', 'paid', 'cancelled'
  created_at DATETIME,
  paid_at DATETIME
);
```

## Key Features

### ✅ New User Registration
- Referral code is processed **only for new users**
- Existing users cannot change their `referred_by` (protected by `COALESCE`)
- Registration bonus is paid immediately to referrer

### ✅ Referral Code Validation
- Case-insensitive lookup
- Self-referral prevention (`referrer.id !== id`)
- Invalid code handling (silently ignored, logged)

### ✅ Redux Integration
- Automatic state updates via `extraReducers`
- Tag invalidation ensures data consistency
- No manual state management needed

### ✅ Error Handling
- Frontend: Errors are logged but don't block app initialization
- Backend: Invalid referral codes are logged but don't fail user registration
- Database: Foreign key constraints ensure referrer exists

## Testing

### Test New User with Valid Referral Code:
1. User A has referral code `ABC123`
2. User B clicks `t.me/bot/refer?ref=ABC123`
3. Mini App opens, detects `?ref=ABC123`
4. Frontend calls `syncUser` with `referral_code: 'ABC123'`
5. Backend:
   - Detects User B is new
   - Looks up User A by code `ABC123`
   - Sets `User B.referred_by = User A.id`
   - Gives registration bonus to User A
   - Records commission
6. Redux state updates with User B's data
7. User A's balance increases by registration bonus

### Test Existing User with Referral Code:
1. User B already exists (no referral)
2. User B clicks referral link
3. Frontend calls `syncUser` with `referral_code`
4. Backend:
   - Detects User B exists
   - Skips referral processing (only for new users)
   - Updates user data normally
5. `referred_by` remains NULL (unchanged)

### Test Invalid Referral Code:
1. User clicks link with invalid code `INVALID`
2. Backend:
   - Looks up code → Not found
   - Logs: `Invalid referral code or self-referral attempt`
   - User registration continues normally
   - No error returned to frontend

## Logging

**Backend logs:**
```
[REFERRAL] New user 123456789 registering with referral code: ABC123
[REFERRAL] Referrer lookup result: { id: 987654321, ... }
[REFERRAL] User 123456789 referred by 987654321, bonus: $1.00
Referral bonus: User 987654321 earned $1.00 for referring user 123456789
[REFERRAL] Registration complete: User 123456789 was referred by 987654321, registration bonus $1.00 paid
```

**Frontend logs:**
```
[REFERRAL] Referral code detected from start param: ABC123
[REFERRAL] User synced successfully with referral code: ABC123
```

## Summary

✅ **Database**: Referral relationships stored in `users.referred_by`, commissions in `referral_commissions`  
✅ **Redux**: State automatically updated via `extraReducers` when `syncUser` succeeds  
✅ **Frontend**: Referral codes detected from both `?start=` and `?ref=` parameters  
✅ **Backend**: Only processes referral codes for new users, prevents self-referral  
✅ **Error Handling**: Graceful handling of invalid codes, doesn't block registration  

The system is fully integrated and working end-to-end! 🎉
