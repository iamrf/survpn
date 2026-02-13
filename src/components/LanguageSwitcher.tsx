import { useState } from "react";
import { motion } from "framer-motion";
import { getTelegramUser, hapticSelection, hapticNotification } from "@/lib/telegram";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { useUpdateUserLanguageMutation } from "@/store/api";
import { useI18n, LanguageCode } from "@/lib/i18n";
import { useToast } from "@/components/ui/use-toast";

const LanguageSwitcher = () => {
  const tgUser = getTelegramUser();
  const { t, language, setLanguage, dir, isRTL } = useI18n();
  const { toast } = useToast();
  const [isLanguageDrawerOpen, setIsLanguageDrawerOpen] = useState(false);
  const [updateUserLanguage, { isLoading: updatingLanguage }] = useUpdateUserLanguageMutation();

  // Supported languages
  const supportedLanguages = [
    { code: 'fa' as LanguageCode, name: 'فارسی', flag: '🇮🇷', nativeName: 'فارسی' },
    { code: 'en' as LanguageCode, name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'ar' as LanguageCode, name: 'العربية', flag: '🇸🇦', nativeName: 'العربية' },
  ];

  const currentLanguage = supportedLanguages.find(lang => lang.code === language) || supportedLanguages[0];

  const handleLanguageChange = async (langCode: LanguageCode) => {
    if (!tgUser) {
      hapticNotification('error');
      toast({
        title: t.common.error,
        description: t.wallet.userNotFound,
        variant: "destructive",
      });
      return;
    }
    
    // Don't do anything if selecting the same language
    if (langCode === language) {
      setIsLanguageDrawerOpen(false);
      return;
    }
    
    hapticSelection();
    
    try {
      const result = await updateUserLanguage({
        userId: tgUser.id,
        languageCode: langCode
      }).unwrap();

      if (result?.success) {
        setLanguage(langCode);
        setIsLanguageDrawerOpen(false);
        hapticNotification('success');
        toast({
          title: t.common.success,
          description: t.settings.languageChanged,
        });
      } else {
        hapticNotification('error');
        toast({
          title: t.common.error,
          description: (result as any)?.error || result?.message || t.common.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error updating language:', error);
      hapticNotification('error');
      const errorMessage = error?.data?.error || 
                          error?.data?.message || 
                          error?.message || 
                          t.common.error;
      toast({
        title: t.common.error,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Drawer open={isLanguageDrawerOpen} onOpenChange={setIsLanguageDrawerOpen}>
      <DrawerTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            hapticSelection();
            setIsLanguageDrawerOpen(true);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-vazir"
          title={t.settings.language}
        >
          <span className="text-lg">{currentLanguage.flag}</span>
          <span className="text-sm font-bold">{currentLanguage.nativeName}</span>
        </motion.button>
      </DrawerTrigger>
      <DrawerContent className="font-vazir" dir={dir}>
        <div className="mx-auto w-full max-w-sm p-6">
          <DrawerHeader>
            <DrawerTitle className={`text-xl font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.settings.selectLanguage}
            </DrawerTitle>
          </DrawerHeader>
          <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
            {supportedLanguages.map((lang) => (
              <motion.button
                key={lang.code}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={updatingLanguage}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${isRTL ? 'text-right' : 'text-left'} ${
                  language === lang.code
                    ? 'bg-primary/20 border-primary text-foreground'
                    : 'bg-background border-white/10 text-foreground hover:border-primary/50'
                }`}
              >
                <div className={`flex items-center gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="text-2xl">{lang.flag}</span>
                  <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm font-bold">{lang.nativeName}</p>
                    <p className="text-xs text-muted-foreground">{lang.name}</p>
                  </div>
                </div>
                {language === lang.code && (
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                )}
              </motion.button>
            ))}
          </div>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full mt-4">{t.common.close}</Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default LanguageSwitcher;
