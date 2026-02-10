# Redux Setup Documentation

## Overview
This project now uses Redux Toolkit with RTK Query for state management and API caching.

## Installation
```bash
npm install @reduxjs/toolkit react-redux
```

## Store Structure

### API Slice (`src/store/api.ts`)
RTK Query API slice with all endpoints:
- **User endpoints**: syncUser, updateWalletAddress, updateWithdrawalPasskey
- **Payment endpoints**: createPayment
- **Transaction endpoints**: getTransactionHistory
- **Withdrawal endpoints**: requestWithdrawal, cancelWithdrawal
- **Plan endpoints**: getPlans, purchasePlan, createCustomSubscription
- **Admin endpoints**: 
  - Users: getUsers, getUserDetail, adminUpdateUserSecurity, updateUserBalance
  - Withdrawals: getAllWithdrawals, updateWithdrawalStatus
  - Stats: getTotalDeposits, getUserFinanceSummary
  - Configs: getConfigs, updateConfig
  - Plans: getAdminPlans, getAdminPlan, createPlan, updatePlan, deletePlan

### Redux Slices

#### User Slice (`src/store/slices/userSlice.ts`)
Manages:
- `currentUser`: Current logged-in user data
- `subscriptionData`: User's subscription information

#### UI Slice (`src/store/slices/uiSlice.ts`)
Manages:
- `isSubscriptionDrawerOpen`: Subscription drawer state
- `isPlanDrawerOpen`: Plans drawer state
- `selectedPlanType`: Selected plan type filter
- `purchasingPlanId`: Currently purchasing plan ID

## Usage Examples

### Using RTK Query Hooks

```typescript
import { useGetPlansQuery, usePurchasePlanMutation } from '@/store/api';

// Query hook (auto-cached)
const { data, isLoading, error } = useGetPlansQuery();

// Mutation hook
const [purchasePlan, { isLoading }] = usePurchasePlanMutation();
```

### Using Redux State

```typescript
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSubscriptionData } from '@/store/slices/index';

const dispatch = useAppDispatch();
const subscriptionData = useAppSelector((state) => state.user.subscriptionData);

// Update state
dispatch(setSubscriptionData(newData));
```

## Caching Benefits

RTK Query provides automatic caching:
- **Queries are cached** by default
- **Automatic refetching** on component mount
- **Tag-based invalidation** for related data
- **Optimistic updates** support
- **Request deduplication**

## Migration Status

✅ **Completed:**
- Redux store setup
- RTK Query API slice with all endpoints
- User and UI slices
- App.tsx Redux Provider
- HomePage migration

🔄 **To Migrate:**
- AdminPage
- WalletPage
- SettingsPage
- Other components using API calls

## Next Steps

1. Install dependencies: `npm install @reduxjs/toolkit react-redux`
2. Migrate remaining components to use Redux hooks
3. Remove old API function calls from components
4. Leverage RTK Query caching for better performance
