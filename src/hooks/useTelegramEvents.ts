import { useEffect } from 'react';
import { getTelegramEvents } from '@/lib/telegram-sdk';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to handle Telegram Mini Apps events
 * Based on: https://core.telegram.org/api/bots/webapps
 * 
 * Handles:
 * - Back button presses
 * - Viewport changes
 * - Theme changes
 * - Popup closures
 * - Safe area changes
 */
export function useTelegramEvents() {
  const navigate = useNavigate();

  useEffect(() => {
    // Only initialize if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Get event manager instance (will be initialized if not already)
    const events = getTelegramEvents();
    
    // Ensure events are initialized (but don't crash if it fails)
    try {
      events.initialize();
    } catch (e) {
      console.warn('Could not initialize Telegram events:', e);
      return;
    }

    // Handle back button press
    const unsubscribeBackButton = events.on('back_button_pressed', () => {
      try {
        // Navigate back or to home
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/');
        }
      } catch (e) {
        console.error('Error handling back button:', e);
      }
    });

    // Handle viewport changes (for responsive design)
    const unsubscribeViewport = events.on('viewport_changed', (data: any) => {
      try {
        // Update viewport height if needed
        if (data?.height && typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--tg-viewport-height', `${data.height}px`);
        }
      } catch (e) {
        console.error('Error handling viewport change:', e);
      }
    });

    // Handle theme changes
    const unsubscribeTheme = events.on('theme_changed', (data: any) => {
      // Update theme if needed
      console.log('Theme changed:', data);
    });

    // Handle popup closures
    const unsubscribePopup = events.on('popup_closed', (data: any) => {
      console.log('Popup closed:', data);
    });

    // Handle safe area changes (from official API)
    const unsubscribeSafeArea = events.on('safe_area_changed', (data: any) => {
      try {
        if (data && typeof document !== 'undefined') {
          // Update CSS variables for safe area insets
          if (data.top !== undefined) {
            document.documentElement.style.setProperty('--tg-safe-area-top', `${data.top}px`);
          }
          if (data.bottom !== undefined) {
            document.documentElement.style.setProperty('--tg-safe-area-bottom', `${data.bottom}px`);
          }
          if (data.left !== undefined) {
            document.documentElement.style.setProperty('--tg-safe-area-left', `${data.left}px`);
          }
          if (data.right !== undefined) {
            document.documentElement.style.setProperty('--tg-safe-area-right', `${data.right}px`);
          }
        }
      } catch (e) {
        console.error('Error handling safe area change:', e);
      }
    });

    // Cleanup
    return () => {
      unsubscribeBackButton();
      unsubscribeViewport();
      unsubscribeTheme();
      unsubscribePopup();
      unsubscribeSafeArea();
    };
  }, [navigate]);
}
