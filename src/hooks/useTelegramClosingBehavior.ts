import { useEffect } from 'react';
import { TelegramSDK } from '@/lib/telegram-sdk';

/**
 * Hook to control Telegram Mini App closing behavior
 * Based on: https://docs.telegram-mini-apps.com/platform/closing-behavior
 * 
 * @param needsConfirmation - Whether closing should require confirmation
 */
export function useTelegramClosingBehavior(needsConfirmation: boolean = false) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        TelegramSDK.setupClosingBehavior(needsConfirmation);
      }
    } catch (e) {
      console.warn('Error setting up closing behavior:', e);
    }
  }, [needsConfirmation]);
}
