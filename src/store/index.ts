import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';
import transactionsReducer from './slices/transactionsSlice';

/**
 * Configure Redux store with best practices:
 * - Redux DevTools integration (automatic in development)
 * - Proper middleware setup
 * - Serializable check configuration
 * - Hot module replacement support
 */
export const store = configureStore({
    reducer: {
        api: api.reducer,
        user: userReducer,
        ui: uiReducer,
        transactions: transactionsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore non-serializable values in actions
                ignoredActions: ['persist/PERSIST'],
            },
            // Disable immutability check in production for performance
            immutableCheck: process.env.NODE_ENV !== 'production',
        }).concat(api.middleware),
    // Enable Redux DevTools in development
    devTools: process.env.NODE_ENV !== 'production',
});

// Hot module replacement for development (optional - only if HMR is available)
if (process.env.NODE_ENV !== 'production') {
    try {
        if (typeof module !== 'undefined' && module.hot) {
            module.hot.accept('./slices/userSlice', () => {
                // HMR will handle the update automatically
            });
            module.hot.accept('./slices/uiSlice', () => {
                // HMR will handle the update automatically
            });
            module.hot.accept('./slices/transactionsSlice', () => {
                // HMR will handle the update automatically
            });
            module.hot.accept('./api', () => {
                // HMR will handle the update automatically
            });
        }
    } catch (e) {
        // HMR not available, ignore
    }
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
