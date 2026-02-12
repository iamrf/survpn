import { useEffect } from 'react';
import { getTelegramWebApp } from '@/lib/telegram';

/**
 * Hook to enable/disable Telegram WebApp closing confirmation
 * Useful when user has unsaved changes
 * 
 * @example
 * ```tsx
 * // Enable closing confirmation when form has unsaved changes
 * useTelegramClosingConfirmation({ enabled: hasUnsavedChanges });
 * ```
 */
export function useTelegramClosingConfirmation({
  enabled = false,
}: {
  enabled?: boolean;
} = {}) {
  const webApp = getTelegramWebApp();

  useEffect(() => {
    if (!webApp) return;

    try {
      if (enabled) {
        webApp.enableClosingConfirmation?.();
      } else {
        webApp.disableClosingConfirmation?.();
      }
    } catch (e) {
      console.warn('Error setting Telegram closing confirmation:', e);
    }
  }, [webApp, enabled]);
}
