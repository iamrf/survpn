import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, translations, getTextDirection, isRTL } from './translations';
import { useAppSelector } from '@/store/hooks';
import { getTelegramUser } from '@/lib/telegram';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: typeof translations.fa;
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const tgUser = getTelegramUser();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  
  // Get language from user settings or Telegram or default to English
  const getUserLanguage = (): LanguageCode => {
    // Priority: user setting > Telegram language > default
    if (currentUser?.languageCode && ['fa', 'en', 'ar'].includes(currentUser.languageCode)) {
      return currentUser.languageCode as LanguageCode;
    }
    if (tgUser?.language_code && ['fa', 'en', 'ar'].includes(tgUser.language_code)) {
      return tgUser.language_code as LanguageCode;
    }
    return 'en'; // Default to English
  };

  // Initialize with English as default, will update when user data loads
  const [language, setLanguageState] = useState<LanguageCode>('en');

  // Initialize and update language when user data changes
  useEffect(() => {
    const newLang = getUserLanguage();
    setLanguageState(newLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.languageCode, tgUser?.language_code]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    // Update document direction
    document.documentElement.dir = getTextDirection(lang);
    document.documentElement.lang = lang;
  };

  // Update document direction when language changes
  useEffect(() => {
    const dir = getTextDirection(language);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    
    // Add/remove RTL class for styling
    if (isRTL(language)) {
      document.documentElement.classList.add('rtl');
      document.documentElement.classList.remove('ltr');
    } else {
      document.documentElement.classList.add('ltr');
      document.documentElement.classList.remove('rtl');
    }
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language],
    dir: getTextDirection(language),
    isRTL: isRTL(language),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
