import { Button, ButtonProps } from '@/components/ui/button';
import { hapticSelection, getTelegramWebApp } from '@/lib/telegram';
import { cn } from '@/lib/utils';

interface TelegramButtonProps extends ButtonProps {
  useHaptic?: boolean;
  useTelegramTheme?: boolean;
}

/**
 * Button component with Telegram integration
 * - Applies Telegram theme colors when available
 * - Adds haptic feedback on press
 * - Uses Telegram's native button styling
 */
export function TelegramButton({
  children,
  className,
  onClick,
  useHaptic = true,
  useTelegramTheme = true,
  ...props
}: TelegramButtonProps) {
  const webApp = getTelegramWebApp();
  const themeParams = webApp?.themeParams;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (useHaptic) {
      hapticSelection();
    }
    onClick?.(e);
  };

  // Apply Telegram theme colors if available
  const telegramStyles = useTelegramTheme && themeParams
    ? {
        backgroundColor: themeParams.button_color || undefined,
        color: themeParams.button_text_color || undefined,
      }
    : {};

  return (
    <Button
      {...props}
      className={cn(className)}
      onClick={handleClick}
      style={{
        ...telegramStyles,
        ...props.style,
      }}
    >
      {children}
    </Button>
  );
}
