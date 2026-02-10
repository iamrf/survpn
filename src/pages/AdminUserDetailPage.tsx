import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Wallet, History, User, Shield, Calendar, Clock, ArrowUpRight, ArrowDownLeft, Edit2, Check, X as Close, Copy, Database, TrendingUp, TrendingDown, Phone } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { getUserDetail, getTransactionHistory, updateUserBalance, updateWithdrawalStatus, adminUpdateUserSecurity, getUserFinanceSummary } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

const AdminUserDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newBalance, setNewBalance] = useState("");
    const [newWallet, setNewWallet] = useState("");
    const [newPasskey, setNewPasskey] = useState("");
    const [updateLoading, setUpdateLoading] = useState(false);
    const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
    const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Confirmation Alert State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmType, setConfirmType] = useState<'completed' | 'failed' | null>(null);
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [isTxDrawerOpen, setIsTxDrawerOpen] = useState(false);
    const [userFinance, setUserFinance] = useState<any>(null);
    const [financeLoading, setFinanceLoading] = useState(false);

    const { toast } = useToast();

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        const [userResult, historyResult, financeResult] = await Promise.all([
            getUserDetail(id),
            getTransactionHistory(Number(id)),
            getUserFinanceSummary(Number(id))
        ]);

        if (userResult.success) {
            setUser(userResult.user);
            setNewBalance(userResult.user.balance.toString());
            setNewWallet(userResult.user.wallet_address || "");
            setNewPasskey(userResult.user.withdrawal_passkey || "");
        }
        if (historyResult.success) setHistory(historyResult.history);
        if (financeResult.success) setUserFinance(financeResult.summary);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleUpdateBalance = async () => {
        const amount = parseFloat(newBalance);
        if (isNaN(amount)) {
            toast({ title: "خطا", description: "لطفاً مبلغ معتبری وارد کنید", variant: "destructive" });
            return;
        }

        setUpdateLoading(true);
        try {
            const result = await updateUserBalance(id!, amount, 'set');
            if (result.success) {
                toast({ title: "موفقیت", description: "موجودی کاربر با موفقیت تغییر کرد" });
                setIsBalanceDialogOpen(false);
                fetchData();
            } else {
                toast({ title: "خطا", description: result.error || "خطا در بروزرسانی موجودی", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "خطا", description: "خطا در ارتباط با سرور", variant: "destructive" });
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleUpdateSecurity = async () => {
        if (!id) return;
        setUpdateLoading(true);
        try {
            const result = await adminUpdateUserSecurity(id, newWallet, newPasskey);
            if (result.success) {
                toast({ title: "موفقیت", description: "اطلاعات امنیتی با موفقیت بروزرسانی شد" });
                setIsSecurityDialogOpen(false);
                fetchData();
            } else {
                toast({ title: "خطا", description: result.error || "خطا در بروزرسانی اطلاعات", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "خطا", description: "خطا در ارتباط با سرور", variant: "destructive" });
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleWithdrawAction = async (withdrawalId: string, status: 'completed' | 'failed') => {
        setActionLoading(withdrawalId);
        try {
            const result = await updateWithdrawalStatus(withdrawalId, status);
            if (result.success) {
                toast({ title: "موفقیت", description: result.message });
                setIsConfirmOpen(false);
                fetchData();
            } else {
                toast({ title: "خطا", description: result.error || "خطا در بروزرسانی وضعیت", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "خطا", description: "خطا در ارتباط با سرور", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const confirmWithdrawAction = (tx: any, status: 'completed' | 'failed') => {
        setSelectedTx(tx);
        setConfirmType(status);
        setIsConfirmOpen(true);
    };

    const handleTxClick = async (tx: any) => {
        setSelectedTx(tx);
        setIsTxDrawerOpen(true);
        setFinanceLoading(true);
        setUserFinance(null);
        try {
            const result = await getUserFinanceSummary(Number(id));
            if (result.success) {
                setUserFinance(result.summary);
            }
        } catch (err) {
            console.error("Error fetching user finance summary:", err);
        } finally {
            setFinanceLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "کپی شد", description: "در حافظه کپی شد." });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/10 border-green-500/20">تکمیل شده</Badge>;
            case 'pending': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10 border-yellow-500/20">در انتظار</Badge>;
            case 'failed': return <Badge variant="destructive">ناموفق</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background p-6">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
                    <ArrowLeft size={18} />
                    بازگشت
                </Button>
                <div className="text-center py-12">کاربر یافت نشد.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-28 text-right" dir="rtl">
            <div className="p-6 pt-12 max-w-lg mx-auto w-full space-y-6">
                <header className="flex items-center justify-start mb-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-white/5">
                        <ArrowLeft size={20} className="rotate-180" />
                    </Button>
                    <h1 className="mr-2 text-xl font-bold font-vazir">اطلاعات کاربر</h1>
                </header>

                {/* User Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="glass border-white/5 shadow-xl overflow-hidden">
                        <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5"></div>
                        <CardContent className="relative pt-0">
                            <div className="flex justify-between items-end -translate-y-1/2 mb-2 pr-4 pl-4">
                                <div className="p-1 bg-background rounded-full">
                                    {user.photo_url ? (
                                        <img src={user.photo_url} alt="" className="w-20 h-20 rounded-full border-4 border-background" />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold border-4 border-background">
                                            {user.first_name?.[0] || "?"}
                                        </div>
                                    )}
                                </div>
                                <div className="pb-1">
                                    {user.role === 'admin' ? (
                                        <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary font-medium border border-primary/20">مدیر کل</span>
                                    ) : (
                                        <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-muted-foreground font-medium border border-white/5">کاربر سیستم</span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4 pt-2 pb-2 pr-4 pl-4">
                                <div>
                                    <h2 className="text-2xl font-bold">{user.first_name} {user.last_name}</h2>
                                    <p dir="ltr" className="text-muted-foreground text-sm">@{user.username || user.id}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-start">
                                            <User size={10} /> شناسه یکتا
                                        </p>
                                        <p dir="ltr" className="text-xs font-medium text-right">{user.id || "ثبت نشده"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-start">
                                            <Phone size={10} /> شماره تماس
                                        </p>
                                        <p dir="ltr" className="text-xs font-medium text-right">{user.phone_number || "ثبت نشده"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-start">
                                            <Calendar size={10} /> عضویت
                                        </p>
                                        <p className="text-xs font-medium">{new Date(user.created_at).toLocaleDateString('fa-IR')}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-start">
                                            <Clock size={10} /> آخرین بازدید
                                        </p>
                                        <p className="text-xs font-medium">{new Date(user.last_seen).toLocaleDateString('fa-IR')}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="bg-primary text-white border-none shadow-xl shadow-primary/20">
                        <CardHeader className="pb-2">
                            <div className="flex justify-start items-center">
                                <Wallet size={20} className="opacity-80 ml-2" />
                                <CardDescription className="text-white/80 font-vazir">موجودی کیف پول</CardDescription>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <CardTitle className="text-4xl font-bold font-mono text-left">
                                    ${user.balance?.toLocaleString() || 0}
                                </CardTitle>
                                <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="bg-white/20 border-white/30 hover:bg-white/30 text-white font-vazir text-xs h-8">
                                            <Edit2 size={12} className="mr-1" />
                                            تغییر موجودی
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[90vw] rounded-2xl sm:max-w-[425px]" dir="rtl">
                                        <DialogHeader>
                                            <DialogTitle className="text-right font-vazir text-xl">تغییر موجودی کاربر</DialogTitle>
                                            <DialogDescription className="text-right font-vazir">
                                                مبلغ جدید را برای کاربر "{user.first_name}" وارد کنید.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-vazir block">مبلغ جدید ($)</label>
                                                <Input
                                                    type="number"
                                                    className="text-left font-mono"
                                                    value={newBalance}
                                                    onChange={(e) => setNewBalance(e.target.value)}
                                                />
                                            </div>
                                            <Button className="w-full h-12 font-vazir" onClick={handleUpdateBalance} disabled={updateLoading}>
                                                {updateLoading ? "در حال بروزرسانی..." : "بروزرسانی موجودی"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                    </Card>
                </motion.div>

                {/* Lifetime Financial Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                >
                    <div className="grid grid-cols-2 gap-3">
                        <div className="glass p-4 rounded-3xl border border-white/5 space-y-2 bg-red-500/5">
                            <div className="flex items-center gap-2 justify-end text-red-500">
                                <span className="text-[10px] font-vazir">مجموع برداشت</span>
                                <TrendingUp size={14} />
                            </div>
                            <p className="text-lg font-bold font-mono text-left text-red-500">
                                ${userFinance?.totalWithdrawals?.toLocaleString() || 0}
                            </p>
                        </div>
                        <div className="glass p-4 rounded-3xl border border-white/5 space-y-2 bg-green-500/5">
                            <div className="flex items-center gap-2 justify-end text-green-500">
                                <span className="text-[10px] font-vazir">مجموع واریزی</span>
                                <TrendingDown size={14} />
                            </div>
                            <p className="text-lg font-bold font-mono text-left text-green-500">
                                ${userFinance?.totalDeposits?.toLocaleString() || 0}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Security & Payment Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <Card className="glass border-white/5 shadow-xl">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield size={18} className="text-primary" />
                                <CardTitle className="text-sm font-bold font-vazir">امنیت و پرداخت</CardTitle>
                            </div>
                            <Drawer open={isSecurityDialogOpen} onOpenChange={setIsSecurityDialogOpen}>
                                <DrawerTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs font-vazir">
                                        <Edit2 size={12} /> ویرایش
                                    </Button>
                                </DrawerTrigger>
                                <DrawerContent className="font-vazir" dir="rtl">
                                    <div className="mx-auto w-full max-w-sm p-6">
                                        <DrawerHeader>
                                            <DrawerTitle className="text-right text-xl">ویرایش اطلاعات امنیتی</DrawerTitle>
                                            <DrawerDescription className="text-right">
                                                آدرس ولت و رمز عبور کاربر را مدیریت کنید.
                                            </DrawerDescription>
                                        </DrawerHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-sm block text-right">آدرس ولت</label>
                                                <Input
                                                    className="text-left font-mono"
                                                    dir="ltr"
                                                    value={newWallet}
                                                    onChange={(e) => setNewWallet(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm block text-right">رمز عبور برداشت (۴ رقم)</label>
                                                <Input
                                                    className="text-center font-bold tracking-widest"
                                                    maxLength={4}
                                                    value={newPasskey}
                                                    onChange={(e) => setNewPasskey(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                                />
                                            </div>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button className="w-full h-12 mt-4" disabled={updateLoading}>
                                                        {updateLoading ? "در حال ثبت تغییرات..." : "ذخیره تغییرات"}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="font-vazir rounded-3xl max-w-[90vw]" dir="rtl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-right">تایید نهایی</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-right">
                                                            آیا از تغییر اطلاعات امنیتی این کاربر اطمینان دارید؟ این عمل مستقیم روی قابلیت برداشت کاربر تاثیر می‌گذارد.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="flex-row-reverse gap-2">
                                                        <AlertDialogAction onClick={handleUpdateSecurity} className="flex-1">تایید و ذخیره</AlertDialogAction>
                                                        <AlertDialogCancel className="flex-1 mt-0">انصراف</AlertDialogCancel>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        <DrawerFooter className="px-0">
                                            <DrawerClose asChild>
                                                <Button variant="outline" className="w-full">بستن</Button>
                                            </DrawerClose>
                                        </DrawerFooter>
                                    </div>
                                </DrawerContent>
                            </Drawer>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-vazir">آدرس ولت:</span>
                                <span dir="ltr" className="font-mono text-[10px] bg-white/5 px-2 py-1 rounded truncate max-w-[180px]">
                                    {user.wallet_address || "تنظیم نشده"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-vazir">رمز عبور برداشت:</span>
                                <span className="font-bold tracking-widest text-primary">
                                    {user.withdrawal_passkey || "---"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* History Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    <h3 className="text-lg font-bold flex items-center gap-2 justify-start">
                        <History size={20} className="text-primary" />
                        تاریخچه تراکنش‌ها
                    </h3>
                    <ScrollArea className="h-80">
                        <div className="space-y-3 pb-2">
                            {history.length === 0 ? (
                                <div className="glass p-8 rounded-2xl text-center text-muted-foreground font-vazir text-sm border border-white/5">
                                    تراکنشی یافت نشد
                                </div>
                            ) : (
                                history.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="glass p-4 rounded-2xl border border-white/5 space-y-3 cursor-pointer hover:bg-white/5 transition-colors"
                                        onClick={() => handleTxClick(tx)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-left space-y-1">
                                                <p className={`text-sm font-bold font-mono ${tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {tx.type === 'deposit' ? '+' : '-'}${tx.amount}
                                                </p>
                                                {getStatusBadge(tx.status)}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-sm font-bold font-vazir">{tx.type === 'deposit' ? 'شارژ حساب' : 'برداشت وجه'}</p>
                                                    <p className="text-[10px] text-muted-foreground font-vazir px-1">{new Date(tx.created_at).toLocaleString('fa-IR')}</p>
                                                </div>
                                                <div className={`p-2 rounded-xl ${tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </motion.div>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="font-vazir text-right" dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmType === 'completed' ? "تایید نهایی واریز" : "رد درخواست برداشت"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmType === 'completed'
                                ? `آیا از تایید و پرداخت ${selectedTx?.amount?.toLocaleString()} دلار به این کاربر اطمینان دارید؟`
                                : "آیا از رد این درخواست برداشت اطمینان دارید؟ مبلغ به کیف پول کاربر عودت داده خواهد شد."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl font-vazir">انصراف</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedTx && handleWithdrawAction(selectedTx.id, confirmType!)}
                            className={`rounded-xl font-vazir ${confirmType === 'completed' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                        >
                            بله، مطمئنم
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <BottomNav />

            {/* Transaction Detail Drawer */}
            <Drawer open={isTxDrawerOpen} onOpenChange={setIsTxDrawerOpen}>
                <DrawerContent className="max-w-lg mx-auto font-vazir" dir="rtl">
                    <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/10" />
                    <ScrollArea className="max-h-[85vh] overflow-y-auto">
                        <div className="p-6 space-y-8">
                            {selectedTx && (
                                <>
                                    <DrawerHeader className="p-0 text-right">
                                        <DrawerTitle className="text-2xl font-bold flex items-center justify-end gap-2 text-right">
                                            جزئیات تراکنش
                                            {selectedTx.type === 'deposit' ? <ArrowDownLeft className="text-green-500" /> : <ArrowUpRight className="text-red-500" />}
                                        </DrawerTitle>
                                        <DrawerDescription className="text-right">
                                            بررسی تاریخچه و وضعیت پرداخت
                                        </DrawerDescription>
                                    </DrawerHeader>

                                    {/* User Header Info - matching AdminPage style */}
                                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/5">
                                        <div className="p-1 bg-background rounded-full">
                                            {user.photo_url ? (
                                                <img src={user.photo_url} alt="" className="w-12 h-12 rounded-full border border-white/10" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                    {user.first_name?.[0] || "?"}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right flex-1 px-4">
                                            <h3 className="font-bold text-lg">{user.first_name} {user.last_name}</h3>
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-xs text-muted-foreground font-mono">@{user.username || user.id}</span>
                                                <Separator className="h-3 w-[1px] bg-white/10" />
                                                <span className="text-xs text-muted-foreground font-mono">ID: {user.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-vazir font-semibold text-sm flex items-center justify-end gap-2 text-primary">
                                            اطلاعات تراکنش
                                            <History size={16} />
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="glass p-4 rounded-2xl border border-white/5 space-y-1">
                                                <p className="text-[10px] text-muted-foreground text-right">نوع تراکنش</p>
                                                <p className="font-bold text-sm">
                                                    {selectedTx.type === 'deposit' ? 'شارژ حساب (واریز)' : 'برداشت وجه'}
                                                </p>
                                            </div>
                                            <div className="glass p-4 rounded-2xl border border-white/5 space-y-1">
                                                <p className="text-[10px] text-muted-foreground text-right">وضعیت</p>
                                                <div className="pt-1">{getStatusBadge(selectedTx.status)}</div>
                                            </div>
                                            <div className="glass p-4 rounded-2xl border border-white/5 space-y-1">
                                                <p className="text-[10px] text-muted-foreground text-right">مبلغ</p>
                                                <p className={`text-xl font-bold font-mono ${selectedTx.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {selectedTx.type === 'deposit' ? '+' : '-'}${selectedTx.amount}
                                                </p>
                                            </div>
                                            <div className="glass p-4 rounded-2xl border border-white/5 space-y-1">
                                                <p className="text-[10px] text-muted-foreground text-right">تاریخ</p>
                                                <p className="text-[10px] font-mono pt-1">
                                                    {new Date(selectedTx.created_at).toLocaleString('fa-IR')}
                                                </p>
                                            </div>
                                        </div>

                                        {selectedTx.address && (
                                            <div className="glass p-4 rounded-2xl border border-white/5 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-[10px] gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                                                        onClick={() => copyToClipboard(selectedTx.address)}
                                                    >
                                                        <Copy size={12} /> کپی آدرس
                                                    </Button>
                                                    <p className="text-[10px] text-muted-foreground">آدرس مقصد</p>
                                                </div>
                                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                                    <p dir="ltr" className="text-xs font-mono break-all text-left text-muted-foreground leading-relaxed">
                                                        {selectedTx.address}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {selectedTx.plisio_invoice_id && (
                                            <div className="glass p-4 rounded-2xl border border-white/5 space-y-1">
                                                <p className="text-[10px] text-muted-foreground text-right">شناسه فاکتور Plisio</p>
                                                <p className="text-xs font-mono text-left" dir="ltr">{selectedTx.plisio_invoice_id}</p>
                                            </div>
                                        )}

                                        {/* Financial Summary section */}
                                        <div className="space-y-4">
                                            <h4 className="font-vazir font-semibold text-sm flex items-center justify-end gap-2 text-primary">
                                                خلاصه وضعیت مالی کاربر
                                                <Database size={16} />
                                            </h4>
                                            {financeLoading ? (
                                                <div className="py-8 text-center text-muted-foreground text-xs font-vazir">در حال دریافت آمار...</div>
                                            ) : userFinance ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 flex items-center justify-between gap-2">
                                                        <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                                                            <TrendingUp size={18} />
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-muted-foreground">مجموع برداشت</p>
                                                            <p className="text-sm font-bold font-mono text-red-500">${userFinance.totalWithdrawals.toLocaleString()} $</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-green-500/5 p-4 rounded-2xl border border-green-500/10 flex items-center justify-between gap-2">
                                                        <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                                                            <TrendingDown size={18} />
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-muted-foreground">مجموع واریزی</p>
                                                            <p className="text-sm font-bold font-mono text-green-500">{userFinance.totalDeposits.toLocaleString()} $</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-4 text-center text-muted-foreground text-[10px] font-vazir italic">اطلاعات مالی در دسترس نیست</div>
                                            )}
                                        </div>

                                        {/* Action Buttons for Pending Withdrawals */}
                                        {selectedTx.type === 'withdrawal' && selectedTx.status === 'pending' && (
                                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                                <Button
                                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white h-12 rounded-2xl shadow-lg shadow-green-500/20 gap-2"
                                                    onClick={() => {
                                                        setIsTxDrawerOpen(false);
                                                        confirmWithdrawAction(selectedTx, 'completed');
                                                    }}
                                                    disabled={actionLoading === selectedTx.id}
                                                >
                                                    <Check size={20} />
                                                    تایید و پرداخت نهایی
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 h-12 rounded-2xl border border-red-500/10 gap-2"
                                                    onClick={() => {
                                                        setIsTxDrawerOpen(false);
                                                        confirmWithdrawAction(selectedTx, 'failed');
                                                    }}
                                                    disabled={actionLoading === selectedTx.id}
                                                >
                                                    <Close size={20} />
                                                    رد درخواست
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <DrawerFooter className="px-0">
                                        <DrawerClose asChild>
                                            <Button variant="outline" className="w-full h-12 rounded-2xl">بستن</Button>
                                        </DrawerClose>
                                    </DrawerFooter>
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </DrawerContent>
            </Drawer>
        </div>
    );
};

export default AdminUserDetailPage;
