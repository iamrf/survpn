import { useEffect } from 'react';
import { getTelegramWebApp } from '@/lib/telegram';

/**
 * Hook to apply Telegram theme colors to the app
 * Automatically updates CSS variables based on Telegram theme
 */
export function useTelegramTheme() {
  const webApp = getTelegramWebApp();
  const themeParams = webApp?.themeParams;

  useEffect(() => {
    if (!themeParams) return;

    const root = document.documentElement;

    // Map Telegram theme colors to CSS variables
    if (themeParams.bg_color) {
      root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
    }
    if (themeParams.text_color) {
      root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
    }
    if (themeParams.hint_color) {
      root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
    }
    if (themeParams.link_color) {
      root.style.setProperty('--tg-theme-link-color', themeParams.link_color);
    }
    if (themeParams.button_color) {
      root.style.setProperty('--tg-theme-button-color', themeParams.button_color);
    }
    if (themeParams.button_text_color) {
      root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
    }
    if (themeParams.secondary_bg_color) {
      root.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color);
    }

    // Apply background color
    if (themeParams.bg_color) {
      document.body.style.backgroundColor = themeParams.bg_color;
    }

    // Listen for theme changes
    const handleThemeChange = () => {
      // Re-apply theme when it changes
      if (webApp?.themeParams) {
        // Re-run the effect logic
        const newTheme = webApp.themeParams;
        if (newTheme.bg_color) {
          root.style.setProperty('--tg-theme-bg-color', newTheme.bg_color);
          document.body.style.backgroundColor = newTheme.bg_color;
        }
      }
    };

    // Telegram WebApp may emit theme change events
    webApp?.onEvent?.('themeChanged', handleThemeChange);

    return () => {
      webApp?.offEvent?.('themeChanged', handleThemeChange);
    };
  }, [webApp, themeParams]);

  return {
    themeParams,
    colorScheme: webApp?.colorScheme,
    isDark: webApp?.colorScheme === 'dark',
  };
}
