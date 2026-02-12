import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api';

interface UserState {
    currentUser: {
        id?: number;
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
    } | null;
    subscriptionData: {
        url: string;
        limit: number;
        used: number;
        expire?: number;
        status?: string;
        username?: string;
        planName?: string;
        isBonus?: boolean;
    } | null;
}

const initialState: UserState = {
    currentUser: null,
    subscriptionData: null,
};

/**
 * Helper to extract user state from a sync/getCurrentUser response
 */
function extractUserFromPayload(payload: any, userId?: number): UserState['currentUser'] {
    return {
        id: userId,
        isAdmin: payload.isAdmin,
        balance: payload.balance,
        referralCode: payload.referralCode,
        phoneNumber: payload.phoneNumber,
        createdAt: payload.createdAt,
        lastSeen: payload.lastSeen,
        languageCode: payload.languageCode,
        walletAddress: payload.walletAddress,
        hasPasskey: payload.hasPasskey,
        subscriptionUrl: payload.subscriptionUrl,
        dataLimit: payload.dataLimit,
        dataUsed: payload.dataUsed,
        expire: payload.expire,
        status: payload.status,
        username: payload.username,
    };
}

function updateSubscriptionFromPayload(state: UserState, payload: any) {
    if (payload.subscriptionUrl) {
        state.subscriptionData = {
            url: payload.subscriptionUrl,
            limit: payload.dataLimit || 0,
            used: payload.dataUsed || 0,
            expire: payload.expire,
            status: payload.status,
            username: payload.username,
        };
    }
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setCurrentUser: (state, action: PayloadAction<UserState['currentUser']>) => {
            state.currentUser = action.payload;
        },
        updateUserBalance: (state, action: PayloadAction<number>) => {
            if (state.currentUser) {
                state.currentUser.balance = action.payload;
            }
        },
        setSubscriptionData: (state, action: PayloadAction<UserState['subscriptionData']>) => {
            state.subscriptionData = action.payload;
        },
        clearUser: (state) => {
            state.currentUser = null;
            state.subscriptionData = null;
        },
    },
    extraReducers: (builder) => {
        // Update current user when syncUser mutation succeeds
        builder.addMatcher(
            api.endpoints.syncUser.matchFulfilled,
            (state, action) => {
                if (action.payload.success) {
                    state.currentUser = extractUserFromPayload(
                        action.payload,
                        action.meta.arg?.originalArgs?.id
                    );
                    updateSubscriptionFromPayload(state, action.payload);
                }
            }
        );

        // Update current user when getCurrentUser query succeeds
        builder.addMatcher(
            api.endpoints.getCurrentUser.matchFulfilled,
            (state, action) => {
                if (action.payload.success) {
                    state.currentUser = extractUserFromPayload(
                        action.payload,
                        action.meta.arg?.originalArgs?.id
                    );
                    updateSubscriptionFromPayload(state, action.payload);
                }
            }
        );
    },
});

export const { setCurrentUser, updateUserBalance, setSubscriptionData, clearUser } = userSlice.actions;
export default userSlice.reducer;
