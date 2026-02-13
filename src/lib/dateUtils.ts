import { useI18n } from './i18n';

/**
 * Format date based on language
 * - English: Standard Gregorian format
 * - Arabic: Hijri (Islamic) calendar format
 * - Persian: Persian (Jalali) calendar format
 */
export function formatDateByLanguage(
  date: Date | string | number,
  language: 'en' | 'ar' | 'fa',
  options?: {
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
    includeTime?: boolean;
  }
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  // For English: Use standard Gregorian calendar
  if (language === 'en') {
    const formatOptions: Intl.DateTimeFormatOptions = {
      dateStyle: options?.dateStyle || 'medium',
      ...(options?.includeTime && {
        timeStyle: options?.timeStyle || 'short',
      }),
    };
    return new Intl.DateTimeFormat('en-US', formatOptions).format(dateObj);
  }

  // For Arabic: Use Hijri (Islamic) calendar
  if (language === 'ar') {
    try {
      // Try to use Intl with Islamic calendar
      const formatOptions: Intl.DateTimeFormatOptions = {
        calendar: 'islamic',
        dateStyle: options?.dateStyle || 'medium',
        ...(options?.includeTime && {
          timeStyle: options?.timeStyle || 'short',
        }),
      };
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', formatOptions).format(dateObj);
    } catch (error) {
      // Fallback to Arabic numerals with Gregorian calendar if Islamic calendar not supported
      return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...(options?.includeTime && {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }).format(dateObj);
    }
  }

  // For Persian: Use Persian (Jalali) calendar
  if (language === 'fa') {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(options?.includeTime && {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }).format(dateObj);
  }

  // Default fallback
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: options?.dateStyle || 'medium',
    ...(options?.includeTime && {
      timeStyle: options?.timeStyle || 'short',
    }),
  }).format(dateObj);
}

/**
 * Hook version that uses current language context
 */
export function useFormatDate() {
  const { language, isRTL } = useI18n();

  const format = (
    date: Date | string | number,
    options?: {
      dateStyle?: 'full' | 'long' | 'medium' | 'short';
      timeStyle?: 'full' | 'long' | 'medium' | 'short';
      includeTime?: boolean;
    }
  ): string => {
    return formatDateByLanguage(date, language, options);
  };

  const formatDateTime = (
    date: Date | string | number,
    options?: {
      dateStyle?: 'full' | 'long' | 'medium' | 'short';
      timeStyle?: 'full' | 'long' | 'medium' | 'short';
    }
  ): string => {
    return formatDateByLanguage(date, language, { ...options, includeTime: true });
  };

  const formatDateOnly = (
    date: Date | string | number,
    options?: {
      dateStyle?: 'full' | 'long' | 'medium' | 'short';
    }
  ): string => {
    return formatDateByLanguage(date, language, { ...options, includeTime: false });
  };

  const formatTime = (
    date: Date | string | number,
    options?: {
      timeStyle?: 'full' | 'long' | 'medium' | 'short';
    }
  ): string => {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;

    if (isNaN(dateObj.getTime())) {
      return 'Invalid Time';
    }

    const locale = language === 'en' ? 'en-US' : language === 'ar' ? 'ar-SA' : 'fa-IR';
    
    return new Intl.DateTimeFormat(locale, {
      timeStyle: options?.timeStyle || 'short',
    }).format(dateObj);
  };

  return { format, formatDateTime, formatDateOnly, formatTime, language, isRTL };
}
