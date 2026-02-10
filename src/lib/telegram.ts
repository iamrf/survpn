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

export interface TelegramWebApp {
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  requestContact?: (callback: (data: { status: string; response?: any }) => void) => void;
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
