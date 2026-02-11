import { useState, useEffect } from "react";
import { Wallet, Plus, CreditCard, ArrowUpRight, History, ArrowDownLeft, X, CheckCircle2, Clock, Share2, Users, TrendingUp, Copy, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { WalletBalanceSkeleton, TransactionSkeleton } from "@/components/skeletons";
import { motion } from "framer-motion";
import { getTelegramUser } from "@/lib/telegram";
import { useAppSelector } from "@/store/hooks";
import { 
  useCreatePaymentMutation, 
  useSyncUserMutation, 
  useGetTransactionHistoryQuery, 
  useRequestWithdrawalMutation, 
  useCancelWithdrawalMutation,
  useGetReferralStatsQuery,
  useGetConfigsQuery
} from "@/store/api";

const WalletPage = () => {
  const tgUser = getTelegramUser();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const [amount, setAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPasskey, setWithdrawPasskey] = useState("");
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);

  // RTK Query hooks
  const [syncUser] = useSyncUserMutation();
  const [createPayment, { isLoading: paymentLoading }] = useCreatePaymentMutation();
  const [requestWithdrawal, { isLoading: withdrawLoading }] = useRequestWithdrawalMutation();
  const [cancelWithdrawal] = useCancelWithdrawalMutation();
  
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useGetTransactionHistoryQuery(
    tgUser?.id || 0,
    { skip: !tgUser?.id }
  );

  const { data: referralStatsData, isLoading: referralStatsLoading } = useGetReferralStatsQuery(
    tgUser?.id || 0,
    { skip: !tgUser?.id }
  );

  const { data: configsData } = useGetConfigsQuery();

  const history = historyData?.history || [];
  const balance = currentUser?.balance || 0;
  const walletAddress = currentUser?.walletAddress || "";
  const hasPasskey = currentUser?.hasPasskey || false;
  const referralCode = currentUser?.referralCode || "";
  const referralStats = referralStatsData?.stats || { referralCount: 0, totalCommissions: 0, recentCommissions: [] };
  const [referralLink, setReferralLink] = useState<string>("");
  
  // Get referral pricing from configs or user settings
  const configs = configsData?.configs || {};
  const defaultRegistrationBonus = parseFloat(configs['referral_registration_bonus'] || '1.00');
  const defaultCommissionRate = parseFloat(configs['default_referral_commission_rate'] || '10.00');
  
  // Use user's custom rates if available, otherwise use defaults
  // Note: These fields might not be in currentUser yet, so we'll use defaults for now
  const userRegistrationBonus = defaultRegistrationBonus;
  const userCommissionRate = defaultCommissionRate;

  // Load referral link when referral code is available
  useEffect(() => {
    if (!referralCode) {
      setReferralLink("");
      return;
    }
    // Use Telegram bot deep link format: https://t.me/botname?start=code
    import('@/lib/telegram').then(({ getTelegramBotUsername }) => {
      const botUsername = getTelegramBotUsername();
      setReferralLink(`https://t.me/${botUsername}?start=${referralCode}`);
    });
  }, [referralCode]);

  // Sync user data on mount
  useEffect(() => {
    if (tgUser && !currentUser) {
      syncUser(tgUser).unwrap().catch(console.error);
    }
  }, [tgUser, currentUser, syncUser]);

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "خطا",
        description: "لطفاً مبلغ معتبری وارد کنید",
        variant: "destructive",
      });
      return;
    }

      if (!tgUser) {
        toast({
          title: "خطا",
          description: "اطلاعات کاربر یافت نشد",
          variant: "destructive",
        });
        return;
      }

    try {
      const result = await createPayment({ userId: tgUser.id, amount: numAmount }).unwrap();
      if (result.success && result.invoice_url) {
        window.location.href = result.invoice_url;
      } else {
        toast({
          title: "خطا",
          description: result.error || "خطا در ایجاد تراکنش",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error?.data?.error || "مشکلی در اتصال به سرور پیش آمد",
        variant: "destructive",
      });
    }
  };

  const handleWithdraw = async () => {
    const numAmount = parseFloat(withdrawAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "خطا", description: "لطفاً مبلغ معتبری وارد کنید", variant: "destructive" });
      return;
    }

    if (!walletAddress) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا آدرس ولت خود را در بخش تنظیمات وارد کنید",
        variant: "destructive"
      });
      return;
    }

    if (!hasPasskey) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا رمز عبور خود را در بخش تنظیمات تنظیم کنید",
        variant: "destructive"
      });
      return;
    }

    if (withdrawPasskey.length !== 4) {
      toast({ title: "خطا", description: "رمز عبور باید ۴ رقم باشد", variant: "destructive" });
      return;
    }

    if (!tgUser) return;

    try {
      const result = await requestWithdrawal({
        userId: tgUser.id,
        amount: numAmount,
        currency: "USD",
        passkey: withdrawPasskey
      }).unwrap();
      
      if (result.success) {
        toast({ title: "موفقیت", description: "درخواست برداشت ثبت شد و در حال بررسی است" });
        setWithdrawAmount("");
        setWithdrawPasskey("");
        // Refresh user data and history
        await syncUser(tgUser).unwrap();
        refetchHistory();
        setIsWithdrawOpen(false);
      } else {
        toast({ title: "خطا", description: result.error || "خطا در ثبت درخواست", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ 
        title: "خطا", 
        description: error?.data?.error || "خطا در ارتباط با سرور", 
        variant: "destructive" 
      });
    }
  };

  const handleCancelWithdrawal = async (withdrawalId: string) => {
    if (!confirm("آیا از لغو این درخواست اطمینان دارید؟")) return;

    if (!tgUser) return;

    setCancelLoading(withdrawalId);
    try {
      const result = await cancelWithdrawal({
        userId: tgUser.id,
        withdrawalId
      }).unwrap();
      
      if (result.success) {
        toast({ title: "موفقیت", description: "درخواست با موفقیت لغو شد و مبلغ به موجودی شما بازگشت" });
        // Refresh user data and history
        await syncUser(tgUser).unwrap();
        refetchHistory();
      } else {
        toast({ title: "خطا", description: result.error || "خطا در لغو درخواست", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ 
        title: "خطا", 
        description: error?.data?.error || "خطا در ارتباط با سرور", 
        variant: "destructive" 
      });
    } finally {
      setCancelLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">تکمیل شده</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">در انتظار</Badge>;
      case 'failed': return <Badge variant="destructive">ناموفق</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReferralLink = () => {
    if (!referralCode) return referralLink;
    return referralLink;
  };

  const copyReferralLink = () => {
    const link = getReferralLink();
    if (link) {
      navigator.clipboard.writeText(link);
      toast({
        title: "کپی شد",
        description: "لینک معرفی در حافظه کپی شد",
      });
    }
  };

  const shareReferralLink = () => {
    const link = getReferralLink();
    if (link && navigator.share) {
      navigator.share({
        title: "اشتراک‌گذاری لینک معرفی",
        text: "با استفاده از این لینک ثبت‌نام کنید و پاداش دریافت کنید!",
        url: link,
      }).catch(console.error);
    } else {
      copyReferralLink();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-right" dir="rtl">
      <div className="p-6 pt-12 space-y-4 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Wallet className="h-8 w-8" />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold font-vazir">کیف پول</h1>
            <p className="text-muted-foreground text-sm font-vazir">امور مالی، واریز و برداشت</p>
          </div>
        </motion.div>

        {/* Current Balance Card */}
        {!currentUser ? (
          <WalletBalanceSkeleton />
        ) : (
        <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground border-none">
          <CardHeader className="pb-4">
            <CardDescription className="text-primary-foreground/80 font-vazir">موجودی حساب</CardDescription>
            <CardTitle className="text-3xl font-bold font-vazir text-left">
              $ {balance.toLocaleString()}
            </CardTitle>
          </CardHeader>
          </Card>
        )}


        {/* Top Up Form */}
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="text-lg font-vazir">شارژ حساب</CardTitle>
            <CardDescription className="font-vazir">مبلغ مورد نظر را وارد کنید (به دلار)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type="number"
                placeholder="مبلغ (USD)"
                className="pl-10 text-left font-mono"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[10, 25, 50].map((val) => (
                <Button
                  key={val}
                  variant="secondary"
                  size="sm"
                  onClick={() => setAmount(val.toString())}
                  className="font-mono"
                >
                  {val}$
                </Button>
              ))}
            </div>

            <Button
              className="w-full h-12 gap-2 mt-4 font-vazir"
              onClick={handleTopUp}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
                "در حال اتصال..."
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  شارژ حساب با کریپتو
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-2 font-vazir">
              پرداخت امن از طریق درگاه
            </p>
          </CardContent>
        </Card>

        {/* Referral & Affiliate Card */}
        <Drawer open={isReferralOpen} onOpenChange={setIsReferralOpen}>
          <DrawerTrigger asChild>
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 cursor-pointer hover:bg-purple-500/15 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
                      <Gift className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg font-vazir">سیستم معرفی و همکاری</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={(e) => {
                    e.stopPropagation();
                    setIsReferralOpen(true);
                  }}>
                    <Share2 className="w-3 h-3" />
                    مشاهده
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground font-vazir mb-1">تعداد معرفی‌ها</p>
                    <p className="text-xl font-bold font-vazir">{referralStats.referralCount}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground font-vazir mb-1">کل کمیسیون</p>
                    <p className="text-xl font-bold font-vazir text-green-500">
                      ${(referralStats.totalCommissions || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DrawerTrigger>
          <DrawerContent className="max-w-lg mx-auto" dir="rtl">
            <div className="p-6 pb-12">
              <DrawerHeader className="p-0 mb-6">
                <DrawerTitle className="text-right font-vazir text-xl">سیستم معرفی</DrawerTitle>
                <DrawerDescription className="text-right font-vazir">
                  دوستان خود را دعوت کنید و 
                     از هر تراکنش آن‌ها 
                     <span className="px-2 font-bold text-foreground">{userCommissionRate.toFixed(0)}%</span>
                      کمیسیون دریافت کنید. 
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-6">
                {/* Referral Code */}
                <div className="space-y-3">
                  <label className="text-sm font-vazir text-right block">کد معرف شما</label>
                  <div className="relative">
                    <Input
                      value={referralCode || "---"}
                      readOnly
                      className="text-center font-mono text-lg font-bold tracking-wider bg-background cursor-pointer hover:bg-muted transition-colors"
                      dir="ltr"
                      onClick={() => {
                        if (referralCode) {
                          navigator.clipboard.writeText(referralCode);
                          toast({ title: "کپی شد", description: "کد معرف کپی شد" });
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (referralCode) {
                          navigator.clipboard.writeText(referralCode);
                          toast({ title: "کپی شد", description: "کد معرف کپی شد" });
                        }
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Referral Link */}
                <div className="space-y-3">
                  <label className="text-sm font-vazir text-right block">لینک معرفی</label>
                  <div className="relative">
                    <Input
                      value={referralLink}
                      readOnly
                      className="text-xs font-mono pl-12 bg-background cursor-pointer hover:bg-muted transition-colors"
                      dir="ltr"
                      onClick={copyReferralLink}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyReferralLink();
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={copyReferralLink}
                    >
                      <Copy className="w-4 h-4" />
                      کپی لینک
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={shareReferralLink}
                    >
                      <Share2 className="w-4 h-4" />
                      اشتراک‌گذاری
                    </Button>
                  </div>
                </div>

                {/* Referral Stats */}
                {referralStatsLoading ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">در حال بارگذاری...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-purple-500" />
                        <p className="text-xs text-muted-foreground font-vazir">تعداد معرفی‌ها</p>
                      </div>
                      <p className="text-2xl font-bold font-vazir">{referralStats.referralCount}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <p className="text-xs text-muted-foreground font-vazir">کل کمیسیون</p>
                      </div>
                      <p className="text-2xl font-bold font-vazir text-green-500">
                        ${(referralStats.totalCommissions || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Recent Commissions */}
                {referralStats.recentCommissions && referralStats.recentCommissions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold font-vazir text-right">کمیسیون‌های اخیر</h4>
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {referralStats.recentCommissions.map((comm: any) => (
                          <div key={comm.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                            <div className="text-right">
                              <p className="text-sm font-bold font-vazir text-green-500">
                                +${(comm.commission_amount || 0).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground font-vazir">
                                {comm.type === 'registration' ? 'ثبت‌نام' : 'تراکنش'}
                              </p>
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] text-muted-foreground font-vazir">
                                {new Date(comm.created_at).toLocaleDateString('fa-IR')}
                              </p>
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px]">
                                {comm.status === 'paid' ? 'پرداخت شده' : 'در انتظار'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-muted-foreground font-vazir text-right leading-relaxed">
                    💡 با دعوت دوستان خود،
                     {/* از هر ثبت‌نام 
                    <span className="font-bold text-foreground">${userRegistrationBonus?.toFixed(0)}</span>
                     و  */}
                     از هر تراکنش آن‌ها 
                     <span className="px-2 font-bold text-foreground">{userCommissionRate.toFixed(0)}%</span>
                      کمیسیون دریافت کنید. 
                    لینک معرفی خود را به اشتراک بگذارید و درآمد کسب کنید!
                  </p>
                </div>
              </div>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full mt-4">بستن</Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Drawer open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="flex flex-col h-20 gap-2 border-dashed">
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-vazir">برداشت</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-w-lg mx-auto" dir="rtl">
              <div className="p-6 pb-12">
                <DrawerHeader className="p-0 mb-6">
                  <DrawerTitle className="text-right font-vazir text-xl">برداشت وجه</DrawerTitle>
                  <DrawerDescription className="text-right font-vazir">وجه مورد نظر تا حداکثر ۷۲ ساعت دیگر به ولت شما واریز خواهد شد</DrawerDescription>
                </DrawerHeader>
                <div className="space-y-6 py-4">
                  <div className="p-4 rounded-xl bg-muted/50 border border-muted space-y-2">
                    <p className="text-xs text-muted-foreground font-vazir text-right">آدرس ولت شما:</p>
                    <p className="text-sm font-mono text-left break-all bg-background p-2 rounded border">
                      {walletAddress || "آدرس ولت ثبت نشده است"}
                    </p>
                    {!walletAddress && (
                      <p className="text-[10px] text-red-500 font-vazir text-right">⚠️ لطفاً ابتدا در تنظیمات آدرس ولت خود را وارد کنید.</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2 text-right">
                      <label className="text-sm font-vazir block">مبلغ برداشت (دلار)</label>
                      <Input
                        type="number"
                        placeholder="مبلغ (USD)"
                        className="text-left font-mono h-12"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground font-vazir">موجودی قابل برداشت: ${balance}</p>
                    </div>

                    <div className="space-y-2 text-right">
                      <label className="text-sm font-vazir block">رمز عبور برداشت (۴ رقم)</label>
                      <Input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        placeholder="----"
                        className="text-center tracking-[1em] text-lg font-bold h-12"
                        value={withdrawPasskey}
                        onChange={(e) => setWithdrawPasskey(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 font-vazir text-lg"
                    onClick={handleWithdraw}
                    disabled={withdrawLoading || !walletAddress || !hasPasskey}
                  >
                    {withdrawLoading ? "در حال ارسال..." : "تایید و ثبت درخواست"}
                  </Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="flex flex-col h-20 gap-2 border-dashed" onClick={() => refetchHistory()}>
                <History className="w-5 h-5" />
                <span className="text-xs font-vazir">تاریخچه</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-w-lg mx-auto" dir="rtl">
              <div className="p-6 pb-12">
                <DrawerHeader className="p-0 mb-6">
                  <DrawerTitle className="text-right font-vazir text-xl">تاریخچه تراکنش‌ها</DrawerTitle>
                  <DrawerDescription className="text-right font-vazir text-muted-foreground">تراکنش‌های اخیر حساب شما</DrawerDescription>
                </DrawerHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-4">
                    {historyLoading ? (
                      Array(3).fill(0).map((_, i) => <TransactionSkeleton key={i} />)
                    ) : history.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground font-vazir">تراکنشی یافت نشد</div>
                    ) : (
                      history.map((tx) => {
                        const isDeposit = tx.type === 'deposit';
                        const isWithdrawal = tx.type === 'withdrawal';
                        const isSubscription = tx.type === 'subscription' || tx.type === 'custom_subscription';
                        const isPositive = isDeposit;
                        const isNegative = isWithdrawal || isSubscription;
                        
                        return (
                        <div key={tx.id} className="flex flex-col p-3 rounded-lg border bg-card gap-3">
                          <div className="flex items-center justify-between">
                            <div className="text-left space-y-1">
                              <p className={`text-sm font-bold font-vazir ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? '+' : '-'}${tx.amount}
                              </p>
                              {getStatusBadge(tx.status)}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-semibold font-vazir">
                                  {isDeposit ? 'شارژ حساب' : isWithdrawal ? 'برداشت وجه' : isSubscription ? 'خرید اشتراک' : 'تراکنش'}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-vazir">{new Date(tx.created_at).toLocaleString('fa-IR')}</p>
                              </div>
                              <div className={`p-2 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                                {isPositive ? <ArrowDownLeft className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-600" />}
                              </div>
                            </div>
                          </div>
                          {tx.type === 'withdrawal' && tx.status === 'pending' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full h-8 text-[10px] font-vazir bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none shadow-none"
                              onClick={() => handleCancelWithdrawal(tx.id)}
                              disabled={cancelLoading === tx.id}
                            >
                              {cancelLoading === tx.id ? "در حال لغو..." : "لغو درخواست و بازپرداخت"}
                            </Button>
                          )}
                        </div>
                      );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

      </div>
      <BottomNav />
    </div>
  );
};

export default WalletPage;
