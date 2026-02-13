/**
 * Telegram Mini Apps SDK Wrapper
 * Based on: https://docs.telegram-mini-apps.com/platform/methods
 * 
 * This module provides a safe, cross-platform wrapper for Telegram Mini Apps methods
 * that works on Web, Desktop, Mobile, and Windows Phone platforms.
 */

interface MessageJSON {
  eventType: string;
  eventData?: any;
}

/**
 * Detects the current platform and returns the appropriate method caller
 */
function getPlatformMethod(): {
  postEvent: (eventType: string, eventData?: any) => void;
  platform: 'web' | 'desktop' | 'mobile' | 'windows_phone' | 'unknown';
} {
  if (typeof window === 'undefined') {
    return {
      postEvent: () => {},
      platform: 'unknown',
    };
  }

  // Desktop and Mobile: use TelegramWebviewProxy.postEvent
  if (typeof (window as any).TelegramWebviewProxy?.postEvent === 'function') {
    return {
      postEvent: (eventType: string, eventData?: any) => {
        const data = JSON.stringify(eventData || {});
        (window as any).TelegramWebviewProxy.postEvent(eventType, data);
      },
      platform: 'desktop' as const,
    };
  }

  // Windows Phone: use window.external.notify
  if (typeof (window as any).external?.notify === 'function') {
    return {
      postEvent: (eventType: string, eventData?: any) => {
        const message: MessageJSON = {
          eventType,
          eventData,
        };
        const data = JSON.stringify(message);
        (window as any).external.notify(data);
      },
      platform: 'windows_phone' as const,
    };
  }

  // Web: use window.parent.postMessage
  return {
    postEvent: (eventType: string, eventData?: any) => {
      const message: MessageJSON = {
        eventType,
        eventData,
      };
      const data = JSON.stringify(message);
      // Use secure origin - avoid wildcard for security
      const targetOrigin = 'https://web.telegram.org';
      window.parent.postMessage(data, targetOrigin);
    },
    platform: 'web' as const,
  };
}

const platformMethod = getPlatformMethod();

/**
 * Telegram Mini Apps SDK
 * Provides type-safe methods for all Telegram Mini Apps functionality
 */
export const TelegramSDK = {
  /**
   * Get the current platform
   */
  getPlatform: () => platformMethod.platform,

  /**
   * Notify parent iframe that the current frame is ready (Web only)
   * @param reloadSupported - True if current Mini App supports native reloading
   */
  iframeReady: (reloadSupported?: boolean) => {
    platformMethod.postEvent('iframe_ready', { reload_supported: reloadSupported });
  },

  /**
   * Notify parent iframe that the current iframe is going to reload
   */
  iframeWillReload: () => {
    platformMethod.postEvent('iframe_will_reload');
  },

  /**
   * Close the Mini App
   */
  close: () => {
    platformMethod.postEvent('web_app_close');
  },

  /**
   * Expand the Mini App to full height
   */
  expand: () => {
    platformMethod.postEvent('web_app_expand');
  },

  /**
   * Open a link in the default browser (Mini App will not be closed)
   * @param url - Full URL with https protocol
   * @param tryInstantView - Open in Instant View mode if possible (v6.4+)
   */
  openLink: (url: string, tryInstantView?: boolean) => {
    platformMethod.postEvent('web_app_open_link', {
      url,
      try_instant_view: tryInstantView,
    });
  },

  /**
   * Open a link in a new tab (for payment gateways)
   * This is a wrapper around openLink that ensures it opens in a new tab
   */
  openLinkInNewTab: (url: string) => {
    // Use web_app_open_link which opens in default browser (new tab/window)
    platformMethod.postEvent('web_app_open_link', {
      url,
      try_instant_view: false,
    });
  },

  /**
   * Setup back button visibility
   * @param isVisible - Should the button be displayed
   */
  setupBackButton: (isVisible: boolean) => {
    platformMethod.postEvent('web_app_setup_back_button', {
      is_visible: isVisible,
    });
  },

  /**
   * Trigger haptic feedback
   * @param type - Type of haptic event: 'impact', 'notification', or 'selection_change'
   * @param options - Additional options based on type
   */
  triggerHapticFeedback: (
    type: 'impact' | 'notification' | 'selection_change',
    options?: {
      impact_style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
      notification_type?: 'error' | 'success' | 'warning';
    }
  ) => {
    const eventData: any = { type };
    if (type === 'impact' && options?.impact_style) {
      eventData.impact_style = options.impact_style;
    }
    if (type === 'notification' && options?.notification_type) {
      eventData.notification_type = options.notification_type;
    }
    platformMethod.postEvent('web_app_trigger_haptic_feedback', eventData);
  },

  /**
   * Setup main button
   * @param params - Button parameters
   */
  setupMainButton: (params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
    is_progress_visible?: boolean;
  }) => {
    platformMethod.postEvent('web_app_setup_main_button', params);
  },

  /**
   * Setup closing behavior
   * @param needs_confirmation - True if closing should require confirmation
   */
  setupClosingBehavior: (needsConfirmation: boolean) => {
    if (needsConfirmation) {
      platformMethod.postEvent('web_app_enable_closing_confirmation');
    } else {
      platformMethod.postEvent('web_app_disable_closing_confirmation');
    }
  },

  /**
   * Setup swipe behavior
   * @param enabled - True if swipe gestures should be enabled
   */
  setupSwipeBehavior: (enabled: boolean) => {
    // Note: This might need to be implemented via viewport events
    // Check documentation for exact method name
    platformMethod.postEvent('web_app_setup_swipe_behavior', {
      enabled,
    });
  },

  /**
   * Send data to bot
   * @param data - Data to send (max 4096 bytes)
   */
  sendData: (data: string) => {
    if (data.length > 4096) {
      console.error('Data exceeds 4096 bytes limit');
      return;
    }
    platformMethod.postEvent('web_app_data_send', { data });
  },

  /**
   * Show popup
   * @param params - Popup parameters
   */
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text?: string;
    }>;
  }) => {
    platformMethod.postEvent('web_app_open_popup', params);
  },

  /**
   * Show alert
   * @param message - Alert message
   */
  showAlert: (message: string) => {
    platformMethod.postEvent('web_app_show_alert', { message });
  },

  /**
   * Show confirm dialog
   * @param message - Confirmation message
   */
  showConfirm: (message: string) => {
    platformMethod.postEvent('web_app_show_confirm', { message });
  },

  /**
   * Set header color
   * @param colorKey - Color key: 'bg_color' or custom color in #RRGGBB format
   */
  setHeaderColor: (colorKey: string) => {
    platformMethod.postEvent('web_app_set_header_color', {
      color_key: colorKey,
    });
  },

  /**
   * Set background color
   * @param color - Color in #RRGGBB format
   */
  setBackgroundColor: (color: string) => {
    platformMethod.postEvent('web_app_set_background_color', { color });
  },
};

