import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, User as UserIcon, Phone, QrCode, Link2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTelegramUser } from "@/lib/telegram";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useSyncUserMutation, useGetPlansQuery } from "@/store/api";
import { useAppSelector } from "@/store/hooks";
import { getPlanInfo } from "@/lib/planUtils";

const ProfileCard = () => {
  const navigate = useNavigate();
  const tgUser = getTelegramUser();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [syncUser, { isLoading: loading }] = useSyncUserMutation();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  
  const referralCode = currentUser?.referralCode || "";
  const phoneNumber = currentUser?.phoneNumber || null;
  const walletAddress = currentUser?.walletAddress || null;
  
  // Get plans for plan name detection
  const { data: plansData } = useGetPlansQuery();
  const plans = plansData?.plans || [];
  
  // Subscription data
  const subscriptionUrl = currentUser?.subscriptionUrl;
  const dataLimit = currentUser?.dataLimit || 0;
  const dataUsed = currentUser?.dataUsed || 0;
  const expire = currentUser?.expire;
  const status = currentUser?.status || 'inactive';
  
  // Get plan info
  const planInfo = subscriptionUrl ? getPlanInfo(dataLimit, expire, plans) : null;
  const planName = planInfo?.planName || (planInfo?.isBonus ? 'اشتراک رایگان' : null);
  
  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Calculate days remaining
  const now = Math.floor(Date.now() / 1000);
  const secondsRemaining = expire ? expire - now : null;
  const daysRemaining = secondsRemaining ? Math.ceil(secondsRemaining / 86400) : null;
  
  // Calculate usage percentage
  const usagePercent = dataLimit > 0 ? Math.min((dataUsed / dataLimit) * 100, 100) : 0;
  
  // Get usage bar color based on percentage
  const getUsageBarColor = (percent: number) => {
    if (percent >= 90) return 'from-red-500 to-red-600';
    if (percent >= 80) return 'from-orange-500 to-orange-600';
    if (percent >= 50) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };
  
  const usageBarColor = getUsageBarColor(usagePercent);
  
  // Get status badge
  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'active': return { label: 'فعال', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
      case 'limited': return { label: 'محدود شده', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' };
      case 'expired': return { label: 'منقضی شده', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
      case 'disabled': return { label: 'غیرفعال', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
      default: return { label: 'غیرفعال', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
    }
  };
  
  const statusBadge = getStatusBadge(status);

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
  }, [tgUser, currentUser]);

  const handleVerifyPhone = () => {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.requestContact) {
      setVerifying(true);
      webApp.requestContact(async (arg: any) => {
        console.log("Telegram requestContact callback arg:", arg);

        // Handle both boolean (official) and object (observed) responses
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
              const result = await syncUser({ ...tgUser, phone_number: phoneToSync }).unwrap();
              if (result.success) {
                toast({
                  title: "موفقیت",
                  description: "شماره تماس شما تایید شد",
                });
                // Refresh user data to get updated phone number
                await fetchUserData();
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
              title: "در حال بررسی...",
              description: "در حال دریافت اطلاعات از تلگرام",
            });
            setTimeout(async () => {
              const retryPhone = webApp.initDataUnsafe?.user?.phone_number;
              if (retryPhone) {
                try {
                  await syncUser({ ...tgUser, phone_number: retryPhone }).unwrap();
                  await fetchUserData();
                  toast({
                    title: "موفقیت",
                    description: "شماره تماس شما تایید شد",
                  });
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
        description: "قابلیت در این نسخه تلگرام در دسترس نیست",
        variant: "destructive"
      });
    }
  };

  const displayName = tgUser.last_name
    ? `${tgUser.first_name} ${tgUser.last_name}`
    : tgUser.first_name;

  const initials = tgUser.first_name.charAt(0) + (tgUser.last_name?.charAt(0) || "");

  const handleCopyReferral = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast({
        title: "کپی شد!",
        description: "کد معرف شما در کلیپ‌بورد کپی شد",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "خطا",
        description: "کپی انجام نشد",
        variant: "destructive",
      });
    }
  };

  const handleCopySubscriptionLink = async () => {
    if (!subscriptionUrl) return;
    try {
      await navigator.clipboard.writeText(subscriptionUrl);
      setCopiedLink(true);
      toast({
        title: "کپی شد",
        description: "لینک اشتراک با موفقیت کپی شد",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast({
        title: "خطا",
        description: "کپی انجام نشد",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass rounded-2xl p-5 mx-4 mt-4 border border-white/10 shadow-xl"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative cursor-pointer"
          onClick={() => navigate('/settings')}
        >
          <Avatar className="h-16 w-16 ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/20">
            <AvatarImage src={tgUser.photo_url} alt={displayName} />
            <AvatarFallback className="bg-telegram-gradient text-lg font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-background shadow-sm shadow-green-500/50"></div>
        </motion.div>

        {/* User Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate('/missions')}>
          <h2 className="text-lg font-bold text-foreground truncate font-vazir text-right">
            {displayName}
          </h2>
          
          {/* Subscription Info */}
          {subscriptionUrl ? (
            <div className="mt-2 space-y-2">
              <motion.div 
                className="flex items-center gap-2 flex-wrap cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/missions')}
                whileTap={{ scale: 0.98 }}
              >
                {planName && (
                  <span className="text-sm font-medium text-foreground font-vazir">{planName}</span>
                )}
                <Badge variant="outline" className={`${statusBadge.color} text-xs font-vazir border shrink-0`}>
                  {statusBadge.label}
                </Badge>
              </motion.div>
              <motion.div 
                className="w-full flex items-center gap-3 text-xs text-muted-foreground font-vazir flex-wrap cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/missions')}
                whileTap={{ scale: 0.98 }}
              >
                {/* Usage Bar */}
              {dataLimit > 0 && (
                <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-xs font-vazir">
                    <span className="text-muted-foreground">
                      {Math.round(usagePercent)}% استفاده شده
                    </span>
                    <span dir="ltr" className="text-muted-foreground text-left">
                      {formatBytes(dataUsed)} / {formatBytes(dataLimit)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePercent}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-l ${usageBarColor}`}
                    />
                  </div>
                </div>
              )}
              </motion.div>
              
              
              
              {/* Subscription Link */}
              <div className="mt-3 pt-3 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                <motion.div 
                  className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleCopySubscriptionLink}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link2 className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground font-vazir">لینک اشتراک</span>
                </motion.div>
                <div className="relative group">
                  <motion.div 
                    dir="ltr" 
                    className="p-2.5 pl-16 rounded-xl bg-black/20 border border-white/5 font-mono text-[10px] overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground group-hover:text-foreground transition-colors text-left cursor-pointer"
                    onClick={handleCopySubscriptionLink}
                    whileTap={{ scale: 0.98 }}
                  >
                    {subscriptionUrl}
                  </motion.div>
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySubscriptionLink();
                      }}
                      className="h-7 w-7 rounded-lg hover:bg-primary/20 hover:text-primary"
                    >
                      <AnimatePresence mode="wait">
                        {copiedLink ? (
                          <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check className="w-3.5 h-3.5" />
                          </motion.div>
                        ) : (
                          <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Copy className="w-3.5 h-3.5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 rounded-lg hover:bg-primary/20 hover:text-primary"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10 rounded-[2.5rem] font-vazir">
                        <DialogHeader>
                          <DialogTitle className="text-center text-xl font-black">اسکن کد QR</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center space-y-6 py-4">
                          <div className="p-6 bg-white rounded-[2rem] shadow-2xl">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(subscriptionUrl)}`}
                              alt="Subscription QR Code"
                              className="w-48 h-48"
                            />
                          </div>
                          <p className="text-sm text-center text-muted-foreground px-6">
                            این کد را در اپلیکیشن v2ray (مانند v2rayNG یا Shadowrocket) اسکن کنید تا تنظیمات به صورت خودکار اعمال شود.
                          </p>
                          <Button onClick={handleCopySubscriptionLink} variant="outline" className="rounded-xl gap-2 font-bold">
                            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            کپی لینک اشتراک
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <span className="text-xs text-muted-foreground font-vazir">اشتراکی فعال نیست</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;
