import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Transaction {
    id: string;
    user_id: number;
    type: 'deposit' | 'withdrawal' | 'subscription' | 'custom_subscription';
    amount: number;
    status: 'pending' | 'new' | 'completed' | 'paid' | 'mismatch' | 'failed' | 'error' | 'cancelled' | 'expired';
    payment_method?: 'plisio' | 'telegram_stars' | 'heleket';
    plisio_invoice_id?: string;
    telegram_stars_order_id?: string;
    created_at: string;
    updated_at?: string;
}

interface TransactionsState {
    pendingTransactions: Transaction[];
    checkingTransactions: string[]; // Array of transaction IDs being checked
    lastCheckedAt: number | null;
    autoCheckEnabled: boolean;
    checkInterval: number; // Interval in milliseconds (default: 30 seconds)
}

const initialState: TransactionsState = {
    pendingTransactions: [],
    checkingTransactions: [],
    lastCheckedAt: null,
    autoCheckEnabled: true,
    checkInterval: 60000, // 60 seconds (increased to reduce load)
};

const transactionsSlice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {
        setPendingTransactions: (state, action: PayloadAction<Transaction[]>) => {
            state.pendingTransactions = action.payload;
        },
        addPendingTransaction: (state, action: PayloadAction<Transaction>) => {
            const exists = state.pendingTransactions.find(tx => tx.id === action.payload.id);
            if (!exists) {
                state.pendingTransactions.push(action.payload);
            }
        },
        removePendingTransaction: (state, action: PayloadAction<string>) => {
            state.pendingTransactions = state.pendingTransactions.filter(
                tx => tx.id !== action.payload
            );
        },
        updateTransactionStatus: (
            state,
            action: PayloadAction<{ id: string; status: Transaction['status'] }>
        ) => {
            const tx = state.pendingTransactions.find(t => t.id === action.payload.id);
            if (tx) {
                tx.status = action.payload.status;
                // Remove from pending if no longer pending
                if (action.payload.status !== 'pending') {
                    state.pendingTransactions = state.pendingTransactions.filter(
                        t => t.id !== action.payload.id
                    );
                }
            }
        },
        addCheckingTransaction: (state, action: PayloadAction<string>) => {
            if (!state.checkingTransactions.includes(action.payload)) {
                state.checkingTransactions.push(action.payload);
            }
        },
        removeCheckingTransaction: (state, action: PayloadAction<string>) => {
            state.checkingTransactions = state.checkingTransactions.filter(
                id => id !== action.payload
            );
        },
        setLastCheckedAt: (state, action: PayloadAction<number>) => {
            state.lastCheckedAt = action.payload;
        },
        setAutoCheckEnabled: (state, action: PayloadAction<boolean>) => {
            state.autoCheckEnabled = action.payload;
        },
        setCheckInterval: (state, action: PayloadAction<number>) => {
            state.checkInterval = action.payload;
        },
        clearTransactions: (state) => {
            state.pendingTransactions = [];
            state.checkingTransactions = [];
            state.lastCheckedAt = null;
        },
    },
});

export const {
    setPendingTransactions,
    addPendingTransaction,
    removePendingTransaction,
    updateTransactionStatus,
    addCheckingTransaction,
    removeCheckingTransaction,
    setLastCheckedAt,
    setAutoCheckEnabled,
    setCheckInterval,
    clearTransactions,
} = transactionsSlice.actions;

export default transactionsSlice.reducer;
