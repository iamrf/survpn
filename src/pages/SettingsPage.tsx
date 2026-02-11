import { motion } from "framer-motion";
import { Settings, User, Phone, Shield, ChevronLeft, CreditCard, Share2, LogOut, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { getTelegramUser } from "@/lib/telegram";
import { useSyncUserMutation, useUpdateWalletAddressMutation, useUpdateWithdrawalPasskeyMutation, useUpdateUserLanguageMutation } from "@/store/api";
import { useAppSelector } from "@/store/hooks";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SettingsPage = () => {
  const tgUser = getTelegramUser();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const [newWalletAddress, setNewWalletAddress] = useState<string>("");
  const [newPasskey, setNewPasskey] = useState<string>("");
  const [isWalletDrawerOpen, setIsWalletDrawerOpen] = useState(false);
  const [isPasskeyDrawerOpen, setIsPasskeyDrawerOpen] = useState(false);
  const [isLanguageDrawerOpen, setIsLanguageDrawerOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // RTK Query hooks
  const [syncUser] = useSyncUserMutation();
  const [updateWalletAddress, { isLoading: updatingWallet }] = useUpdateWalletAddressMutation();
  const [updateWithdrawalPasskey, { isLoading: updatingPasskey }] = useUpdateWithdrawalPasskeyMutation();
  const [updateUserLanguage, { isLoading: updatingLanguage }] = useUpdateUserLanguageMutation();

  const phoneNumber = currentUser?.phoneNumber || null;
  const walletAddress = currentUser?.walletAddress || "";
  const hasPasskey = currentUser?.hasPasskey || false;
  const isAdmin = currentUser?.isAdmin || false;
  const extraData = {
    createdAt: currentUser?.createdAt,
    lastSeen: currentUser?.lastSeen,
    languageCode: currentUser?.languageCode,
    balance: currentUser?.balance,
    referralCode: currentUser?.referralCode
  };

  const fetchUserData = async () => {
    if (tgUser) {
      try {
        await syncUser(tgUser).unwrap();
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }
  };

  useEffect(() => {
    if (tgUser && !currentUser) {
      fetchUserData();
    }
    if (currentUser?.walletAddress) {
      setNewWalletAddress(currentUser.walletAddress);
    }
  }, [tgUser, currentUser, syncUser]);

  const handleUpdateWallet = async () => {
    if (!newWalletAddress || !tgUser) return;
    try {
      const result = await updateWalletAddress({
        userId: tgUser.id,
        walletAddress: newWalletAddress
      }).unwrap();
      
      if (result.success) {
        // Refresh user data
        await syncUser(tgUser).unwrap();
        setIsWalletDrawerOpen(false);
        toast({ title: "موفقیت", description: "آدرس ولت با موفقیت بروزرسانی شد" });
      } else {
        toast({ title: "خطا", description: "بروزرسانی آدرس ولت با خطا مواجه شد", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ 
        title: "خطا", 
        description: error?.data?.error || "بروزرسانی آدرس ولت با خطا مواجه شد", 
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
        // Refresh user data
        await syncUser(tgUser).unwrap();
        setNewPasskey("");
        setIsPasskeyDrawerOpen(false);
        toast({ title: "موفقیت", description: "رمز عبور برداشت با موفقیت تنظیم شد" });
      } else {
        toast({ title: "خطا", description: "تنظیم رمز عبور با خطا مواجه شد", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ 
        title: "خطا", 
        description: error?.data?.error || "تنظیم رمز عبور با خطا مواجه شد", 
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
                toast({
                  title: "موفقیت",
                  description: "شماره تماس شما با موفقیت تایید شد",
                });
                // Refresh user data to update Redux store
                await fetchUserData();
              } else {
                toast({
                  title: "خطا",
                  description: "خطا در ثبت شماره تماس",
                  variant: "destructive"
                });
              }
            } catch (error) {
              console.error("Error syncing phone number:", error);
              toast({
                title: "خطا",
                description: "خطا در ثبت شماره تماس. لطفاً دوباره تلاش کنید.",
                variant: "destructive"
              });
            }
          } else {
            // Phone number not available yet, try again after a delay
            toast({
              title: "بروزرسانی...",
              description: "در حال همگام‌سازی اطلاعات از تلگرام...",
            });
            setTimeout(async () => {
              const retryPhone = webApp.initDataUnsafe?.user?.phone_number;
              if (retryPhone) {
                try {
                  const result = await syncUser({ ...tgUser, phone_number: retryPhone });
                  if (result.data?.success) {
                    await fetchUserData();
                    toast({
                      title: "موفقیت",
                      description: "شماره تماس شما با موفقیت تایید شد",
                    });
                  }
                } catch (error) {
                  console.error("Error syncing phone number on retry:", error);
                }
              } else {
                toast({
                  title: "خطا",
                  description: "شماره تماس دریافت نشد. لطفاً دوباره تلاش کنید.",
                  variant: "destructive"
                });
              }
            }, 2000);
          }
        } else {
          toast({
            title: "لغو شد",
            description: "تایید شماره تماس انجام نشد",
            variant: "destructive"
          });
        }
        setVerifying(false);
      });
    } else {
      toast({
        title: "خطا",
        description: "قابلیت تایید شماره در این نسخه قابل استفاده نیست",
        variant: "destructive"
      });
    }
  };

  const displayName = tgUser.last_name
    ? `${tgUser.first_name} ${tgUser.last_name}`
    : tgUser.first_name;

  const initials = tgUser.first_name.charAt(0) + (tgUser.last_name?.charAt(0) || "");

  // Supported languages with flags and names
  const supportedLanguages = [
    { code: 'fa', name: 'فارسی', flag: '🇮🇷', nativeName: 'فارسی' },
    { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', nativeName: 'العربية' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷', nativeName: 'Türkçe' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺', nativeName: 'Русский' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
    { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
    { code: 'zh', name: '中文', flag: '🇨🇳', nativeName: '中文' },
    { code: 'ja', name: '日本語', flag: '🇯🇵', nativeName: '日本語' },
    { code: 'ko', name: '한국어', flag: '🇰🇷', nativeName: '한국어' },
  ];

  // Get current language or default to Telegram language
  const currentLanguageCode = extraData.languageCode || tgUser.language_code || 'fa';
  const currentLanguage = supportedLanguages.find(lang => lang.code === currentLanguageCode) || supportedLanguages[0];

  const handleUpdateLanguage = async (languageCode: string) => {
    if (!tgUser) return;
    try {
      const result = await updateUserLanguage({
        userId: tgUser.id,
        languageCode: languageCode
      }).unwrap();
      
      if (result.success) {
        // Refresh user data
        await fetchUserData();
        setIsLanguageDrawerOpen(false);
        toast({ 
          title: "موفقیت", 
          description: "زبان با موفقیت تغییر کرد" 
        });
      } else {
        toast({ 
          title: "خطا", 
          description: "تغییر زبان با خطا مواجه شد", 
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      toast({ 
        title: "خطا", 
        description: error?.data?.error || "تغییر زبان با خطا مواجه شد", 
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
    <div className="min-h-screen flex flex-col pb-24 bg-background">
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
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2 font-vazir text-right">اطلاعات کاربری</h3>

          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-5 mb-6 border border-white/10 shadow-xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <p className="text-sm font-bold text-foreground font-vazir">نام</p>
                <p className="text-sm text-muted-foreground font-vazir text-right">{displayName}</p>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <p className="text-sm font-bold text-foreground font-vazir">نام کاربری</p>
                <p dir="ltr" className="text-sm text-muted-foreground text-left">@{tgUser.username || "نامشخص"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
                <SettingItem
                  icon={Phone}
                  label="شماره موبایل"
                  value={phoneNumber || "تایید نشده"}
                  color={phoneNumber ? "green-500" : "primary"}
                  onClick={!phoneNumber ? handleVerifyPhone : undefined}
                  ltr={!!phoneNumber}
              />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2  gap-2">
                <SettingItem
                  icon={Shield}
                  label="دسترسی"
                  value={isAdmin ? "مدیر کل" : "کاربر "}
                  color={isAdmin ? "amber-500" : "primary"}
                />
                <SettingItem
                  icon={Share2}
                  label="کد معرف"
                  value={extraData.referralCode || "----"}
                  color="purple-500"
                  ltr
                  onClick={() => {
                    if (extraData.referralCode) {
                      navigator.clipboard.writeText(extraData.referralCode);
                      toast({ title: "کپی شد", description: "کد معرف در حافظه کپی شد" });
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>

        </div>


        <div className="mb-6">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2 font-vazir text-right">پرداخت و تسویه</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Drawer open={isWalletDrawerOpen} onOpenChange={setIsWalletDrawerOpen}>
              <DrawerTrigger asChild>
                <div className="w-full">
                  <SettingItem
                    icon={CreditCard}
                    label="آدرس ولت (برداشت وجه)"
                    value={walletAddress || "تنظیم نشده (کلیک کنید)"}
                    color={walletAddress ? "blue-500" : "primary"}
                    ltr={!!walletAddress}
                  />
                </div>
              </DrawerTrigger>
              <DrawerContent className="font-vazir">
                <div className="mx-auto w-full max-w-sm p-6">
                  <DrawerHeader>
                    <DrawerTitle className="text-right">آدرس ولت شما</DrawerTitle>
                  </DrawerHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="wallet" className="text-right block">آدرس ولت (USDT/TON)</Label>
                      <p className="text-[10px] text-muted-foreground mb-2">کلیه درخواست های واریز وجه، به این کیف پول شما واریز می شود. لطفا در وارد کردن آدرس دقت فرمایید.</p>
                      <div className="relative">
                        <Input
                          id="wallet"
                          placeholder="آدرس کیف پول دیجیتال شما"
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
                              toast({ title: "کپی شد", description: "آدرس ولت در حافظه کپی شد" });
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] text-amber-500 mt-2 text-right">آدرس ولت پس از ثبت قابل تغییر نیست. برای تغییر با پشتیبانی تماس بگیرید.</p>
                    </div>
                  </div>
                  <DrawerFooter className="flex flex-row-reverse gap-2 px-0">
                    {!walletAddress ? (
                      <Button onClick={handleUpdateWallet} disabled={updatingWallet} className="flex-1">
                        {updatingWallet ? "در حال ثبت..." : "ذخیره تغییرات"}
                      </Button>
                    ) : (
                      <DrawerClose asChild>
                        <Button className="flex-1">بستن</Button>
                      </DrawerClose>
                    )}
                    <DrawerClose asChild>
                      <Button variant="outline" className="flex-1">انصراف</Button>
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
                    label="رمز عبور برداشت"
                    value={hasPasskey ? "•••• (تنظیم شده)" : "تنظیم نشده (امنیت حساب)"}
                    color={hasPasskey ? "green-500" : "amber-500"}
                  />
                </div>
              </DrawerTrigger>
              <DrawerContent className="font-vazir">
                <div className="mx-auto w-full max-w-sm p-6">
                  <DrawerHeader>
                    <DrawerTitle className="text-right">رمز عبور برداشت</DrawerTitle>
                  </DrawerHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2 text-right">
                      <Label htmlFor="passkey" className="text-right block">رمز عبور (۴ رقم)</Label>
                      <p className="text-[10px] text-muted-foreground mb-2">این رمز ۴ رقمی را باید در زمان درخواست واریز وجه وارد کنید.</p>
                      <Input
                        id="passkey"
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="----"
                        value={hasPasskey ? "****" : newPasskey}
                        onChange={(e) => !hasPasskey && setNewPasskey(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        readOnly={hasPasskey}
                        className={`text-center tracking-[1em] text-lg font-bold ${hasPasskey ? 'bg-muted' : ''}`}
                      />
                      <p className="text-[10px] text-amber-500 mt-2">رمز عبور برداشت پس از ثبت قابل تغییر نیست. برای تغییر با پشتیبانی تماس بگیرید.</p>
                    </div>
                  </div>
                  <DrawerFooter className="flex flex-row-reverse gap-2 px-0">
                    {!hasPasskey ? (
                      <Button onClick={handleUpdatePasskey} disabled={updatingPasskey || newPasskey.length !== 4} className="flex-1">
                        {updatingPasskey ? "در حال ثبت..." : "تنظیم رمز عبور"}
                      </Button>
                    ) : (
                      <DrawerClose asChild>
                        <Button className="flex-1">بستن</Button>
                      </DrawerClose>
                    )}
                    <DrawerClose asChild>
                      <Button variant="outline" className="flex-1">انصراف</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2 font-vazir text-right">آمار و وضعیت</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <SettingItem
              icon={CreditCard}
              label="موجودی حساب"
              value={`${extraData.balance?.toLocaleString() || 0} USD`}
              color="green-500"
              ltr
            />

            <Drawer open={isLanguageDrawerOpen} onOpenChange={setIsLanguageDrawerOpen}>
              <DrawerTrigger asChild>
                <div className="w-full">
                  <SettingItem
                    icon={Globe}
                    label="زبان برنامه"
                    value={`${currentLanguage.flag} ${currentLanguage.nativeName}`}
                    color="blue-500"
                  />
                </div>
              </DrawerTrigger>
              <DrawerContent className="font-vazir">
                <div className="mx-auto w-full max-w-sm p-6">
                  <DrawerHeader>
                    <DrawerTitle className="text-right">انتخاب زبان</DrawerTitle>
                  </DrawerHeader>
                  <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
                    {supportedLanguages.map((lang) => (
                      <motion.button
                        key={lang.code}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUpdateLanguage(lang.code)}
                        disabled={updatingLanguage}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 text-right ${
                          currentLanguageCode === lang.code
                            ? 'bg-primary/20 border-primary text-foreground'
                            : 'bg-background border-white/10 text-foreground hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{lang.flag}</span>
                          <div className="flex-1 text-right">
                            <p className="text-sm font-bold">{lang.nativeName}</p>
                            <p className="text-xs text-muted-foreground">{lang.name}</p>
                          </div>
                        </div>
                        {currentLanguageCode === lang.code && (
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                  <DrawerFooter className="px-0">
                    <DrawerClose asChild>
                      <Button variant="outline" className="w-full">بستن</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2 font-vazir text-right">تاریخچه‌ی زمانی</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <SettingItem
              icon={Settings}
              label="تاریخ عضویت"
              value={formatDate(extraData.createdAt)}
            />
            <SettingItem
              icon={Settings}
              label="آخرین مشاهده"
              value={formatDate(extraData.lastSeen)}
            />
          </div>
        </div>

        <div className="mt-4 mb-8">
          <SettingItem
            icon={LogOut}
            label="خروج از حساب کاربری"
            destructive
            color="red-500"
            onClick={() => toast({ title: "خروج", description: "این قابلیت در نسخه دمو فعال نیست" })}
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
