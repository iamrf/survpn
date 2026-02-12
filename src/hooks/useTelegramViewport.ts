import { useEffect } from 'react';
import { getTelegramWebApp } from '@/lib/telegram';

/**
 * Hook to handle Telegram WebApp viewport changes
 * Automatically expands the app and adjusts viewport
 */
export function useTelegramViewport() {
  const webApp = getTelegramWebApp();

  useEffect(() => {
    if (!webApp) return;

    try {
      // Expand the app to full height
      webApp.expand?.();

      // Listen for viewport changes
      const handleViewportChange = () => {
        // Viewport changed, app can adjust layout
        // Telegram automatically sends viewportChanged event
      };

      webApp.onEvent?.('viewportChanged', handleViewportChange);

      return () => {
        webApp.offEvent?.('viewportChanged', handleViewportChange);
      };
    } catch (e) {
      console.warn('Error setting up Telegram viewport:', e);
    }
  }, [webApp]);

  return {
    viewportHeight: webApp?.viewportHeight,
    viewportStableHeight: webApp?.viewportStableHeight,
    isExpanded: webApp?.isExpanded,
  };
}