/**
 * Event listener for Telegram Mini Apps events
 * Based on: https://core.telegram.org/api/bots/webapps
 * 
 * Events are emitted by the Telegram client in response to various user actions
 * and Mini App requests. See the official API documentation for all available events.
 */
export class TelegramEventManager {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private initialized: boolean = false;

  constructor() {
    // Don't initialize in constructor - use lazy initialization
  }

  /**
   * Initialize event listeners (call this after Telegram WebApp is ready)
   */
  initialize() {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    try {
      // Listen for events from Telegram via postMessage
      window.addEventListener('message', this.handleMessage.bind(this));
      
      // Also listen to Telegram WebApp events if available
      const webApp = (window as any).Telegram?.WebApp;
      if (webApp?.onEvent) {
        // Viewport events
        webApp.onEvent('viewport_changed', (data: any) => {
          this.emit('viewport_changed', data);
        });
        
        // Theme events
        webApp.onEvent('theme_changed', (data: any) => {
          this.emit('theme_changed', data);
        });
        
        // Button events
        webApp.onEvent('back_button_pressed', () => {
          this.emit('back_button_pressed', {});
        });
        webApp.onEvent('main_button_pressed', () => {
          this.emit('main_button_pressed', {});
        });
        
        // Popup events
        webApp.onEvent('popup_closed', (data: any) => {
          this.emit('popup_closed', data);
        });
        
        // Safe area events (from official API)
        webApp.onEvent('safe_area_changed', (data: any) => {
          this.emit('safe_area_changed', data);
        });
        webApp.onEvent('content_safe_area_changed', (data: any) => {
          this.emit('content_safe_area_changed', data);
        });
      }
      
      this.initialized = true;
    } catch (e) {
      console.warn('Error initializing Telegram event manager:', e);
    }
  }

  private handleMessage(event: MessageEvent) {
    // Verify origin for security
    if (event.origin !== 'https://web.telegram.org' && 
        event.origin !== window.location.origin) {
      return;
    }

    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data.eventType) {
        this.emit(data.eventType, data.eventData);
      }
    } catch (e) {
      // Ignore invalid messages
    }
  }

  private emit(eventType: string, data: any) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (e) {
          console.error(`Error in event listener for ${eventType}:`, e);
        }
      });
    }
  }

  /**
   * Subscribe to an event
   */
  on(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Unsubscribe from an event
   */
  off(eventType: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }
}

// Singleton instance (lazy initialization)
let telegramEventsInstance: TelegramEventManager | null = null;

export function getTelegramEvents(): TelegramEventManager {
  if (!telegramEventsInstance) {
    telegramEventsInstance = new TelegramEventManager();
  }
  return telegramEventsInstance;
}

// Export for backward compatibility
export const telegramEvents = getTelegramEvents();
