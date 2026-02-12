import { useEffect, useRef, useCallback } from 'react';
import { getTelegramWebApp } from '@/lib/telegram';

interface UseTelegramMainButtonOptions {
  text: string;
  onClick?: () => void;
  color?: string;
  textColor?: string;
  isVisible?: boolean;
  isActive?: boolean;
  isProgressVisible?: boolean;
}

/**
 * Hook to control Telegram WebApp MainButton
 * Always returns the same structure to comply with Rules of Hooks
 * 
 * @example
 * ```tsx
 * const { show, hide, setText } = useTelegramMainButton({
 *   text: 'Submit',
 *   onClick: handleSubmit,
 *   isVisible: true,
 * });
 * ```
 */
export function useTelegramMainButton({
  text,
  onClick,
  color,
  textColor,
  isVisible = false,
  isActive = true,
  isProgressVisible = false,
}: UseTelegramMainButtonOptions) {
  const webApp = getTelegramWebApp();
  const mainButton = webApp?.MainButton;
  const onClickRef = useRef(onClick);

  // Update onClick ref when it changes
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  // Create stable no-op functions
  const noop = useCallback(() => {}, []);
  const noopWithParam = useCallback((_param?: any) => {}, []);
  const noopSetParams = useCallback((_params?: any) => {}, []);

  // Set up button text
  useEffect(() => {
    if (!mainButton) return;
    try {
      mainButton.setText(text);
    } catch (e) {
      console.warn('Error setting MainButton text:', e);
    }
  }, [mainButton, text]);

  // Set up button colors
  useEffect(() => {
    if (!mainButton) return;
    try {
      if (color) mainButton.setParams({ color });
      if (textColor) mainButton.setParams({ text_color: textColor });
    } catch (e) {
      console.warn('Error setting MainButton colors:', e);
    }
  }, [mainButton, color, textColor]);

  // Set up button visibility and active state
  useEffect(() => {
    if (!mainButton) return;
    try {
      mainButton.setParams({ is_active: isActive, is_visible: isVisible });
    } catch (e) {
      console.warn('Error setting MainButton state:', e);
    }
  }, [mainButton, isActive, isVisible]);

  // Set up click handler - only once
  useEffect(() => {
    if (!mainButton) return;
    try {
      const handleClick = () => {
        onClickRef.current?.();
      };
      mainButton.onClick(handleClick);

      return () => {
        try {
          mainButton.offClick(handleClick);
        } catch (e) {
          // Ignore cleanup errors
        }
      };
    } catch (e) {
      console.warn('Error setting up Telegram MainButton click handler:', e);
    }
  }, [mainButton]); // Only depend on mainButton, onClick is in ref

  // Handle progress visibility
  useEffect(() => {
    if (!mainButton) return;
    try {
      if (isProgressVisible) {
        mainButton.showProgress();
      } else {
        mainButton.hideProgress();
      }
    } catch (e) {
      console.warn('Error setting MainButton progress:', e);
    }
  }, [mainButton, isProgressVisible]);

  // Always return the same structure
  return {
    show: mainButton ? () => {
      try {
        mainButton.show();
      } catch (e) {
        console.warn('Error showing Telegram MainButton:', e);
      }
    } : noop,
    hide: mainButton ? () => {
      try {
        mainButton.hide();
      } catch (e) {
        console.warn('Error hiding Telegram MainButton:', e);
      }
    } : noop,
    enable: mainButton ? () => {
      try {
        mainButton.enable();
      } catch (e) {
        console.warn('Error enabling Telegram MainButton:', e);
      }
    } : noop,
    disable: mainButton ? () => {
      try {
        mainButton.disable();
      } catch (e) {
        console.warn('Error disabling Telegram MainButton:', e);
      }
    } : noop,
    setText: mainButton ? (newText: string) => {
      try {
        mainButton.setText(newText);
      } catch (e) {
        console.warn('Error setting Telegram MainButton text:', e);
      }
    } : noopWithParam,
    showProgress: mainButton ? (leaveActive?: boolean) => {
      try {
        mainButton.showProgress(leaveActive);
      } catch (e) {
        console.warn('Error showing Telegram MainButton progress:', e);
      }
    } : noopWithParam,
    hideProgress: mainButton ? () => {
      try {
        mainButton.hideProgress();
      } catch (e) {
        console.warn('Error hiding Telegram MainButton progress:', e);
      }
    } : noop,
    setParams: mainButton ? (params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }) => {
      try {
        mainButton.setParams(params);
      } catch (e) {
        console.warn('Error setting Telegram MainButton params:', e);
      }
    } : noopSetParams,
  };
}
