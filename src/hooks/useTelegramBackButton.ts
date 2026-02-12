import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTelegramWebApp } from '@/lib/telegram';

/**
 * Hook to control Telegram WebApp BackButton
 * Automatically handles navigation when back button is clicked
 * Shows back button on sub-pages, hides on main pages
 * 
 * @example
 * ```tsx
 * // On a sub-page (show back button)
 * useTelegramBackButton();
 * 
 * // On a main page (hide back button)
 * useTelegramBackButton({ isVisible: false });
 * 
 * // Custom navigation
 * useTelegramBackButton({
 *   onClick: () => navigate('/custom'),
 * });
 * ```
 */
export function useTelegramBackButton({
  onClick,
  isVisible,
  fallbackPath = '/',
}: {
  onClick?: () => void;
  isVisible?: boolean;
  fallbackPath?: string;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const webApp = getTelegramWebApp();
  const backButton = webApp?.BackButton;
  const onClickRef = useRef(onClick);
  const navigateRef = useRef(navigate);
  const fallbackPathRef = useRef(fallbackPath);

  // Update refs when they change
  useEffect(() => {
    onClickRef.current = onClick;
    navigateRef.current = navigate;
    fallbackPathRef.current = fallbackPath;
  }, [onClick, navigate, fallbackPath]);

  // Determine if back button should be visible
  // Default: show on sub-pages (not main nav pages), hide on main pages
  const shouldShow = isVisible !== undefined 
    ? isVisible 
    : !['/', '/wallet', '/missions', '/settings'].includes(location.pathname);

  // Create stable no-op functions
  const noop = () => {};

  useEffect(() => {
    if (!backButton) return;

    try {
      // Show/hide button
      if (shouldShow) {
        backButton.show();
      } else {
        backButton.hide();
      }

      // Set up click handler
      const handleClick = () => {
        if (onClickRef.current) {
          onClickRef.current();
        } else {
          // Default: navigate back or to fallback path
          if (window.history.length > 1) {
            navigateRef.current(-1);
          } else {
            navigateRef.current(fallbackPathRef.current);
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
  }, [backButton, shouldShow]);

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
