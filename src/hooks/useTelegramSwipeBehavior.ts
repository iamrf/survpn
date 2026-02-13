import { useEffect } from 'react';
import { TelegramSDK } from '@/lib/telegram-sdk';

/**
 * Hook to control Telegram Mini App swipe behavior
 * Based on: https://docs.telegram-mini-apps.com/platform/swipe-behavior
 * 
 * @param enabled - Whether swipe gestures should be enabled
 */
export function useTelegramSwipeBehavior(enabled: boolean = true) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Delay to ensure Telegram WebApp is ready
    const timer = setTimeout(() => {
      try {
        TelegramSDK.setupSwipeBehavior(enabled);
      } catch (e) {
        // Silently fail - swipe behavior is optional
        console.warn('Error setting up swipe behavior:', e);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [enabled]);
}
