// Telegram WebApp types and utilities
import { config } from "./config";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  phone_number?: string;
}

export type HapticFeedbackType = 'impact' | 'notification' | 'selection';
export type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type HapticNotificationType = 'error' | 'success' | 'warning';

export interface TelegramMainButton {
  text: string;
  color?: string;
  textColor?: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  setText: (text: string) => void;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
  setParams: (params: {
    text?: string;
    color?: string;
    text_color?: string;
    is_active?: boolean;
    is_visible?: boolean;
  }) => void;
}

export interface TelegramBackButton {
  isVisible: boolean;
  onClick: (callback: () => void) => void;
  offClick: (callback: () => void) => void;
  show: () => void;
  hide: () => void;
}

export interface TelegramHapticFeedback {
  impactOccurred: (style: HapticImpactStyle) => void;
  notificationOccurred: (type: HapticNotificationType) => void;
  selectionChanged: () => void;
}

export interface TelegramWebApp {
  initDataUnsafe?: {
    user?: TelegramUser;
    start_param?: string;
  };
  requestContact?: (callback: (data: { status: string; response?: any }) => void) => void;
  openInvoice?: (invoiceUrl: string, callback?: (status: string) => void) => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
  version?: string;
  platform?: string;
  colorScheme?: 'light' | 'dark';
  themeParams?: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded?: boolean;
  viewportHeight?: number;
  viewportStableHeight?: number;
  headerColor?: string;
  backgroundColor?: string;
  BackButton?: TelegramBackButton;
  MainButton?: TelegramMainButton;
  HapticFeedback?: TelegramHapticFeedback;
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  onEvent?: (eventType: string, eventData: any) => void;
  offEvent?: (eventType: string, eventData: any) => void;
  sendData?: (data: string) => void;
  openTelegramLink?: (url: string) => void;
  showPopup?: (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text?: string;
    }>;
  }, callback?: (id: string) => void) => void;
  showAlert?: (message: string, callback?: () => void) => void;
  showConfirm?: (message: string, callback?: (confirmed: boolean) => void) => void;
  showScanQrPopup?: (params: {
    text?: string;
  }, callback?: (data: string) => void) => void;
  closeScanQrPopup?: () => void;
  readTextFromClipboard?: (callback?: (text: string) => void) => void;
  requestWriteAccess?: (callback?: (granted: boolean) => void) => void;
  requestContact?: (callback?: (granted: boolean) => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

// Mock user data for development outside Telegram
const mockUser: TelegramUser = {
  id: 123456789,
  first_name: "کاربر",
  last_name: "تست",
  username: "testuser",
  language_code: "fa",
};

export function getTelegramUser(): TelegramUser {
  // Check if running inside Telegram
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  // Return mock data when outside Telegram
  return mockUser;
}

export function formatUserId(id: number): string {
  return id.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Get Telegram bot username from WebApp or environment
export function getTelegramBotUsername(): string {
  // Get from environment variable directly (synchronous)
  const botUsername = import.meta.env.VITE_BOT_USERNAME;
  if (botUsername) {
    return botUsername;
  }
  // Fallback - Note: Bot username should be set in VITE_BOT_USERNAME environment variable
  console.warn('Bot username not configured. Please set VITE_BOT_USERNAME in .env file');
  return "your_bot_username";
}

// Get referral code from Telegram start parameter
export function getReferralCodeFromStartParam(): string | null {
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
    return window.Telegram.WebApp.initDataUnsafe.start_param;
  }
  return null;
}

// Check if the app is actually running inside Telegram WebApp (not just mock)
export function isTelegramWebApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  // Check if Telegram WebApp object exists and has required properties
  const hasWebApp = !!window.Telegram?.WebApp;
  const hasUser = !!window.Telegram?.WebApp?.initDataUnsafe?.user;
  const hasValidUser = hasUser && 
    window.Telegram.WebApp.initDataUnsafe.user?.id && 
    window.Telegram.WebApp.initDataUnsafe.user?.first_name;
  
  return hasWebApp && hasValidUser;
}

// Get Telegram WebApp instance
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.Telegram?.WebApp || null;
}

// Haptic Feedback Utilities - with error handling
export function hapticImpact(style: HapticImpactStyle = 'medium'): void {
  try {
    const webApp = getTelegramWebApp();
    if (webApp?.HapticFeedback?.impactOccurred) {
      webApp.HapticFeedback.impactOccurred(style);
    }
  } catch (e) {
    // Silently fail - haptic feedback is optional
    console.warn('Haptic feedback error:', e);
  }
}

export function hapticNotification(type: HapticNotificationType = 'success'): void {
  try {
    const webApp = getTelegramWebApp();
    if (webApp?.HapticFeedback?.notificationOccurred) {
      webApp.HapticFeedback.notificationOccurred(type);
    }
  } catch (e) {
    // Silently fail - haptic feedback is optional
    console.warn('Haptic feedback error:', e);
  }
}

export function hapticSelection(): void {
  try {
    const webApp = getTelegramWebApp();
    if (webApp?.HapticFeedback?.selectionChanged) {
      webApp.HapticFeedback.selectionChanged();
    }
  } catch (e) {
    // Silently fail - haptic feedback is optional
    console.warn('Haptic feedback error:', e);
  }
}

// Initialize Telegram WebApp
export function initTelegramWebApp(): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    // Expand the app to full height
    webApp.expand?.();
    // Call ready to notify Telegram that the app is ready
    webApp.ready?.();
  }
}
