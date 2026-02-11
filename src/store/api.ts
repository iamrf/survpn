import { createApi, fetchBaseQuery, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import { config } from '../lib/config';

const API_URL = config.apiUrl || '';

// Define base query with error handling and retry logic
const baseQueryWithRetry: BaseQueryFn = async (args, api, extraOptions) => {
    const baseQueryFn = fetchBaseQuery({
        baseUrl: API_URL,
        prepareHeaders: (headers) => {
            headers.set('Content-Type', 'application/json');
            return headers;
        },
        timeout: 30000,
    });

    let result = await baseQueryFn(args, api, extraOptions);

    // Retry logic for network errors
    if (result.error && 'status' in result.error) {
        const status = result.error.status;
        // Retry on network errors (status 0 or 500-599)
        if (status === 'FETCH_ERROR' || (typeof status === 'number' && status >= 500 && status < 600)) {
            // Retry once after 1 second
            await new Promise(resolve => setTimeout(resolve, 1000));
            result = await baseQueryFn(args, api, extraOptions);
        }
    }

    return result;
};

const baseQuery = baseQueryWithRetry;

export const api = createApi({
    reducerPath: 'api',
    baseQuery,
    tagTypes: [
        'User',
        'Plans',
        'AdminPlans',
        'Users',
        'UserDetail',
        'Transactions',
        'Withdrawals',
        'Configs',
        'Stats',
        'FinanceSummary',
        'ReferralStats',
    ],
    endpoints: (builder) => ({
        // User endpoints
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

        // Payment endpoints
        createPayment: builder.mutation<{ success: boolean; invoice_url?: string; error?: string }, { userId: number; amount: number }>({
            query: ({ userId, amount }) => ({
                url: '/api/payment/create',
                method: 'POST',
                body: { userId, amount },
            }),
        }),

        // Transaction endpoints
        getTransactionHistory: builder.query<{ success: boolean; history?: any[] }, number>({
            query: (userId) => `/api/transactions/${userId}`,
            providesTags: ['Transactions'],
        }),

        // Withdrawal endpoints
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
            invalidatesTags: ['User', 'Withdrawals'],
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
            invalidatesTags: ['Withdrawals'],
        }),

        // Plans endpoints
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
            invalidatesTags: ['User', 'Plans'],
        }),

        createCustomSubscription: builder.mutation<{ success: boolean; message?: string; error?: string }, {
            userId: number;
            traffic: number;
            duration: number;
            notes: string;
        }>({
            query: (body) => ({
                url: '/api/create-custom-subscription',
                method: 'POST',
                body,
            }),
        }),

        // Admin endpoints
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
            invalidatesTags: (result, error, { userId }) => [{ type: 'UserDetail', id: userId }, 'Users'],
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
            invalidatesTags: (result, error, { userId }) => [{ type: 'UserDetail', id: userId }, 'Users'],
        }),

        getAllWithdrawals: builder.query<{ success: boolean; withdrawals?: any[] }, void>({
            query: () => '/api/admin/withdrawals',
            providesTags: ['Withdrawals'],
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
            invalidatesTags: ['Withdrawals', 'Users'],
        }),

        getTotalDeposits: builder.query<{ success: boolean; total: number }, void>({
            query: () => '/api/admin/stats/total-deposits',
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

        // Referral endpoints
        getReferralStats: builder.query<{
            success: boolean;
            stats?: {
                referralCount: number;
                totalCommissions: number;
                recentCommissions: any[];
            };
        }, number>({
            query: (userId) => `/api/user/${userId}/referral-stats`,
            providesTags: ['ReferralStats'],
        }),

        // Admin: Update User Referral Settings
        adminUpdateUserReferral: builder.mutation<{ success: boolean; message?: string; error?: string }, {
            userId: string;
            referral_bonus_rate?: number;
            referral_registration_bonus?: number;
        }>({
            query: ({ userId, ...body }) => ({
                url: `/api/admin/user/${userId}/referral`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { userId }) => [{ type: 'UserDetail', id: userId }, 'Users', 'ReferralStats'],
        }),

        // Health check
        checkBackendHealth: builder.query<boolean, void>({
            query: () => '/health',
        }),
    }),
});

export const {
    // User hooks
    useSyncUserMutation,
    useUpdateWalletAddressMutation,
    useUpdateWithdrawalPasskeyMutation,
    
    // Payment hooks
    useCreatePaymentMutation,
    
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
    useGetTotalDepositsQuery,
    useLazyGetTotalDepositsQuery,
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
