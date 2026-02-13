import { createApi, fetchBaseQuery, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { config } from '../lib/config';

const API_URL = config.apiUrl || '';

/**
 * Base query with error handling and retry logic
 * Implements exponential backoff for retries and proper error handling
 */
const baseQueryWithRetry: BaseQueryFn = async (args, api, extraOptions) => {
    const baseQueryFn = fetchBaseQuery({
        baseUrl: API_URL,
        prepareHeaders: (headers) => {
            headers.set('Content-Type', 'application/json');
            return headers;
        },
        timeout: 30000,
        // Add credentials if needed
        credentials: 'same-origin',
    });

    let result = await baseQueryFn(args, api, extraOptions);

    // Retry logic for network errors and server errors
    if (result.error && 'status' in result.error) {
        const status = result.error.status;
        const maxRetries = 2;
        let retryCount = 0;

        // Retry on network errors (status 0 or FETCH_ERROR) or server errors (500-599)
        while (
            retryCount < maxRetries &&
            (status === 'FETCH_ERROR' || 
             status === 'TIMEOUT_ERROR' ||
             (typeof status === 'number' && status >= 500 && status < 600))
        ) {
            // Exponential backoff: 1s, 2s
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            result = await baseQueryFn(args, api, extraOptions);
            
            // If retry succeeded or error is not retryable, break
            if (!result.error || 
                (result.error && 'status' in result.error && 
                 result.error.status !== 'FETCH_ERROR' && 
                 result.error.status !== 'TIMEOUT_ERROR' &&
                 (typeof result.error.status !== 'number' || result.error.status < 500 || result.error.status >= 600))) {
                break;
            }
            
            retryCount++;
        }
    }

    // Log errors in development
    if (result.error && process.env.NODE_ENV !== 'production') {
        console.error('[RTK Query Error]', {
            endpoint: typeof args === 'string' ? args : args.url,
            error: result.error,
        });
    }

    return result;
};


/**
 * RTK Query API - Tag Strategy:
 * 
 * Tags & what provides them:
 * - 'User'           → getCurrentUser query (current authenticated user)
 * - 'Plans'          → getPlans query (user-visible plans)
 * - 'AdminPlans'     → getAdminPlans, getAdminPlan queries
 * - 'Users'          → getUsers query (admin: all users list)
 * - 'UserDetail'     → getUserDetail query (admin: specific user, scoped by userId)
 * - 'Transactions'   → getTransactionHistory query (user's transactions, scoped by userId)
 * - 'AdminTransactions' → getAllTransactions query (admin: all transactions)
 * - 'Withdrawals'    → getAllWithdrawals query (admin: all withdrawals)
 * - 'Configs'        → getConfigs query (admin: system configs)
 * - 'Stats'          → getTotalDeposits, getDepositsStats queries (admin: stats)
 * - 'FinanceSummary' → getUserFinanceSummary query (admin: user finance, scoped by userId)
 * - 'ReferralStats'  → getReferralStats query (referral stats, scoped by userId)
 * 
 * Invalidation chains:
 * - Payment created    → Transactions (new pending tx)
 * - Payment verified   → User, Transactions, AdminTransactions, Stats, FinanceSummary
 * - Plan purchased     → User, Transactions, AdminTransactions, Stats, FinanceSummary, Plans
 * - Custom sub created → User, Transactions, AdminTransactions, Stats, FinanceSummary
 * - Withdrawal request → User, Withdrawals, Transactions, AdminTransactions, Stats, FinanceSummary
 * - Withdrawal cancel  → User, Withdrawals, Transactions, AdminTransactions, Stats, FinanceSummary
 * - Withdrawal status  → User, Users, UserDetail, Withdrawals, Transactions, AdminTransactions, Stats, FinanceSummary
 * - Balance updated    → UserDetail, Users, Transactions, AdminTransactions, Stats, FinanceSummary
 * - User settings      → User
 * - Referral updated   → UserDetail, Users, ReferralStats
 * - Config updated     → Configs
 * - Plan CRUD          → AdminPlans, Plans
 */

export const api = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithRetry,
    tagTypes: [
        'User',
        'Plans',
        'AdminPlans',
        'Users',
        'UserDetail',
        'Transactions',
        'AdminTransactions',
        'Withdrawals',
        'Configs',
        'Stats',
        'FinanceSummary',
        'ReferralStats',
    ],
    keepUnusedDataFor: 60,
    endpoints: (builder) => ({
        // ──────────────────────────────────────────────────────────────
        // User endpoints
        // ──────────────────────────────────────────────────────────────

        // getCurrentUser: fetches the current user's data (provides 'User' tag)
        // This is the "source of truth" query for user data. Mutations that
        // affect the user's own data invalidate 'User' to trigger a refetch.
        getCurrentUser: builder.query<{
            success: boolean;
            isAdmin?: boolean;
            balance?: number;
            referralCode?: string;
            phoneNumber?: string;
            createdAt?: string;
            lastSeen?: string;
            languageCode?: string;
            walletAddress?: string;
            hasPasskey?: boolean;
            subscriptionUrl?: string;
            dataLimit?: number;
            dataUsed?: number;
            expire?: number;
            status?: string;
            username?: string;
        }, any>({
            query: (user) => ({
                url: '/api/sync-user',
                method: 'POST',
                body: user,
            }),
            providesTags: ['User'],
        }),

        // syncUser: mutation variant of user sync (for explicit calls that need .unwrap())
        syncUser: builder.mutation<{
            success: boolean;
            isAdmin?: boolean;
            balance?: number;
            referralCode?: string;
            phoneNumber?: string;
            createdAt?: string;
            lastSeen?: string;
            languageCode?: string;
            walletAddress?: string;
            hasPasskey?: boolean;
            subscriptionUrl?: string;
            dataLimit?: number;
            dataUsed?: number;
            expire?: number;
            status?: string;
            username?: string;
        }, any>({
            query: (user) => ({
                url: '/api/sync-user',
                method: 'POST',
                body: user,
            }),
            // After sync completes, refetch the getCurrentUser query
            invalidatesTags: ['User', 'ReferralStats'],
        }),

        updateWalletAddress: builder.mutation<{ success: boolean; message?: string }, { userId: number; walletAddress: string }>({
            query: ({ userId, walletAddress }) => ({
                url: '/api/user/wallet',
                method: 'POST',
                body: { id: userId, wallet_address: walletAddress },
            }),
            invalidatesTags: ['User'],
        }),

        updateWithdrawalPasskey: builder.mutation<{ success: boolean; message?: string }, { userId: number; passkey: string }>({
            query: ({ userId, passkey }) => ({
                url: '/api/user/passkey',
                method: 'POST',
                body: { id: userId, passkey },
            }),
            invalidatesTags: ['User'],
        }),

        updateUserLanguage: builder.mutation<{ success: boolean; message?: string }, { userId: number; languageCode: string }>({
            query: ({ userId, languageCode }) => ({
                url: '/api/user/language',
                method: 'POST',
                body: { id: userId, language_code: languageCode },
            }),
            invalidatesTags: ['User'],
        }),

        // ──────────────────────────────────────────────────────────────
        // Payment endpoints
        // ──────────────────────────────────────────────────────────────
        createPayment: builder.mutation<{ 
            success: boolean; 
            invoice_url?: string; 
            error?: string;
            payment_method?: string;
            stars_amount?: number;
            order_id?: string;
            invoice_data?: {
                title: string;
                description: string;
                payload: string;
                currency: string;
                prices: Array<{ label: string; amount: number }>;
            };
        }, { 
            userId: number; 
            amount: number;
            paymentMethod?: 'plisio' | 'telegram_stars';
        }>({
            query: ({ userId, amount, paymentMethod = 'plisio' }) => ({
                url: '/api/payment/create',
                method: 'POST',
                body: { userId, amount, paymentMethod },
            }),
            // A new pending transaction is created in the DB
            invalidatesTags: ['Transactions', 'AdminTransactions'],
        }),

        verifyPlisioTransaction: builder.mutation<{ 
            success: boolean; 
            message?: string;
            error?: string;
            transaction?: any;
            updated?: boolean;
            already_completed?: boolean;
        }, { 
            order_number?: string;
            txn_id?: string;
        }>({
            query: (body) => ({
                url: '/api/payment/verify-plisio',
                method: 'POST',
                body,
            }),
            // Only invalidate caches when something actually changed
            invalidatesTags: (result) => {
                if (result?.updated) {
                    // Transaction was confirmed and balance credited → refresh everything
                    // Force refetch of User to get updated balance
                    return ['User', 'Transactions', 'AdminTransactions', 'Stats', 'FinanceSummary'];
                }
                if (result?.already_completed) {
                    // Already processed, but still refresh User to ensure balance is synced
                    return ['User', 'Transactions'];
                }
                // No change (not_found, not_matched, still pending) → don't invalidate anything
                // This prevents unnecessary refetches during polling of fake/unmatched transactions
                return [];
            },
        }),

        // ──────────────────────────────────────────────────────────────
        // Transaction endpoints
        // ──────────────────────────────────────────────────────────────
        getTransactionHistory: builder.query<{ success: boolean; history?: any[] }, number>({
            query: (userId) => `/api/transactions/${userId}`,
            providesTags: (result, error, userId) => [
                { type: 'Transactions', id: userId },
                'Transactions',
            ],
        }),

        // ──────────────────────────────────────────────────────────────
        // Withdrawal endpoints
        // ──────────────────────────────────────────────────────────────
        requestWithdrawal: builder.mutation<{ success: boolean; message?: string; error?: string; balance?: number }, {
            userId: number;
            amount: number;
            currency: string;
            passkey: string;
        }>({
            query: (body) => ({
                url: '/api/withdraw',
                method: 'POST',
                body,
            }),
            // Withdrawal deducts balance, creates transaction, creates withdrawal request
            invalidatesTags: ['User', 'Withdrawals', 'Transactions', 'AdminTransactions', 'Stats', 'FinanceSummary'],
        }),

        cancelWithdrawal: builder.mutation<{ success: boolean; message?: string; error?: string }, {
            userId: number;
            withdrawalId: string;
        }>({
            query: ({ userId, withdrawalId }) => ({
                url: '/api/withdraw/cancel',
                method: 'POST',
                body: { userId, withdrawalId },
            }),
            // Cancel restores balance, updates transaction, updates withdrawal
            invalidatesTags: ['User', 'Withdrawals', 'Transactions', 'AdminTransactions', 'Stats', 'FinanceSummary'],
        }),

        // ──────────────────────────────────────────────────────────────
        // Plans endpoints
        // ──────────────────────────────────────────────────────────────
        getPlans: builder.query<{ success: boolean; plans?: any[] }, void>({
            query: () => '/api/plans',
            providesTags: ['Plans'],
        }),

        purchasePlan: builder.mutation<{ success: boolean; message?: string; error?: string; newBalance?: number }, {
            userId: number;
            planId: string;
        }>({
            query: ({ userId, planId }) => ({
                url: '/api/purchase-plan',
                method: 'POST',
                body: { userId, planId },
            }),
            // Purchase deducts balance, creates transaction, may create subscription
            invalidatesTags: ['User', 'Plans', 'Transactions', 'AdminTransactions', 'Stats', 'FinanceSummary'],
        }),

        createCustomSubscription: builder.mutation<{ success: boolean; message?: string; error?: string; price?: number; newBalance?: number }, {
            userId: number;
            traffic: number;
            duration: number;
        }>({
            query: (body) => ({
                url: '/api/create-custom-subscription',
                method: 'POST',
                body,
            }),
            // Custom subscription deducts balance, creates transaction
            invalidatesTags: ['User', 'Transactions', 'AdminTransactions', 'Stats', 'FinanceSummary'],
        }),

        // ──────────────────────────────────────────────────────────────
        // Admin endpoints
        // ──────────────────────────────────────────────────────────────
        getUsers: builder.query<{ success: boolean; users?: any[] }, void>({
            query: () => '/api/admin/users',
            providesTags: ['Users'],
        }),

        getUserDetail: builder.query<{ success: boolean; user?: any }, string>({
            query: (userId) => `/api/admin/user/${userId}`,
            providesTags: (result, error, userId) => [{ type: 'UserDetail', id: userId }],
        }),

        adminUpdateUserSecurity: builder.mutation<{ success: boolean; message?: string; error?: string }, {
            userId: string;
            walletAddress: string;
            passkey: string;
        }>({
            query: ({ userId, walletAddress, passkey }) => ({
                url: `/api/admin/user/${userId}/security`,
                method: 'POST',
                body: { wallet_address: walletAddress, withdrawal_passkey: passkey },
            }),
            invalidatesTags: (result, error, { userId }) => [
                { type: 'UserDetail', id: userId },
                'Users',
            ],
        }),

        updateUserBalance: builder.mutation<{ success: boolean; message?: string; error?: string }, {
            userId: string;
            amount: number;
            type: 'set' | 'add' | 'subtract';
        }>({
            query: ({ userId, amount, type }) => ({
                url: `/api/admin/user/${userId}/balance`,
                method: 'POST',
                body: { amount, type },
            }),
            invalidatesTags: (result, error, { userId }) => [
                { type: 'UserDetail', id: userId },
                { type: 'FinanceSummary', id: userId },
                'Users',
                'Transactions',
                'AdminTransactions',
                'Stats',
            ],
        }),

        getAllWithdrawals: builder.query<{ success: boolean; withdrawals?: any[] }, void>({
            query: () => '/api/admin/withdrawals',
            providesTags: ['Withdrawals'],
        }),

        getAllTransactions: builder.query<{ success: boolean; transactions?: any[] }, { status?: string; type?: string; limit?: number }>({
            query: (params) => ({
                url: '/api/admin/transactions',
                params,
            }),
            providesTags: ['AdminTransactions'],
        }),

        updateWithdrawalStatus: builder.mutation<{ success: boolean; message?: string; error?: string }, {
            withdrawalId: string;
            status: 'completed' | 'failed';
        }>({
            query: ({ withdrawalId, status }) => ({
                url: '/api/admin/withdraw/status',
                method: 'POST',
                body: { id: withdrawalId, status },
            }),
            // Withdrawal status change affects user balance, withdrawal list, transactions, stats
            invalidatesTags: ['User', 'Users', 'Withdrawals', 'Transactions', 'AdminTransactions', 'Stats', 'FinanceSummary'],
        }),

        getTotalDeposits: builder.query<{ success: boolean; total: number }, void>({
            query: () => '/api/admin/stats/total-deposits',
            providesTags: ['Stats'],
        }),

        getDepositsStats: builder.query<{
            success: boolean;
            data: {
                total: number;
                byPaymentMethod: Array<{ payment_method: string; count: number; total: number }>;
                byDay: Array<{ date: string; count: number; total: number }>;
                byMonth: Array<{ month: string; count: number; total: number }>;
                byStatus: Array<{ status: string; count: number; total: number }>;
                recent: Array<any>;
            };
        }, void>({
            query: () => '/api/admin/stats/deposits',
            providesTags: ['Stats'],
        }),

        getUserFinanceSummary: builder.query<{ success: boolean; summary?: any; error?: string }, number>({
            query: (userId) => `/api/admin/user/${userId}/finance-summary`,
            providesTags: (result, error, userId) => [{ type: 'FinanceSummary', id: userId }],
        }),

        getConfigs: builder.query<{ success: boolean; configs?: Record<string, string> }, void>({
            query: () => '/api/admin/configs',
            providesTags: ['Configs'],
        }),

        updateConfig: builder.mutation<{ success: boolean; message?: string; error?: string }, {
            key: string;
            value: string;
        }>({
            query: ({ key, value }) => ({
                url: '/api/admin/configs',
                method: 'POST',
                body: { key, value },
            }),
            invalidatesTags: ['Configs'],
        }),

        // Admin Plan Management
        getAdminPlans: builder.query<{ success: boolean; plans?: any[] }, void>({
            query: () => '/api/admin/plans',
            providesTags: ['AdminPlans', 'Plans'],
        }),

        getAdminPlan: builder.query<{ success: boolean; plan?: any }, string>({
            query: (planId) => `/api/admin/plans/${planId}`,
            providesTags: (result, error, planId) => [{ type: 'AdminPlans', id: planId }],
        }),

        createPlan: builder.mutation<{ success: boolean; message?: string; error?: string }, {
            id: string;
            name: string;
            traffic: number;
            duration: number;
            price: number;
            description?: string;
            is_active?: boolean;
            display_order?: number;
        }>({
            query: (plan) => ({
                url: '/api/admin/plans',
                method: 'POST',
                body: plan,
            }),
            invalidatesTags: ['AdminPlans', 'Plans'],
        }),

        updatePlan: builder.mutation<{ success: boolean; message?: string; error?: string }, {
            planId: string;
            plan: {
                name?: string;
                traffic?: number;
                duration?: number;
                price?: number;
                description?: string;
                is_active?: boolean;
                display_order?: number;
            };
        }>({
            query: ({ planId, plan }) => ({
                url: `/api/admin/plans/${planId}`,
                method: 'PUT',
                body: plan,
            }),
            invalidatesTags: (result, error, { planId }) => [
                { type: 'AdminPlans', id: planId },
                'AdminPlans',
                'Plans',
            ],
        }),

        deletePlan: builder.mutation<{ success: boolean; message?: string; error?: string }, string>({
            query: (planId) => ({
                url: `/api/admin/plans/${planId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['AdminPlans', 'Plans'],
        }),

        // ──────────────────────────────────────────────────────────────
        // Referral endpoints
        // ──────────────────────────────────────────────────────────────
        getReferralStats: builder.query<{
            success: boolean;
            stats?: {
                referralCount: number;
                totalCommissions: number;
                recentCommissions: any[];
                referredUsers?: Array<{
                    id: number;
                    first_name: string;
                    last_name?: string;
                    username?: string;
                    created_at: string;
                    balance: number;
                    phone_number?: string;
                    transactionCount: number;
                    totalEarned: number;
                }>;
            };
        }, number>({
            query: (userId) => `/api/user/${userId}/referral-stats`,
            providesTags: (result, error, userId) => [{ type: 'ReferralStats', id: userId }],
        }),

        // Admin: Update User Referral Settings
        adminUpdateUserReferral: builder.mutation<{ success: boolean; message?: string; error?: string }, {
            userId: string;
            referral_bonus_rate?: number;
            referral_registration_bonus?: number;
            referral_code?: string;
        }>({
            query: ({ userId, ...body }) => ({
                url: `/api/admin/user/${userId}/referral`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { userId }) => [
                { type: 'UserDetail', id: userId },
                { type: 'ReferralStats', id: userId },
                'Users',
                'ReferralStats',
            ],
        }),

        // Health check
        checkBackendHealth: builder.query<boolean, void>({
            query: () => '/health',
        }),
    }),
});

export const {
    // User hooks
    useGetCurrentUserQuery,
    useLazyGetCurrentUserQuery,
    useSyncUserMutation,
    useUpdateWalletAddressMutation,
    useUpdateWithdrawalPasskeyMutation,
    useUpdateUserLanguageMutation,
    
    // Payment hooks
    useCreatePaymentMutation,
    useVerifyPlisioTransactionMutation,
    
    // Transaction hooks
    useGetTransactionHistoryQuery,
    useLazyGetTransactionHistoryQuery,
    
    // Withdrawal hooks
    useRequestWithdrawalMutation,
    useCancelWithdrawalMutation,
    
    // Plan hooks
    useGetPlansQuery,
    useLazyGetPlansQuery,
    usePurchasePlanMutation,
    useCreateCustomSubscriptionMutation,
    
    // Admin hooks
    useGetUsersQuery,
    useLazyGetUsersQuery,
    useGetUserDetailQuery,
    useLazyGetUserDetailQuery,
    useAdminUpdateUserSecurityMutation,
    useUpdateUserBalanceMutation,
    useGetAllWithdrawalsQuery,
    useLazyGetAllWithdrawalsQuery,
    useUpdateWithdrawalStatusMutation,
    useGetAllTransactionsQuery,
    useGetTotalDepositsQuery,
    useLazyGetTotalDepositsQuery,
    useGetDepositsStatsQuery,
    useGetUserFinanceSummaryQuery,
    useLazyGetUserFinanceSummaryQuery,
    useGetConfigsQuery,
    useLazyGetConfigsQuery,
    useUpdateConfigMutation,
    
    // Admin Plan hooks
    useGetAdminPlansQuery,
    useLazyGetAdminPlansQuery,
    useGetAdminPlanQuery,
    useLazyGetAdminPlanQuery,
    useCreatePlanMutation,
    useUpdatePlanMutation,
    useDeletePlanMutation,
    
    // Referral hooks
    useGetReferralStatsQuery,
    useLazyGetReferralStatsQuery,
    useAdminUpdateUserReferralMutation,
    
    // Health check
    useCheckBackendHealthQuery,
} = api;
