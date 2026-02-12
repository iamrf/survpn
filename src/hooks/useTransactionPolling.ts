import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    setPendingTransactions,
    addCheckingTransaction,
    removeCheckingTransaction,
    updateTransactionStatus,
    setLastCheckedAt,
    removePendingTransaction,
} from '@/store/slices/transactionsSlice';
import { useVerifyPlisioTransactionMutation } from '@/store/api';
import { getTelegramUser } from '@/lib/telegram';

/**
 * Custom hook for automatically polling and checking pending transactions
 * This hook runs in the background and checks pending Plisio transactions periodically
 */
export const useTransactionPolling = () => {
    const dispatch = useAppDispatch();
    const tgUser = getTelegramUser();
    
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
    const checkCooldownRef = useRef<Map<string, number>>(new Map()); // Track last check time per transaction

    // Extract pending Plisio transactions
    const pendingPlisioTransactions = pendingTransactions.filter(
        (tx) =>
            tx.status === 'pending' &&
            tx.type === 'deposit' &&
            (tx.payment_method === 'plisio' || tx.plisio_invoice_id)
    );

    const checkTransaction = async (tx: any) => {
        // Skip if already checking this transaction
        if (checkingTransactions.includes(tx.id)) {
            return;
        }

        // Rate limiting: Don't check the same transaction more than once per minute
        const lastCheckTime = checkCooldownRef.current.get(tx.id) || 0;
        const now = Date.now();
        const timeSinceLastCheck = now - lastCheckTime;
        const MIN_CHECK_INTERVAL = 60000; // 1 minute minimum between checks for same transaction

        if (timeSinceLastCheck < MIN_CHECK_INTERVAL) {
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
                const resultAny = result as any;
                if (resultAny.updated) {
                    // Transaction was verified and updated
                    dispatch(updateTransactionStatus({
                        id: tx.id,
                        status: 'completed',
                    }));
                    
                    // Don't call syncUser here - it will be called automatically via cache invalidation
                    // The verifyPlisioTransaction mutation already invalidates 'User' and 'Transactions' tags
                } else if (resultAny.already_completed) {
                    // Transaction was already completed
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
    };

    const checkAllPendingTransactions = async () => {
        // Prevent concurrent checks
        if (isCheckingRef.current || pendingPlisioTransactions.length === 0) {
            return;
        }

        // Rate limiting: Don't run checks more than once per 10 seconds
        const now = Date.now();
        const timeSinceLastCheck = now - lastCheckTimeRef.current;
        const MIN_BATCH_INTERVAL = 10000; // 10 seconds minimum between batch checks

        if (timeSinceLastCheck < MIN_BATCH_INTERVAL) {
            return; // Skip this batch, too soon
        }

        isCheckingRef.current = true;
        lastCheckTimeRef.current = now;

        try {
            // Check only transactions that haven't been checked recently
            const transactionsToCheck = pendingPlisioTransactions
                .filter((tx) => {
                    const lastCheck = checkCooldownRef.current.get(tx.id) || 0;
                    return (now - lastCheck) >= MIN_CHECK_INTERVAL;
                })
                .slice(0, 3); // Limit to 3 at a time to reduce load
            
            if (transactionsToCheck.length === 0) {
                isCheckingRef.current = false;
                return;
            }

            // Check transactions sequentially with delay to avoid overwhelming the API
            for (const tx of transactionsToCheck) {
                await checkTransaction(tx);
                // Add small delay between checks
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
            }

            dispatch(setLastCheckedAt(now));
        } catch (error) {
            console.error('Error in transaction polling:', error);
        } finally {
            isCheckingRef.current = false;
        }
    };

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
        }, 5000); // Wait 5 seconds before first check

        // Set up interval with longer delay
        intervalRef.current = setInterval(() => {
            checkAllPendingTransactions();
        }, Math.max(checkInterval, 30000)); // Minimum 30 seconds

        return () => {
            clearTimeout(initialDelay);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoCheckEnabled, checkInterval, pendingPlisioTransactions.length]);

    return {
        pendingTransactions: pendingPlisioTransactions,
        isChecking: checkingTransactions.length > 0,
        checkAllPendingTransactions,
    };
};
