import { motion } from "framer-motion";
import { Copy, Check, User as UserIcon, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { getTelegramUser } from "@/lib/telegram";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { useSyncUserMutation } from "@/store/api";
import { useAppSelector } from "@/store/hooks";

const ProfileCard = () => {
  const tgUser = getTelegramUser();
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [syncUser, { isLoading: loading }] = useSyncUserMutation();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  
  const referralCode = currentUser?.referralCode || "";
  const phoneNumber = currentUser?.phoneNumber || null;
  const walletAddress = currentUser?.walletAddress || null;

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
          className="relative"
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
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-foreground truncate font-vazir text-right">
            {displayName}
          </h2>

        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;
