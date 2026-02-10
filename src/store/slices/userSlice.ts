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
        // Update subscription data when user syncs
        builder.addMatcher(
            api.endpoints.syncUser.matchFulfilled,
            (state, action) => {
                if (action.payload.success && action.payload.subscriptionUrl) {
                    state.subscriptionData = {
                        url: action.payload.subscriptionUrl,
                        limit: action.payload.dataLimit || 0,
                        used: action.payload.dataUsed || 0,
                        expire: action.payload.expire,
                        status: action.payload.status,
                        username: action.payload.username,
                    };
                }
            }
        );
    },
});

export const { setCurrentUser, updateUserBalance, setSubscriptionData, clearUser } = userSlice.actions;
export default userSlice.reducer;
