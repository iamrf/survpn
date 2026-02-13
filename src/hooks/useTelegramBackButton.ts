import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTelegramWebApp } from '@/lib/telegram';

/**
 * Hook to control Telegram WebApp BackButton
 * Automatically handles navigation when back button is clicked
 * 
 * @example
 * ```tsx
 * useTelegramBackButton({
 *   onClick: () => navigate('/home'),
 *   isVisible: true,
 * });
 * ```
 */
export function useTelegramBackButton({
  onClick,
  isVisible = true,
  fallbackPath = '/',
}: {
  onClick?: () => void;
  isVisible?: boolean;
  fallbackPath?: string;
} = {}) {
  const navigate = useNavigate();
  const webApp = getTelegramWebApp();
  const backButton = webApp?.BackButton;

  // Create stable no-op functions
  const noop = () => {};

  useEffect(() => {
    if (!backButton) return;

    try {
      // Show/hide button
      if (isVisible) {
        backButton.show();
      } else {
        backButton.hide();
      }

      // Set up click handler
      const handleClick = () => {
        if (onClick) {
          onClick();
        } else {
          // Default: navigate back or to fallback path
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate(fallbackPath);
          }
        }
      };

      backButton.onClick(handleClick);

      // Cleanup
      return () => {
        try {
          backButton.offClick(handleClick);
          backButton.hide();
        } catch (e) {
          // Ignore cleanup errors
        }
      };
    } catch (e) {
      console.warn('Error setting up Telegram BackButton:', e);
    }
  }, [backButton, isVisible, onClick, navigate, fallbackPath]);

  // Always return the same structure
  return {
    show: backButton ? () => {
      try {
        backButton.show();
      } catch (e) {
        console.warn('Error showing Telegram BackButton:', e);
      }
    } : noop,
    hide: backButton ? () => {
      try {
        backButton.hide();
      } catch (e) {
        console.warn('Error hiding Telegram BackButton:', e);
      }
    } : noop,
  };
}
