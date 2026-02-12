import { useEffect } from 'react';
import { getTelegramWebApp, initTelegramWebApp } from '@/lib/telegram';

/**
 * Main hook to initialize Telegram WebApp
 * Call this once at the app root level
 */
export function useTelegramApp() {
  useEffect(() => {
    try {
      initTelegramWebApp();
    } catch (e) {
      console.warn('Error initializing Telegram WebApp:', e);
    }
  }, []);

  const webApp = getTelegramWebApp();

  return {
    webApp,
    isAvailable: !!webApp,
    version: webApp?.version,
    platform: webApp?.platform,
    colorScheme: webApp?.colorScheme,
    themeParams: webApp?.themeParams,
  };
}
