import { useEffect, useRef } from 'react';
import { useSyncUserMutation } from '@/store/api';
import { getTelegramUser, getReferralCodeFromStartParam } from '@/lib/telegram';
import { TelegramSDK } from '@/lib/telegram-sdk';
import { hapticNotification } from '@/lib/telegram';

/**
 * Hook to handle referral registration safely
 * Processes referral codes from start_param or URL query parameters
 * Only processes for new users to prevent referral code abuse
 */
export function useReferralRegistration() {
  const [syncUser] = useSyncUserMutation();
  const processedRef = useRef<Set<string>>(new Set());
  const tgUser = getTelegramUser();

  useEffect(() => {
    if (typeof window === 'undefined' || !tgUser) {
      return;
    }

    const processReferralCode = async (code: string, source: 'start_param' | 'query_param') => {
      // Prevent duplicate processing
      const key = `${code}_${source}`;
      if (processedRef.current.has(key) || !tgUser) {
        return;
      }

      // Validate referral code format (alphanumeric, 3-20 chars)
      if (!/^[a-zA-Z0-9]{3,20}$/.test(code)) {
        console.warn('[REFERRAL] Invalid referral code format:', code);
        return;
      }

      processedRef.current.add(key);

      try {
        console.log(`[REFERRAL] Processing referral code from ${source}:`, code);
        
        // Sync user with referral code - backend will only process for new users
        const result = await syncUser({
          ...tgUser,
          referral_code: code,
        }).unwrap();

        if (result.success) {
          console.log('[REFERRAL] User synced successfully with referral code:', code);
          hapticNotification('success');
          
          // Show success feedback if this is a new registration
          if (result.isNewUser) {
            // You can show a toast or notification here
            console.log('[REFERRAL] New user registered with referral code');
          }
        }
      } catch (error: any) {
        console.error('[REFERRAL] Error syncing user with referral code:', error);
        // Don't show error to user - referral processing is silent
        // Only log for debugging
      }
    };

    // Check start_param (from ?start=CODE links)
    const startParam = getReferralCodeFromStartParam();
    if (startParam) {
      // Only handle referral codes (not payment or wallet redirects)
      if (!startParam.startsWith('payment_tx_') && startParam !== 'wallet') {
        processReferralCode(startParam, 'start_param');
      }
    }

    // Check URL query parameters (from Direct Links: ?ref=CODE)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        processReferralCode(refCode, 'query_param');
      }
    }
  }, [syncUser, tgUser]);

  return {
    processedCodes: Array.from(processedRef.current),
  };
}
