import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';

// Re-export RootState type for convenience
export type { RootState };

/**
 * Memoized selectors for better performance
 * Using createSelector ensures selectors only recompute when their inputs change
 */

// User selectors
export const selectCurrentUser = (state: RootState) => state.user.currentUser;
export const selectSubscriptionData = (state: RootState) => state.user.subscriptionData;
export const selectUserBalance = (state: RootState) => state.user.currentUser?.balance ?? 0;
export const selectIsAdmin = (state: RootState) => state.user.currentUser?.isAdmin ?? false;
export const selectUserWalletAddress = (state: RootState) => state.user.currentUser?.walletAddress;
export const selectUserHasPasskey = (state: RootState) => state.user.currentUser?.hasPasskey ?? false;
export const selectUserReferralCode = (state: RootState) => state.user.currentUser?.referralCode ?? '';
export const selectUserLanguage = (state: RootState) => state.user.currentUser?.languageCode;

// Derived user selectors
export const selectHasActiveSubscription = createSelector(
    [selectCurrentUser],
    (currentUser) => {
        if (!currentUser?.subscriptionUrl) return false;
        if (currentUser.status !== 'active') return false;
        if ((currentUser.dataLimit ?? 0) <= 0) return false;
        
        // Check if expired
        if (currentUser.expire) {
            const now = Math.floor(Date.now() / 1000);
            if (currentUser.expire < now) return false;
        }
        
        return true;
    }
);

export const selectSubscriptionUsage = createSelector(
    [selectCurrentUser],
    (currentUser) => {
        const dataLimit = currentUser?.dataLimit ?? 0;
        const dataUsed = currentUser?.dataUsed ?? 0;
        const usagePercent = dataLimit > 0 ? Math.min((dataUsed / dataLimit) * 100, 100) : 0;
        
        return {
            dataLimit,
            dataUsed,
            usagePercent,
            remaining: dataLimit - dataUsed,
        };
    }
);

// UI selectors
export const selectPurchasingPlanId = (state: RootState) => state.ui.purchasingPlanId;
export const selectIsSubscriptionDrawerOpen = (state: RootState) => state.ui.isSubscriptionDrawerOpen;
export const selectIsPlanDrawerOpen = (state: RootState) => state.ui.isPlanDrawerOpen;
export const selectSelectedPlanType = (state: RootState) => state.ui.selectedPlanType;

// Transaction selectors
export const selectPendingTransactions = (state: RootState) => state.transactions.pendingTransactions;
export const selectCheckingTransactions = (state: RootState) => state.transactions.checkingTransactions;
export const selectLastCheckedAt = (state: RootState) => state.transactions.lastCheckedAt;
export const selectAutoCheckEnabled = (state: RootState) => state.transactions.autoCheckEnabled;
export const selectCheckInterval = (state: RootState) => state.transactions.checkInterval;

// Derived transaction selectors
export const selectPendingPlisioTransactions = createSelector(
    [selectPendingTransactions],
    (pendingTransactions) =>
        pendingTransactions.filter(
            (tx) =>
                tx.status === 'pending' &&
                tx.type === 'deposit' &&
                (tx.payment_method === 'plisio' || tx.plisio_invoice_id)
        )
);

export const selectPendingTransactionsCount = createSelector(
    [selectPendingTransactions],
    (pendingTransactions) => pendingTransactions.length
);

export const selectIsTransactionChecking = createSelector(
    [selectCheckingTransactions],
    (checkingTransactions) => checkingTransactions.length > 0
);

// API selectors (RTK Query)
export const selectApiState = (state: RootState) => state.api;
