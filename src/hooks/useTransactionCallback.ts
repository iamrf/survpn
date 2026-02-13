import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSyncUserMutation } from '@/store/api';
import { getTelegramUser } from '@/lib/telegram';
import { TelegramSDK } from '@/lib/telegram-sdk';
import { hapticNotification } from '@/lib/telegram';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n';

/**
 * Hook to handle transaction callbacks from payment gateways
 * Processes payment redirects from Telegram Direct Links and start parameters
 * 
 * Handles:
 * - Payment callbacks: ?payment=callback&tx=ORDERID
 * - Start parameter redirects: payment_tx_ORDERID
 * - Automatic transaction verification
 */
export function useTransactionCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { toast } = useToast();
  const [syncUser] = useSyncUserMutation();
  const processedRef = useRef<Set<string>>(new Set());
  const tgUser = getTelegramUser();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handlePaymentCallback = async () => {
      const params = new URLSearchParams(location.search);
      const txId = params.get('tx');
      const paymentStatus = params.get('payment');

      // Handle payment callback from Direct Link: ?payment=callback&tx=ORDERID
      if (paymentStatus === 'callback' && txId) {
        const key = `callback_${txId}`;
        if (processedRef.current.has(key)) return;
        processedRef.current.add(key);

        console.log('[PAYMENT] Payment callback detected, transaction ID:', txId);
        
        // Navigate to wallet page with transaction info
        navigate(`/wallet?payment=${params.get('status') === 'failed' ? 'failed' : 'pending'}&tx=${txId}`, { replace: true });
        
        // Provide haptic feedback
        hapticNotification('success');
        
        return;
      }

      // Handle payment redirect from start parameter: payment_tx_ORDERID
      if (typeof window !== 'undefined') {
        try {
          const { getReferralCodeFromStartParam } = await import('@/lib/telegram');
          const startParam = getReferralCodeFromStartParam();
          
          if (startParam?.startsWith('payment_tx_')) {
            const orderId = startParam.replace('payment_tx_', '');
            const key = `start_${orderId}`;
            
            if (processedRef.current.has(key)) return;
            processedRef.current.add(key);

            console.log('[PAYMENT] Payment redirect from start param, transaction ID:', orderId);
            
            // Navigate to wallet page
            navigate(`/wallet?payment=pending&tx=${orderId}`, { replace: true });
            
            // Provide haptic feedback
            hapticNotification('success');
          }
        } catch (e) {
          console.error('Error handling payment callback:', e);
        }
      }
    };

    handlePaymentCallback();
  }, [navigate, location.search]);
}
