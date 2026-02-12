import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';
import transactionsReducer from './slices/transactionsSlice';

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
                ignoredActions: ['persist/PERSIST'],
            },
        }).concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
