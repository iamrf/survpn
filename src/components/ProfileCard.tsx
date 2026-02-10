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
          // Some versions might return the contact in the response object
          const contact = arg.response?.contact;
          const phoneToSync = contact?.phone_number || null;

          try {
            const result = await syncUser({ ...tgUser, ...(phoneToSync ? { phone_number: phoneToSync } : {}) }).unwrap();
            if (result.success) {
              toast({
                title: "موفقیت",
                description: "شماره تماس شما تایید شد",
              });
            }
          } catch (error) {
            // If sync fails but request was sent, maybe bot will update it
            toast({
              title: "در حال بررسی...",
              description: "در حال دریافت اطلاعات از تلگرام",
            });
            setTimeout(fetchUserData, 2000);
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

          <div className="flex flex-wrap items-center justify-start gap-2 mt-1">
            {!loading && !phoneNumber && (
              <motion.button
                onClick={handleVerifyPhone}
                disabled={verifying}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-all duration-300 border border-green-500/20 group"
              >
                <span className="text-[10px] font-vazir font-bold">
                  {verifying ? "در حال تایید..." : "تایید شماره موبایل"}
                </span>
                <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Phone className="h-2.5 w-2.5" />
                </div>
              </motion.button>
            )}

            {!loading && phoneNumber && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/5 text-blue-400 border border-blue-500/10">
                <span className="text-[10px] font-vazir opacity-70">کاربر تایید شده</span>
                <Check className="h-2.5 w-2.5" />
              </div>
            )}

            {!loading && walletAddress && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/5 text-green-400 border border-green-500/10">
                <span className="text-[10px] font-vazir opacity-70">کیف پول متصل</span>
                <Check className="h-2.5 w-2.5" />
              </div>
            )}
            <motion.button
              onClick={handleCopyReferral}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-300 border border-primary/20 group"
            >
              <span className="text-[10px] font-vazir opacity-70">کد معرف شما: </span>
              <span dir="ltr" className="text-sm font-mono font-bold tracking-wider">
                {loading ? "..." : referralCode || "----"}
              </span>
              {copied ? (
                <Check className="h-3 w-3 text-primary animate-in zoom-in" />
              ) : (
                <Copy className="h-3 w-3 group-hover:rotate-12 transition-transform" />
              )}
            </motion.button>

          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;
