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
import { useVerifyPlisioTransactionMutation, useSyncUserMutation } from '@/store/api';
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
    const [syncUser] = useSyncUserMutation();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isCheckingRef = useRef(false);

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

        dispatch(addCheckingTransaction(tx.id));

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
                    
                    // Refresh user data to update balance
                    if (tgUser) {
                        await syncUser(tgUser).unwrap();
                    }
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
        if (isCheckingRef.current || pendingPlisioTransactions.length === 0) {
            return;
        }

        isCheckingRef.current = true;

        try {
            // Check all pending transactions in parallel (with limit)
            const transactionsToCheck = pendingPlisioTransactions.slice(0, 5); // Limit to 5 at a time
            
            await Promise.allSettled(
                transactionsToCheck.map((tx) => checkTransaction(tx))
            );

            dispatch(setLastCheckedAt(Date.now()));
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

        // Initial check
        checkAllPendingTransactions();

        // Set up interval
        intervalRef.current = setInterval(() => {
            checkAllPendingTransactions();
        }, checkInterval);

        return () => {
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
