import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    addCheckingTransaction,
    removeCheckingTransaction,
    updateTransactionStatus,
    setLastCheckedAt,
} from '@/store/slices/transactionsSlice';
import { useVerifyPlisioTransactionMutation } from '@/store/api';

// Constants - defined at module level so they're accessible everywhere
const MIN_CHECK_INTERVAL_PER_TX = 60000; // 1 minute minimum between checks for same transaction
const MIN_BATCH_INTERVAL = 10000; // 10 seconds minimum between batch checks
const MAX_BATCH_SIZE = 3; // Max transactions to check per batch
const DELAY_BETWEEN_CHECKS = 1000; // 1 second delay between sequential checks
const INITIAL_DELAY = 5000; // 5 seconds before first check
const MIN_POLL_INTERVAL = 30000; // Minimum polling interval

/**
 * Custom hook for automatically polling and checking pending Plisio transactions.
 * 
 * How it works:
 * - Reads pending transactions from Redux store (synced from RTK Query cache)
 * - Periodically calls verifyPlisioTransaction for each pending Plisio deposit
 * - On successful verification, RTK Query cache invalidation handles:
 *   - Refreshing user balance (via 'User' tag → getCurrentUser refetch)
 *   - Refreshing transaction history (via 'Transactions' tag)
 *   - Refreshing admin stats (via 'Stats' tag)
 * - Updates Redux transactions slice for UI state (checking indicators)
 */
export const useTransactionPolling = () => {
    const dispatch = useAppDispatch();

    const {
        pendingTransactions,
        autoCheckEnabled,
        checkInterval,
        checkingTransactions,
    } = useAppSelector((state) => state.transactions);

    const [verifyPlisioTransaction] = useVerifyPlisioTransactionMutation();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isCheckingRef = useRef(false);
    const lastCheckTimeRef = useRef<number>(0);
    const checkCooldownRef = useRef<Map<string, number>>(new Map());

    // Extract pending Plisio transactions
    const pendingPlisioTransactions = pendingTransactions.filter(
        (tx) =>
            tx.status === 'pending' &&
            tx.type === 'deposit' &&
            (tx.payment_method === 'plisio' || tx.plisio_invoice_id)
    );

    const checkTransaction = useCallback(async (tx: any) => {
        // Skip if already checking this transaction
        if (checkingTransactions.includes(tx.id)) {
            return;
        }

        // Skip if transaction is no longer pending (might have been updated by RTK Query refetch)
        if (tx.status !== 'pending') {
            return;
        }

        // Rate limiting: Don't check the same transaction more than once per minute
        const lastCheckTime = checkCooldownRef.current.get(tx.id) || 0;
        const now = Date.now();

        if ((now - lastCheckTime) < MIN_CHECK_INTERVAL_PER_TX) {
            return; // Skip this check, too soon
        }

        dispatch(addCheckingTransaction(tx.id));
        checkCooldownRef.current.set(tx.id, now);

        try {
            const result = await verifyPlisioTransaction({
                order_number: tx.id,
                txn_id: tx.plisio_invoice_id || tx.id,
            }).unwrap();

            if (result.success) {
                if (result.updated) {
                    // Transaction was verified and updated
                    // RTK Query cache invalidation will automatically:
                    // - Refetch getCurrentUser (updates balance via 'User' tag)
                    // - Refetch transaction history (via 'Transactions' tag)
                    // - Refetch admin stats (via 'Stats' tag)
                    dispatch(updateTransactionStatus({
                        id: tx.id,
                        status: 'completed',
                    }));
                } else if (result.already_completed) {
                    // Transaction was already completed, just update local state
                    dispatch(updateTransactionStatus({
                        id: tx.id,
                        status: 'completed',
                    }));
                }
                // If not updated and not already completed, keep as pending
            }
        } catch (error) {
            console.error(`Error checking transaction ${tx.id}:`, error);
            // Keep transaction as pending on error
        } finally {
            dispatch(removeCheckingTransaction(tx.id));
        }
    }, [checkingTransactions, dispatch, verifyPlisioTransaction]);

    const checkAllPendingTransactions = useCallback(async () => {
        // Prevent concurrent checks
        if (isCheckingRef.current || pendingPlisioTransactions.length === 0) {
            return;
        }

        // Rate limiting: Don't run checks more than once per 10 seconds
        const now = Date.now();
        if ((now - lastCheckTimeRef.current) < MIN_BATCH_INTERVAL) {
            return; // Skip this batch, too soon
        }

        isCheckingRef.current = true;
        lastCheckTimeRef.current = now;

        try {
            // Check only transactions that haven't been checked recently and are still pending
            const transactionsToCheck = pendingPlisioTransactions
                .filter((tx) => {
                    // Must still be pending
                    if (tx.status !== 'pending') {
                        return false;
                    }
                    // Must not be currently checking
                    if (checkingTransactions.includes(tx.id)) {
                        return false;
                    }
                    // Must have passed cooldown period
                    const lastCheck = checkCooldownRef.current.get(tx.id) || 0;
                    return (now - lastCheck) >= MIN_CHECK_INTERVAL_PER_TX;
                })
                .slice(0, MAX_BATCH_SIZE);

            if (transactionsToCheck.length === 0) {
                isCheckingRef.current = false;
                return;
            }

            // Check transactions sequentially with delay to avoid overwhelming the API
            for (const tx of transactionsToCheck) {
                await checkTransaction(tx);
                // Add small delay between checks
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CHECKS));
            }

            dispatch(setLastCheckedAt(now));
        } catch (error) {
            console.error('Error in transaction polling:', error);
        } finally {
            isCheckingRef.current = false;
        }
    }, [pendingPlisioTransactions, checkTransaction, dispatch, checkingTransactions]);

    useEffect(() => {
        if (!autoCheckEnabled || pendingPlisioTransactions.length === 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Don't start immediately, wait a bit
        const initialDelay = setTimeout(() => {
            checkAllPendingTransactions();
        }, INITIAL_DELAY);

        // Set up interval with longer delay
        intervalRef.current = setInterval(() => {
            checkAllPendingTransactions();
        }, Math.max(checkInterval, MIN_POLL_INTERVAL));

        return () => {
            clearTimeout(initialDelay);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoCheckEnabled, checkInterval, pendingPlisioTransactions.length, checkAllPendingTransactions]);

    return {
        pendingTransactions: pendingPlisioTransactions,
        isChecking: checkingTransactions.length > 0,
        checkAllPendingTransactions,
    };
};
