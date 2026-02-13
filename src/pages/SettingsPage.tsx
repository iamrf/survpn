import { motion } from "framer-motion";
import { Settings, User, Phone, Shield, ChevronLeft, CreditCard, Share2, LogOut, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { getTelegramUser, hapticImpact, hapticNotification, hapticSelection } from "@/lib/telegram";
import { useSyncUserMutation, useGetCurrentUserQuery, useUpdateWalletAddressMutation, useUpdateWithdrawalPasskeyMutation, useUpdateUserLanguageMutation } from "@/store/api";
import { useAppSelector } from "@/store/hooks";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { TelegramButton } from "@/components/TelegramButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { useTelegramClosingConfirmation } from "@/hooks/useTelegramClosingConfirmation";
import { useI18n, LanguageCode } from "@/lib/i18n";

const SettingsPage = () => {
  const tgUser = getTelegramUser();
  const { t, language, setLanguage, dir, isRTL } = useI18n();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const [newWalletAddress, setNewWalletAddress] = useState<string>("");
  const [newPasskey, setNewPasskey] = useState<string>("");
  const [isWalletDrawerOpen, setIsWalletDrawerOpen] = useState(false);
  const [isPasskeyDrawerOpen, setIsPasskeyDrawerOpen] = useState(false);
  const [isLanguageDrawerOpen, setIsLanguageDrawerOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Telegram BackButton - hide on settings page (it's a main page)
  useTelegramBackButton({ isVisible: false });

  // RTK Query hooks
  const [syncUser] = useSyncUserMutation();
  const [updateWalletAddress, { isLoading: updatingWallet }] = useUpdateWalletAddressMutation();
  const [updateWithdrawalPasskey, { isLoading: updatingPasskey }] = useUpdateWithdrawalPasskeyMutation();
  const [updateUserLanguage, { isLoading: updatingLanguage }] = useUpdateUserLanguageMutation();
  
  // Subscribe to user data for automatic refresh via tag invalidation
  useGetCurrentUserQuery(tgUser, { skip: !tgUser });
  
  const phoneNumber = currentUser?.phoneNumber || null;
  const walletAddress = currentUser?.walletAddress || "";
  const hasPasskey = currentUser?.hasPasskey || false;
  const isAdmin = currentUser?.isAdmin || false;
  
  // Enable closing confirmation when forms have unsaved changes
  const hasUnsavedChanges = (newWalletAddress !== walletAddress && newWalletAddress) || 
                           (newPasskey.length === 4 && newPasskey !== '');
  useTelegramClosingConfirmation({ enabled: hasUnsavedChanges });
  const extraData = {
    createdAt: currentUser?.createdAt,
    lastSeen: currentUser?.lastSeen,
    languageCode: currentUser?.languageCode,
    balance: currentUser?.balance,
    referralCode: currentUser?.referralCode
  };

  // User data is automatically synced via getCurrentUser query in App.tsx
  // and kept up-to-date via RTK Query tag invalidation

  useEffect(() => {
    if (currentUser?.walletAddress) {
      setNewWalletAddress(currentUser.walletAddress);
    }
  }, [currentUser?.walletAddress]);

  const handleUpdateWallet = async () => {
    if (!newWalletAddress || !tgUser) return;
    try {
      const result = await updateWalletAddress({
        userId: tgUser.id,
        walletAddress: newWalletAddress
      }).unwrap();
      
    if (result.success) {
        hapticNotification('success');
        // User data auto-refreshed via RTK Query tag invalidation ('User' tag)
      setIsWalletDrawerOpen(false);
        toast({ title: t.common.success, description: t.settings.walletUpdated });
    } else {
        hapticNotification('error');
        toast({ title: t.common.error, description: t.common.error, variant: "destructive" });
      }
    } catch (error: any) {
      hapticNotification('error');
      toast({ 
        title: t.common.error, 
        description: error?.data?.error || t.common.error, 
        variant: "destructive" 
      });
    }
  };

  const handleUpdatePasskey = async () => {
    if (!newPasskey || !tgUser) return;
    try {
      const result = await updateWithdrawalPasskey({
        userId: tgUser.id,
        passkey: newPasskey
      }).unwrap();
      
    if (result.success) {
        hapticNotification('success');
        // User data auto-refreshed via RTK Query tag invalidation ('User' tag)
      setNewPasskey("");
      setIsPasskeyDrawerOpen(false);
        toast({ title: t.common.success, description: t.settings.passkeySetSuccess });
    } else {
        hapticNotification('error');
        toast({ title: t.common.error, description: t.common.error, variant: "destructive" });
      }
    } catch (error: any) {
      hapticNotification('error');
      toast({ 
        title: t.common.error, 
        description: error?.data?.error || t.common.error, 
        variant: "destructive" 
      });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "نامشخص";
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const handleVerifyPhone = () => {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.requestContact) {
      setVerifying(true);
      webApp.requestContact(async (arg: any) => {
        console.log("Telegram requestContact callback arg:", arg);
        // Handle both boolean and object responses observed in different versions
        const isSent = arg === true || (typeof arg === 'object' && arg.status === 'sent');

        if (isSent) {
          // After user shares contact, phone number is available in initDataUnsafe.user.phone_number
          // Wait a bit for Telegram to update the initData
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Get phone number from initDataUnsafe
          const phoneFromInitData = webApp.initDataUnsafe?.user?.phone_number;
          
          // Also try to get from callback response if available
          const contact = arg?.response?.contact || arg?.contact;
          const phoneFromCallback = contact?.phone_number;
          
          // Use phone from initData first, then callback, then null
          const phoneToSync = phoneFromInitData || phoneFromCallback || null;

          if (phoneToSync) {
            try {
              const result = await syncUser({ ...tgUser, phone_number: phoneToSync });
              if (result.data?.success) {
                hapticNotification('success');
                toast({
                  title: t.common.success,
                  description: t.settings.phoneVerified,
                });
              } else {
                hapticNotification('error');
                toast({
                  title: t.common.error,
                  description: t.settings.phoneVerificationFailed,
                  variant: "destructive"
                });
              }
            } catch (error) {
              hapticNotification('error');
              console.error("Error syncing phone number:", error);
            toast({
                title: t.common.error,
                description: t.settings.phoneVerificationFailed,
                variant: "destructive"
            });
            }
          } else {
            // Phone number not available yet, try again after a delay
            toast({
              title: t.common.loading,
              description: t.common.loading,
            });
            setTimeout(async () => {
              const retryPhone = webApp.initDataUnsafe?.user?.phone_number;
              if (retryPhone) {
                try {
                  const result = await syncUser({ ...tgUser, phone_number: retryPhone });
                  if (result.data?.success) {
                    hapticNotification('success');
                    toast({
                      title: t.common.success,
                      description: t.settings.phoneVerified,
                    });
                  }
                } catch (error) {
                  console.error("Error syncing phone number on retry:", error);
                }
              } else {
                hapticNotification('error');
                toast({
                  title: t.common.error,
                  description: t.settings.phoneVerificationFailed,
                  variant: "destructive"
                });
              }
            }, 2000);
          }
        } else {
          hapticNotification('error');
          toast({
            title: t.common.cancel,
            description: t.settings.phoneVerificationCancelled,
            variant: "destructive"
          });
        }
        setVerifying(false);
      });
    } else {
      hapticNotification('error');
      toast({
        title: t.common.error,
        description: t.settings.phoneVerificationFailed,
        variant: "destructive"
      });
    }
  };

  const displayName = tgUser.last_name
    ? `${tgUser.first_name} ${tgUser.last_name}`
    : tgUser.first_name;

  const initials = tgUser.first_name.charAt(0) + (tgUser.last_name?.charAt(0) || "");

  // Supported languages with flags and names (only fa, en, ar for now)
  const supportedLanguages = [
    { code: 'fa' as LanguageCode, name: 'فارسی', flag: '🇮🇷', nativeName: 'فارسی' },
    { code: 'en' as LanguageCode, name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'ar' as LanguageCode, name: 'العربية', flag: '🇸🇦', nativeName: 'العربية' },
  ];

  const currentLanguage = supportedLanguages.find(lang => lang.code === language) || supportedLanguages[0];

  const handleUpdateLanguage = async (languageCode: LanguageCode) => {
    if (!tgUser) return;
    hapticSelection();
    try {
      const result = await updateUserLanguage({
        userId: tgUser.id,
        languageCode: languageCode
      }).unwrap();
      
      if (result.success) {
        setLanguage(languageCode);
        setIsLanguageDrawerOpen(false);
        hapticNotification('success');
        toast({ 
          title: t.common.success, 
          description: t.settings.languageChanged 
        });
      } else {
        hapticNotification('error');
        toast({ 
          title: t.common.error, 
          description: t.common.error, 
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      hapticNotification('error');
      toast({ 
        title: t.common.error, 
        description: error?.data?.error || t.common.error, 
        variant: "destructive" 
      });
    }
  };

  const SettingItem = ({ icon: Icon, label, value, onClick, color = "primary", destructive = false, ltr = false }: any) => (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 glass rounded-2xl border border-white/5 mb-3 group transition-all duration-300 text-right"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className={`p-2.5 rounded-xl bg-${color}/10 text-${destructive ? 'red-500' : color} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground font-vazir">{label}</p>
          {value && (
            <p dir={ltr ? "ltr" : "rtl"} className={`text-xs text-muted-foreground mt-0.5 truncate ${ltr ? 'text-left' : 'text-right'}`}>
              {value}
            </p>
          )}
        </div>
      </div>
      {/* <ChevronLeft className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0" /> */}
    </motion.button>
  );

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-background" dir={dir}>
      {/* Header */}
      <div className="relative pt-12 pb-8 px-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-telegram-gradient opacity-10 blur-3xl -z-10"></div>
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <Avatar className="h-24 w-24 ring-4 ring-primary/20 shadow-2xl">
              <AvatarImage src={tgUser.photo_url} alt={displayName} />
              <AvatarFallback className="bg-telegram-gradient text-3xl font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isAdmin && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full border-2 border-background shadow-lg">
                <Shield className="h-4 w-4" />
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mt-4"
          >
            <h1 className="text-2xl font-bold text-foreground font-vazir">{displayName}</h1>
            <p dir="ltr" className="text-sm text-muted-foreground mt-1">@{tgUser.username || "کاربر"}</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 flex-1">

        <div className="mb-6">
          <h3 className={`text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2 font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.settings.userInfo}
          </h3>

          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-5 mb-6 border border-white/10 shadow-xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <p className={`text-sm font-bold text-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.settings.name}</p>
                <p className={`text-sm text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{displayName}</p>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <p className={`text-sm font-bold text-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.settings.username}</p>
                <p dir="ltr" className="text-sm text-muted-foreground text-left">@{tgUser.username || "N/A"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
            <SettingItem
              icon={Phone}
                  label={t.settings.phone}
                  value={phoneNumber || t.settings.phoneNotVerified}
              color={phoneNumber ? "green-500" : "primary"}
              onClick={!phoneNumber ? handleVerifyPhone : undefined}
              ltr={!!phoneNumber}
            />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2  gap-2">
              <SettingItem
                icon={Shield}
                  label={t.settings.access}
                  value={isAdmin ? t.settings.admin : t.settings.user}
                color={isAdmin ? "amber-500" : "primary"}
              />
              <SettingItem
                icon={Share2}
                  label={t.settings.referralCode}
                value={extraData.referralCode || "----"}
                color="purple-500"
                ltr
                onClick={() => {
                  if (extraData.referralCode) {
                      hapticSelection();
                    navigator.clipboard.writeText(extraData.referralCode);
                      toast({ title: t.common.copied, description: t.common.copied });
                  }
                }}
              />
            </div>
          </div>
          </motion.div>

        </div>


        <div className="mb-6">
          <h3 className={`text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2 font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.settings.payment}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Drawer open={isWalletDrawerOpen} onOpenChange={setIsWalletDrawerOpen}>
              <DrawerTrigger asChild>
                <div className="w-full">
                  <SettingItem
                    icon={CreditCard}
                    label={t.settings.walletAddress}
                    value={walletAddress || `${t.settings.walletAddressNotSet} (${t.settings.clickToSet})`}
                    color={walletAddress ? "blue-500" : "primary"}
                    ltr={!!walletAddress}
                  />
                </div>
              </DrawerTrigger>
              <DrawerContent className="font-vazir">
                <div className="mx-auto w-full max-w-sm p-6">
                  <DrawerHeader>
                    <DrawerTitle className={isRTL ? "text-right" : "text-left"}>{t.settings.walletAddress}</DrawerTitle>
                  </DrawerHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="wallet" className={isRTL ? "text-right block" : "text-left block"}>
                        {t.settings.walletAddress} (USDT/TON)
                      </Label>
                      <p className={`text-[10px] text-muted-foreground mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.settings.walletAddressWarning}
                      </p>
                      <div className="relative">
                        <Input
                          id="wallet"
                          placeholder={t.settings.walletAddressPlaceholder}
                          value={newWalletAddress}
                          onChange={(e) => !walletAddress && setNewWalletAddress(e.target.value)}
                          readOnly={!!walletAddress}
                          className={`text-left font-mono pr-12 ${walletAddress ? 'bg-muted' : ''}`}
                          dir="ltr"
                        />
                        {walletAddress && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1 h-8 w-10 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(walletAddress);
                              toast({ title: t.common.copied, description: t.common.copied });
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className={`text-[10px] text-amber-500 mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.settings.walletAddressWarning}
                      </p>
                    </div>
                  </div>
                  <DrawerFooter className="flex flex-row-reverse gap-2 px-0">
                    {!walletAddress ? (
                      <TelegramButton onClick={handleUpdateWallet} disabled={updatingWallet} className="flex-1" haptic="medium">
                        {updatingWallet ? t.common.loading : t.common.save}
                      </TelegramButton>
                    ) : (
                      <DrawerClose asChild>
                        <TelegramButton className="flex-1" haptic="light">{t.common.close}</TelegramButton>
                      </DrawerClose>
                    )}
                    <DrawerClose asChild>
                      <TelegramButton variant="outline" className="flex-1" haptic="light">{t.common.cancel}</TelegramButton>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>

            <Drawer open={isPasskeyDrawerOpen} onOpenChange={setIsPasskeyDrawerOpen}>
              <DrawerTrigger asChild>
                <div className="w-full">
                  <SettingItem
                    icon={Shield}
                    label={t.settings.withdrawalPasskey}
                    value={hasPasskey ? t.settings.passkeySet : t.settings.passkeyNotSet}
                    color={hasPasskey ? "green-500" : "amber-500"}
                  />
                </div>
              </DrawerTrigger>
              <DrawerContent className="font-vazir">
                <div className="mx-auto w-full max-w-sm p-6">
                  <DrawerHeader>
                    <DrawerTitle className={isRTL ? "text-right" : "text-left"}>{t.settings.withdrawalPasskey}</DrawerTitle>
                  </DrawerHeader>
                  <div className="space-y-4 py-4">
                    <div className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <Label htmlFor="passkey" className={isRTL ? "text-right block" : "text-left block"}>
                        {t.settings.passkeyLength}
                      </Label>
                      <p className={`text-[10px] text-muted-foreground mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.settings.passkeyWarning}
                      </p>
                      <Input
                        id="passkey"
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder={t.settings.passkeyPlaceholder}
                        value={hasPasskey ? "****" : newPasskey}
                        onChange={(e) => !hasPasskey && setNewPasskey(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        readOnly={hasPasskey}
                        className={`text-center tracking-[1em] text-lg font-bold ${hasPasskey ? 'bg-muted' : ''}`}
                      />
                      <p className={`text-[10px] text-amber-500 mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.settings.passkeyWarning}
                      </p>
                    </div>
                  </div>
                  <DrawerFooter className="flex flex-row-reverse gap-2 px-0">
                    {!hasPasskey ? (
                      <TelegramButton onClick={handleUpdatePasskey} disabled={updatingPasskey || newPasskey.length !== 4} className="flex-1" haptic="medium">
                        {updatingPasskey ? t.common.loading : t.settings.setPasskey}
                      </TelegramButton>
                    ) : (
                      <DrawerClose asChild>
                        <TelegramButton className="flex-1" haptic="light">{t.common.close}</TelegramButton>
                      </DrawerClose>
                    )}
                    <DrawerClose asChild>
                      <TelegramButton variant="outline" className="flex-1" haptic="light">{t.common.cancel}</TelegramButton>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>

        <div className="mb-6">
          <h3 className={`text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2 font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.settings.stats}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <SettingItem
              icon={CreditCard}
              label={t.settings.accountBalance}
              value={`${extraData.balance?.toLocaleString() || 0} USD`}
              color="green-500"
              ltr
            />

            <Drawer open={isLanguageDrawerOpen} onOpenChange={setIsLanguageDrawerOpen}>
              <DrawerTrigger asChild>
                <div className="w-full">
            <SettingItem
                    icon={Globe}
                    label={t.settings.language}
                    value={`${currentLanguage.flag} ${currentLanguage.nativeName}`}
                    color="blue-500"
                  />
                </div>
              </DrawerTrigger>
              <DrawerContent className="font-vazir" dir={dir}>
                <div className="mx-auto w-full max-w-sm p-6">
                  <DrawerHeader>
                    <DrawerTitle className={isRTL ? "text-right" : "text-left"}>{t.settings.selectLanguage}</DrawerTitle>
                  </DrawerHeader>
                  <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
                    {supportedLanguages.map((lang) => (
                      <motion.button
                        key={lang.code}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUpdateLanguage(lang.code)}
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
                  <DrawerFooter className="px-0">
                    <DrawerClose asChild>
                      <TelegramButton variant="outline" className="w-full" haptic="light">{t.common.close}</TelegramButton>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>

        <div className="mb-6">
          <h3 className={`text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2 font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.settings.timeline}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <SettingItem
              icon={Settings}
              label={t.settings.joinDate}
              value={formatDate(extraData.createdAt)}
            />
            <SettingItem
              icon={Settings}
              label={t.settings.lastSeen}
              value={formatDate(extraData.lastSeen)}
            />
          </div>
        </div>

        <div className="mt-4 mb-8">
          <SettingItem
            icon={LogOut}
            label={t.settings.logout}
            destructive
            color="red-500"
            onClick={() => {
              hapticImpact('medium');
              toast({ title: t.settings.logout, description: t.errors.somethingWentWrong });
            }}
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
