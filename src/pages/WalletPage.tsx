import { useState, useEffect } from "react";
import { Wallet, Plus, CreditCard, ArrowUpRight, History, ArrowDownLeft, X, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { createPayment, syncUser, getTransactionHistory, requestWithdrawal, cancelWithdrawal } from "@/lib/api";
import { motion } from "framer-motion";

const WalletPage = () => {
  const [balance, setBalance] = useState<number>(0);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [hasPasskey, setHasPasskey] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPasskey, setWithdrawPasskey] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const fetchBalance = async () => {
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser) {
      const result = await syncUser(tgUser);
      if (result.success) {
        if (result.balance !== undefined) setBalance(result.balance);
        if (result.walletAddress) setWalletAddress(result.walletAddress);
        if (result.hasPasskey !== undefined) setHasPasskey(result.hasPasskey);
      }
    }
  };

  const fetchHistory = async () => {
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser) {
      const result = await getTransactionHistory(tgUser.id);
      if (result.success && result.history) {
        setHistory(result.history);
      }
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchHistory();
  }, []);

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

    setLoading(true);
    try {
      const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      if (!tgUser) {
        toast({
          title: "خطا",
          description: "اطلاعات کاربر یافت نشد",
          variant: "destructive",
        });
        return;
      }

      const result = await createPayment(tgUser.id, numAmount);
      if (result.success && result.invoice_url) {
        window.location.href = result.invoice_url;
      } else {
        toast({
          title: "خطا",
          description: result.error || "خطا در ایجاد تراکنش",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی در اتصال به سرور پیش آمد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

    setWithdrawLoading(true);
    try {
      const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      const result = await requestWithdrawal(tgUser.id, numAmount, "USD", withdrawPasskey);
      if (result.success) {
        toast({ title: "موفقیت", description: "درخواست برداشت ثبت شد و در حال بررسی است" });
        setWithdrawAmount("");
        setWithdrawPasskey("");
        fetchBalance();
        fetchHistory();
        setIsWithdrawOpen(false);
      } else {
        toast({ title: "خطا", description: result.error || "خطا در ثبت درخواست", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "خطا", description: "خطا در ارتباط با سرور", variant: "destructive" });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleCancelWithdrawal = async (withdrawalId: string) => {
    if (!confirm("آیا از لغو این درخواست اطمینان دارید؟")) return;

    setCancelLoading(withdrawalId);
    try {
      const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      if (!tgUser) return;

      const result = await cancelWithdrawal(tgUser.id, withdrawalId);
      if (result.success) {
        toast({ title: "موفقیت", description: "درخواست با موفقیت لغو شد و مبلغ به موجودی شما بازگشت" });
        fetchBalance();
        fetchHistory();
      } else {
        toast({ title: "خطا", description: result.error || "خطا در لغو درخواست", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "خطا", description: "خطا در ارتباط با سرور", variant: "destructive" });
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
        <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground border-none">
          <CardHeader className="pb-4">
            <CardDescription className="text-primary-foreground/80 font-vazir">موجودی حساب</CardDescription>
            <CardTitle className="text-3xl font-bold font-vazir text-left">
              $ {balance.toLocaleString()}
            </CardTitle>
          </CardHeader>
          {/* <CardContent className="flex justify-end pt-4">
            <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              <span>پرداخت سریع</span>
            </div>
          </CardContent> */}
        </Card>

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
              <Button variant="outline" className="flex flex-col h-20 gap-2 border-dashed" onClick={fetchHistory}>
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
                    {history.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground font-vazir">تراکنشی یافت نشد</div>
                    ) : (
                      history.map((tx) => (
                        <div key={tx.id} className="flex flex-col p-3 rounded-lg border bg-card gap-3">
                          <div className="flex items-center justify-between">
                            <div className="text-left space-y-1">
                              <p className={`text-sm font-bold font-vazir ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.type === 'deposit' ? '+' : '-'}${tx.amount}
                              </p>
                              {getStatusBadge(tx.status)}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-semibold font-vazir">{tx.type === 'deposit' ? 'شارژ حساب' : 'برداشت وجه'}</p>
                                <p className="text-[10px] text-muted-foreground font-vazir">{new Date(tx.created_at).toLocaleString('fa-IR')}</p>
                              </div>
                              <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'}`}>
                                {tx.type === 'deposit' ? <ArrowDownLeft className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-600" />}
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
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

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
              {[100, 1000, 10000].map((val) => (
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
              disabled={loading}
            >
              {loading ? (
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
      </div>
      <BottomNav />
    </div>
  );
};

export default WalletPage;
