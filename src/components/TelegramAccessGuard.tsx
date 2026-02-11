import { ReactNode } from "react";
import { config } from "@/lib/config";
import { isTelegramWebApp } from "@/lib/telegram";
import AccessDenied from "@/pages/AccessDenied";

interface TelegramAccessGuardProps {
  children: ReactNode;
}

/**
 * TelegramAccessGuard component
 * 
 * In production mode, this component ensures that the app is only accessible
 * from within Telegram WebApp. In development mode, it allows access for testing.
 */
export const TelegramAccessGuard = ({ children }: TelegramAccessGuardProps) => {
  // In development mode, allow access (for testing)
  if (config.isDev) {
    return <>{children}</>;
  }

  // In production mode, check if running inside Telegram WebApp
  if (config.isProduction) {
    const isInTelegram = isTelegramWebApp();
    
    if (!isInTelegram) {
      return <AccessDenied />;
    }
  }

  // Allow access if we pass all checks
  return <>{children}</>;
};
