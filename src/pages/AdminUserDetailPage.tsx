import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Wallet, History, User, Shield, Calendar, Clock, ArrowUpRight, ArrowDownLeft, Edit2, Check, X as Close, Copy, Database, TrendingUp, TrendingDown, Phone, Activity, HardDrive, Zap, Link2, Radio, Gift, Percent } from "lucide-react";
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
import { useGetUserDetailQuery, useAdminUpdateUserReferralMutation, useGetReferralStatsQuery } from "@/store/api";
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
    const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false);
    const [newReferralBonusRate, setNewReferralBonusRate] = useState("");
    const [newReferralRegistrationBonus, setNewReferralRegistrationBonus] = useState("");
    const [newReferralCode, setNewReferralCode] = useState("");
    const [referralUpdateLoading, setReferralUpdateLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Confirmation Alert State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmType, setConfirmType] = useState<'completed' | 'failed' | null>(null);
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [isTxDrawerOpen, setIsTxDrawerOpen] = useState(false);
    const [userFinance, setUserFinance] = useState<any>(null);
    const [financeLoading, setFinanceLoading] = useState(false);

    const { toast } = useToast();

    // RTK Query hooks
    const { data: userDetailData, refetch: refetchUserDetail } = useGetUserDetailQuery(id || "", { skip: !id });
    const [updateUserReferral] = useAdminUpdateUserReferralMutation();
    const { data: referralStatsData } = useGetReferralStatsQuery(Number(id || 0), { skip: !id });

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
            setNewReferralBonusRate(userResult.user.referral_bonus_rate?.toString() || "10.00");
            setNewReferralRegistrationBonus(userResult.user.referral_registration_bonus?.toString() || "0.00");
            setNewReferralCode(userResult.user.referral_code || "");
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

    const handleUpdateReferral = async () => {
        if (!id) return;

        const bonusRate = parseFloat(newReferralBonusRate);
        const registrationBonus = parseFloat(newReferralRegistrationBonus);

        if (isNaN(bonusRate) || bonusRate < 0 || bonusRate > 100) {
            toast({ title: "خطا", description: "نرخ کمیسیون باید بین 0 تا 100 باشد", variant: "destructive" });
            return;
        }

        if (isNaN(registrationBonus) || registrationBonus < 0) {
            toast({ title: "خطا", description: "پاداش ثبت‌نام باید عدد مثبت باشد", variant: "destructive" });
            return;
        }

        // Validate referral code if provided
        const referralCode = newReferralCode.trim().toUpperCase();
        if (referralCode && referralCode.length !== 5) {
            toast({ title: "خطا", description: "کد معرف باید دقیقاً ۵ کاراکتر باشد (A-Z, 0-9)", variant: "destructive" });
            return;
        }
        if (referralCode && !/^[A-Z0-9]{5}$/.test(referralCode)) {
            toast({ title: "خطا", description: "کد معرف باید فقط شامل حروف انگلیسی و اعداد باشد", variant: "destructive" });
            return;
        }

        setReferralUpdateLoading(true);
        try {
            const updateData: any = {
                userId: id,
                referral_bonus_rate: bonusRate,
                referral_registration_bonus: registrationBonus,
            };
            
            // Only include referral_code if it's provided and different from current
            if (referralCode && referralCode !== user?.referral_code) {
                updateData.referral_code = referralCode;
            }
            
            const result = await updateUserReferral(updateData).unwrap();

            if (result.success) {
                toast({ title: "موفقیت", description: "تنظیمات معرفی با موفقیت تغییر کرد" });
                setIsReferralDialogOpen(false);
                fetchData();
                refetchUserDetail();
            } else {
                toast({ title: "خطا", description: result.error || "خطا در بروزرسانی تنظیمات", variant: "destructive" });
            }
        } catch (err: any) {
            toast({ 
                title: "خطا", 
                description: err?.data?.error || "خطا در ارتباط با سرور", 
                variant: "destructive" 
            });
        } finally {
            setReferralUpdateLoading(false);
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

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

                {/* Marzban Status Card */}
                {user.marzban && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.14 }}
                    >
                        <Card className="glass border-white/5 shadow-xl">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <Zap size={18} className="text-primary" />
                                    <CardTitle className="text-sm font-bold font-vazir">وضعیت Marzban</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-start">
                                            <Activity size={10} /> وضعیت
                                        </p>
                                        <Badge 
                                            variant="outline" 
                                            className={`text-xs ${
                                                user.marzban.status === 'active' 
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                                    : user.marzban.status === 'disabled'
                                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}
                                        >
                                            {user.marzban.status === 'active' ? 'فعال' : user.marzban.status === 'disabled' ? 'غیرفعال' : user.marzban.status || 'نامشخص'}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-start">
                                            <User size={10} /> نام کاربری
                                        </p>
                                        <p dir="ltr" className="text-xs font-mono text-right">{user.marzban.username || "---"}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <HardDrive size={14} className="text-primary" />
                                            <span className="text-xs text-muted-foreground font-vazir">ترافیک</span>
                                        </div>
                                        <div className="text-left space-y-1">
                                            <p dir="ltr" className="text-left text-xs font-mono text-muted-foreground">
                                                {user.marzban.dataUsed ? formatBytes(user.marzban.dataUsed) : '0 B'} / {user.marzban.dataLimit ? formatBytes(user.marzban.dataLimit) : '0 B'}
                                            </p>
                                            {user.marzban.dataLimit > 0 && (
                                                <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-primary rounded-full transition-all"
                                                        style={{ width: `${Math.min((user.marzban.dataUsed / user.marzban.dataLimit) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {user.marzban.expire && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-primary" />
                                                <span className="text-xs text-muted-foreground font-vazir">انقضا</span>
                                            </div>
                                            <p className="text-xs font-mono text-right">
                                                {user.marzban.expire > 0 
                                                    ? new Date(user.marzban.expire * 1000).toLocaleDateString('fa-IR')
                                                    : 'نامحدود'}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Radio size={14} className="text-primary" />
                                            <span className="text-xs text-muted-foreground font-vazir">وضعیت اتصال</span>
                                        </div>
                                        <div className="text-left space-y-0.5">
                                            {(() => {
                                                // Get onlineAt value, prefer onlineAt over lastSeen
                                                const onlineAt = user.marzban?.onlineAt || user.marzban?.lastSeen;
                                                
                                                // Handle null, undefined, 0, or empty string
                                                if (!onlineAt || onlineAt === 0 || onlineAt === null || onlineAt === '') {
                                                    return (
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                                            <p className="text-xs text-muted-foreground">هرگز متصل نشده</p>
                                                        </div>
                                                    );
                                                }
                                                
                                                // Convert to number and handle both seconds and milliseconds
                                                let timestamp = typeof onlineAt === 'string' ? parseFloat(onlineAt) : onlineAt;
                                                
                                                // If timestamp is less than a reasonable date (before 2000), it's likely in seconds
                                                // Otherwise, assume it's already in milliseconds
                                                const threshold = 946684800000; // Jan 1, 2000 in milliseconds
                                                if (timestamp < threshold) {
                                                    timestamp = timestamp * 1000; // Convert seconds to milliseconds
                                                }
                                                
                                                const lastSeenDate = new Date(timestamp);
                                                
                                                // Check if date is valid
                                                if (isNaN(lastSeenDate.getTime())) {
                                                    return (
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                                            <p className="text-xs text-muted-foreground">تاریخ نامعتبر</p>
                                                        </div>
                                                    );
                                                }
                                                
                                                const now = new Date();
                                                const diffMs = now.getTime() - lastSeenDate.getTime();
                                                
                                                // Handle negative differences (future dates)
                                                if (diffMs < 0) {
                                                    return (
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                            <p className="text-xs text-muted-foreground">تاریخ آینده</p>
                                                        </div>
                                                    );
                                                }
                                                
                                                const diffMins = Math.floor(diffMs / 60000);
                                                const diffHours = Math.floor(diffMs / 3600000);
                                                const diffDays = Math.floor(diffMs / 86400000);
                                                
                                                const isOnline = diffMins < 5; // Consider online if connected within last 5 minutes
                                                
                                                let timeAgo = '';
                                                let statusColor = '';
                                                if (diffMins < 1) {
                                                    timeAgo = 'هم اکنون آنلاین';
                                                    statusColor = 'bg-green-500';
                                                } else if (diffMins < 5) {
                                                    timeAgo = `${diffMins} دقیقه پیش (آنلاین)`;
                                                    statusColor = 'bg-green-500';
                                                } else if (diffMins < 60) {
                                                    timeAgo = `${diffMins} دقیقه پیش`;
                                                    statusColor = 'bg-yellow-500';
                                                } else if (diffHours < 24) {
                                                    timeAgo = `${diffHours} ساعت پیش`;
                                                    statusColor = 'bg-yellow-500';
                                                } else if (diffDays < 7) {
                                                    timeAgo = `${diffDays} روز پیش`;
                                                    statusColor = 'bg-orange-500';
                                                } else {
                                                    timeAgo = `${diffDays} روز پیش`;
                                                    statusColor = 'bg-red-500';
                                                }
                                                
                                                return (
                                                    <>
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <div className={`w-2 h-2 rounded-full ${statusColor} ${isOnline ? 'animate-pulse' : ''}`}></div>
                                                            <p className={`text-xs font-mono text-right ${isOnline ? 'text-green-500 font-bold' : 'text-muted-foreground'}`}>
                                                                {timeAgo}
                                                            </p>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground text-right mt-1">
                                                            {lastSeenDate.toLocaleString('fa-IR', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {user.marzban.subscriptionUrl && (
                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                <Link2 size={14} className="text-primary" />
                                                <span className="text-xs text-muted-foreground font-vazir">لینک اشتراک</span>
                                            </div>
                                            <div className="relative group">
                                                <div dir="ltr" className="p-2 rounded-lg bg-black/20 border border-white/5 font-mono text-[10px] overflow-hidden text-ellipsis whitespace-nowrap pl-8 text-muted-foreground group-hover:text-foreground transition-colors dir-ltr text-left">
                                                    {user.marzban.subscriptionUrl}
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => copyToClipboard(user.marzban.subscriptionUrl)}
                                                    className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg hover:bg-primary/20 hover:text-primary"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Referral Management Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <Card className="glass border-white/5 shadow-xl">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Gift size={18} className="text-primary" />
                                <CardTitle className="text-sm font-bold font-vazir">مدیریت سیستم معرفی</CardTitle>
                            </div>
                            <Drawer open={isReferralDialogOpen} onOpenChange={setIsReferralDialogOpen}>
                                <DrawerTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs font-vazir">
                                        <Edit2 size={12} /> ویرایش
                                    </Button>
                                </DrawerTrigger>
                                <DrawerContent className="font-vazir" dir="rtl">
                                    <div className="mx-auto w-full max-w-sm p-6">
                                        <DrawerHeader>
                                            <DrawerTitle className="text-right text-xl">ویرایش تنظیمات معرفی</DrawerTitle>
                                            <DrawerDescription className="text-right">
                                                نرخ کمیسیون و پاداش ثبت‌نام این کاربر را مدیریت کنید.
                                            </DrawerDescription>
                                        </DrawerHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-sm block text-right">کد معرف</label>
                                                <Input
                                                    type="text"
                                                    maxLength={5}
                                                    placeholder="A1B2C"
                                                    className="text-center font-mono text-lg font-bold tracking-wider uppercase"
                                                    dir="ltr"
                                                    value={newReferralCode}
                                                    onChange={(e) => {
                                                        // Only allow alphanumeric characters, convert to uppercase
                                                        const value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 5);
                                                        setNewReferralCode(value);
                                                    }}
                                                />
                                                <p className="text-[10px] text-muted-foreground text-right">
                                                    کد معرف باید دقیقاً ۵ کاراکتر باشد (A-Z, 0-9)
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm block text-right">نرخ کمیسیون تراکنش (%)</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    placeholder="10.00"
                                                    className="text-left font-mono"
                                                    dir="ltr"
                                                    value={newReferralBonusRate}
                                                    onChange={(e) => setNewReferralBonusRate(e.target.value)}
                                                />
                                                <p className="text-[10px] text-muted-foreground text-right">
                                                    درصد کمیسیون از هر تراکنش معرفی‌شده (0-100)
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm block text-right">پاداش ثبت‌نام (USD)</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="1.00"
                                                    className="text-left font-mono"
                                                    dir="ltr"
                                                    value={newReferralRegistrationBonus}
                                                    onChange={(e) => setNewReferralRegistrationBonus(e.target.value)}
                                                />
                                                <p className="text-[10px] text-muted-foreground text-right">
                                                    مبلغ پاداش برای هر ثبت‌نام از طریق لینک معرفی
                                                </p>
                                            </div>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button className="w-full h-12 mt-4" disabled={referralUpdateLoading}>
                                                        {referralUpdateLoading ? "در حال ثبت تغییرات..." : "ذخیره تغییرات"}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="font-vazir rounded-3xl max-w-[90vw]" dir="rtl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-right">تایید نهایی</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-right">
                                                            آیا از تغییر تنظیمات معرفی این کاربر اطمینان دارید؟ این تغییرات روی درآمد آینده کاربر از معرفی‌ها تاثیر می‌گذارد.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="flex-row-reverse gap-2">
                                                        <AlertDialogAction onClick={handleUpdateReferral} className="flex-1">تایید و ذخیره</AlertDialogAction>
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
                                <span className="text-muted-foreground font-vazir">کد معرف:</span>
                                <span dir="ltr" className="font-mono text-xs bg-white/5 px-2 py-1 rounded">
                                    {user.referral_code || "---"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-vazir">نرخ کمیسیون:</span>
                                <div className="flex items-center gap-2">
                                    <Percent size={14} className="text-primary" />
                                    <span className="font-mono text-xs">
                                        {user.referral_bonus_rate || 10.00}%
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-vazir">پاداش ثبت‌نام:</span>
                                <span className="font-mono text-xs text-green-500">
                                    ${(user.referral_registration_bonus || 0).toFixed(2)}
                                </span>
                            </div>
                            {referralStatsData?.stats && (
                                <>
                                    <Separator className="my-2" />
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <div className="text-center p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                            <p className="text-[10px] text-muted-foreground font-vazir mb-1">تعداد معرفی‌ها</p>
                                            <p className="text-lg font-bold font-vazir">
                                                {referralStatsData.stats.referralCount || 0}
                                            </p>
                                        </div>
                                        <div className="text-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                            <p className="text-[10px] text-muted-foreground font-vazir mb-1">کل کمیسیون</p>
                                            <p className="text-lg font-bold font-vazir text-green-500">
                                                ${(referralStatsData.stats.totalCommissions || 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    {referralStatsData.stats.referredUsers && referralStatsData.stats.referredUsers.length > 0 && (
                                        <>
                                            <Separator className="my-2" />
                                            <div className="space-y-2 pt-2">
                                                <h4 className="text-xs font-bold font-vazir text-right text-muted-foreground">
                                                    کاربران معرفی شده ({referralStatsData.stats.referredUsers.length})
                                                </h4>
                                                <ScrollArea className="h-48">
                                                    <div className="space-y-2">
                                                        {referralStatsData.stats.referredUsers.map((referredUser: any) => (
                                                            <div 
                                                                key={referredUser.id} 
                                                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-white/5 cursor-pointer hover:bg-muted/50 transition-colors"
                                                                onClick={() => navigate(`/admin/user/${referredUser.id}`)}
                                                            >
                                                                <div className="text-right flex-1">
                                                                    <p className="text-xs font-bold font-vazir">
                                                                        {referredUser.first_name} {referredUser.last_name || ''}
                                                                    </p>
                                                                    <p className="text-[10px] text-muted-foreground font-vazir">
                                                                        @{referredUser.username || `user_${referredUser.id}`}
                                                                    </p>
                                                                    <p className="text-[10px] text-muted-foreground font-vazir mt-0.5">
                                                                        {new Date(referredUser.created_at).toLocaleDateString('fa-IR')}
                                                                    </p>
                                                                </div>
                                                                <div className="text-left ml-2">
                                                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[9px] mb-1">
                                                                        {referredUser.transactionCount} تراکنش
                                                                    </Badge>
                                                                    <p className="text-[10px] font-bold font-vazir text-green-500">
                                                                        ${referredUser.totalEarned.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </>
                                    )}
                                    {referralStatsData.stats.recentCommissions && referralStatsData.stats.recentCommissions.length > 0 && (
                                        <>
                                            <Separator className="my-2" />
                                            <div className="space-y-2 pt-2">
                                                <h4 className="text-xs font-bold font-vazir text-right text-muted-foreground">
                                                    کمیسیون‌های اخیر
                                                </h4>
                                                <ScrollArea className="h-32">
                                                    <div className="space-y-1.5">
                                                        {referralStatsData.stats.recentCommissions.slice(0, 5).map((comm: any) => (
                                                            <div key={comm.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-white/5">
                                                                <div className="text-right flex-1">
                                                                    <p className="text-xs font-bold font-vazir text-green-500">
                                                                        +${(comm.commission_amount || 0).toFixed(2)}
                                                                    </p>
                                                                    <p className="text-[10px] text-muted-foreground font-vazir">
                                                                        {comm.type === 'registration' ? 'ثبت‌نام' : 'تراکنش'}
                                                                    </p>
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-[9px] text-muted-foreground font-vazir">
                                                                        {new Date(comm.created_at).toLocaleDateString('fa-IR')}
                                                                    </p>
                                                                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-[9px]">
                                                                        {comm.status === 'paid' ? 'پرداخت' : 'در انتظار'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                            {user.referred_by && (
                                <>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-vazir">معرف شده توسط:</span>
                                        <Badge variant="outline" className="text-xs">
                                            User ID: {user.referred_by}
                                        </Badge>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Security & Payment Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 }}
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
                                history.map((tx) => {
                                    const isDeposit = tx.type === 'deposit';
                                    const isWithdrawal = tx.type === 'withdrawal';
                                    const isSubscription = tx.type === 'subscription' || tx.type === 'custom_subscription';
                                    const isPositive = isDeposit;
                                    const isNegative = isWithdrawal || isSubscription;
                                    
                                    const getTransactionLabel = () => {
                                        if (isDeposit) return 'شارژ حساب';
                                        if (isWithdrawal) return 'برداشت وجه';
                                        if (isSubscription) return 'خرید اشتراک';
                                        return 'تراکنش';
                                    };
                                    
                                    return (
                                    <div
                                        key={tx.id}
                                        className="glass p-4 rounded-2xl border border-white/5 space-y-3 cursor-pointer hover:bg-white/5 transition-colors"
                                        onClick={() => handleTxClick(tx)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-left space-y-1">
                                                <p className={`text-sm font-bold font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                                    {isPositive ? '+' : '-'}${tx.amount}
                                                </p>
                                                {getStatusBadge(tx.status)}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-sm font-bold font-vazir">{getTransactionLabel()}</p>
                                                    <p className="text-[10px] text-muted-foreground font-vazir px-1">{new Date(tx.created_at).toLocaleString('fa-IR')}</p>
                                                </div>
                                                <div className={`p-2 rounded-xl ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {isPositive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })
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
                                            {(selectedTx.type === 'deposit') ? <ArrowDownLeft className="text-green-500" /> : <ArrowUpRight className="text-red-500" />}
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
                                                    {selectedTx.type === 'deposit' ? 'شارژ حساب (واریز)' : 
                                                     selectedTx.type === 'withdrawal' ? 'برداشت وجه' :
                                                     selectedTx.type === 'subscription' || selectedTx.type === 'custom_subscription' ? 'خرید اشتراک' :
                                                     'تراکنش'}
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
