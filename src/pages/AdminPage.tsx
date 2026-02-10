import { useNavigate } from "react-router-dom";
import { ShieldCheck, Users, Settings, Database, Activity, Search, RefreshCcw, ChevronRight, ArrowUpRight, Copy, Check, X as Close, Wallet, Banknote, User, TrendingUp, TrendingDown, Clock, ExternalLink } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { getUsers, getAllWithdrawals, updateWithdrawalStatus, getTotalDeposits, getUserFinanceSummary } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState<"overview" | "users" | "withdrawals">("overview");
    const [usersList, setUsersList] = useState<any[]>([]);
    const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
    const [totalDeposits, setTotalDeposits] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Withdrawal Detail Drawer State
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
    const [userFinance, setUserFinance] = useState<any>(null);
    const [financeLoading, setFinanceLoading] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Confirmation Alert State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmType, setConfirmType] = useState<'completed' | 'failed' | null>(null);

    const navigate = useNavigate();
    const { toast } = useToast();

    const stats = [
        { label: "تعداد کاربران", value: usersList.length.toLocaleString('fa-IR') || "...", icon: Users, color: "text-blue-400" },
        { label: "درخواست برداشت", value: withdrawalsList.filter(w => w.status === 'pending').length.toLocaleString('fa-IR') || "۰", icon: ArrowUpRight, color: "text-yellow-400" },
        { label: "مجموع واریزی‌ها", value: totalDeposits !== null ? `$${totalDeposits.toLocaleString()}` : "...", icon: Banknote, color: "text-green-400" },
    ];

    const fetchAllUsers = async () => {
        setLoading(true);
        const result = await getUsers();
        if (result.success && result.users) {
            setUsersList(result.users);
        }
        setLoading(false);
    };

    const fetchAllWithdrawals = async () => {
        setWithdrawalsLoading(true);
        const result = await getAllWithdrawals();
        if (result.success && result.withdrawals) {
            setWithdrawalsList(result.withdrawals);
        }
        setWithdrawalsLoading(false);
    };

    const fetchTotalDeposits = async () => {
        const result = await getTotalDeposits();
        if (result.success) {
            setTotalDeposits(result.total);
        }
    };

    useEffect(() => {
        if (activeTab === "users") fetchAllUsers();
        if (activeTab === "withdrawals") fetchAllWithdrawals();
        if (activeTab === "overview") {
            fetchAllUsers();
            fetchAllWithdrawals();
            fetchTotalDeposits();
        }
    }, [activeTab]);

    const handleWithdrawAction = async (withdrawalId: string, status: 'completed' | 'failed') => {
        setActionLoading(withdrawalId);
        try {
            const result = await updateWithdrawalStatus(withdrawalId, status);
            if (result.success) {
                toast({ title: "موفقیت", description: result.message });
                fetchAllWithdrawals();
                setIsDrawerOpen(false); // Close drawer after action
                setIsConfirmOpen(false);
            } else {
                toast({ title: "خطا", description: result.error || "خطا در بروزرسانی وضعیت", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "خطا", description: "خطا در ارتباط با سرور", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const confirmWithdrawAction = (status: 'completed' | 'failed') => {
        setConfirmType(status);
        setIsConfirmOpen(true);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "کپی شد", description: "در حافظه کپی شد." });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/10 border-green-500/20 text-[10px]">تکمیل شده</Badge>;
            case 'pending': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10 border-yellow-500/20 text-[10px]">در انتظار</Badge>;
            case 'failed': return <Badge variant="destructive" className="text-[10px]">ناموفق</Badge>;
            default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
        }
    };

    const handleWithdrawalClick = async (withdrawal: any) => {
        setSelectedWithdrawal(withdrawal);
        setIsDrawerOpen(true);
        setFinanceLoading(true);
        setUserFinance(null);
        try {
            const result = await getUserFinanceSummary(withdrawal.user_id);
            if (result.success) {
                setUserFinance(result.summary);
            }
        } catch (err) {
            console.error("Error fetching user finance summary:", err);
        } finally {
            setFinanceLoading(false);
        }
    };

    const filteredUsers = usersList.filter(user =>
        user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id?.toString().includes(searchQuery)
    );

    return (
        <div className="min-h-screen flex flex-col pb-28 bg-background" dir="rtl">
            <div className="p-6 pt-12 max-w-lg mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-8"
                >
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div className="text-right">
                        <h1 className="text-2xl font-bold font-vazir">پنل مدیریت</h1>
                        <p className="text-muted-foreground text-sm font-vazir">مدیریت سیستم و امور مالی</p>
                    </div>
                </motion.div>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-white/5 rounded-2xl mb-8 border border-white/5">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${activeTab === "overview" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"}`}
                    >
                        <Activity size={16} />
                        نمای کلی
                    </button>
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${activeTab === "users" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"}`}
                    >
                        <Users size={16} />
                        کاربران
                    </button>
                    <button
                        onClick={() => setActiveTab("withdrawals")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${activeTab === "withdrawals" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"}`}
                    >
                        <ArrowUpRight size={16} />
                        برداشت‌ها
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "overview" ? (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 gap-4">
                                {stats.map((stat, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => index === 1 && navigate('/admin/withdrawals/pending')}
                                        className={`glass p-5 rounded-3xl flex items-center justify-between border border-white/5 shadow-xl ${index === 1 ? 'cursor-pointer hover:bg-white/5 active:scale-95 transition-all' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                                                <stat.icon size={24} />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-muted-foreground text-xs font-vazir">{stat.label}</p>
                                                <p className="text-xl font-bold font-mono">{stat.value}</p>
                                            </div>
                                        </div>
                                        {index === 1 && <ChevronRight size={16} className="text-muted-foreground rotate-180" />}
                                    </motion.div>
                                ))}
                            </div>

                            <div className="glass rounded-3xl p-6 border border-white/5 shadow-xl space-y-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2 font-vazir">
                                    <Settings size={20} className="text-primary" />
                                    تنظیمات سریع
                                </h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-xs font-medium border border-white/5 font-vazir">
                                        توقف سرویس
                                    </button>
                                    <button className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-xs font-medium border border-white/5 font-vazir">
                                        ارسال پیام انبوه
                                    </button>
                                    <button className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-xs font-medium border border-white/5 font-vazir">
                                        پشتیبان‌گیری
                                    </button>
                                    <button className="p-4 rounded-2xl bg-primary/20 hover:bg-primary/30 transition-colors text-xs font-medium border border-primary/20 text-primary font-vazir">
                                        بروزرسانی
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : activeTab === "users" ? (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="relative flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <input
                                        type="text"
                                        placeholder="جستجوی کاربر..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors font-vazir text-right"
                                    />
                                </div>
                                <button
                                    onClick={fetchAllUsers}
                                    className={`p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${loading ? "animate-spin" : ""}`}
                                >
                                    <RefreshCcw size={18} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {loading ? (
                                    <div className="py-12 text-center text-muted-foreground text-sm font-vazir">در حال بارگذاری...</div>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <motion.div
                                            key={user.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => navigate(`/admin/user/${user.id}`)}
                                            className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer transition-all text-right group"
                                        >
                                            <div className="flex items-center gap-3">
                                                {user.photo_url ? (
                                                    <img src={user.photo_url} alt="" className="w-10 h-10 rounded-full border border-white/10" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                        {user.first_name?.[0] || "?"}
                                                    </div>
                                                )}
                                                <div className="overflow-hidden text-right">
                                                    <p className="font-medium text-sm truncate max-w-[120px] font-vazir group-hover:text-primary transition-colors">{user.first_name} {user.last_name}</p>
                                                    <p dir="ltr" className="text-[10px] text-muted-foreground truncate">@{user.username || user.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    {user.role === 'admin' ? (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium border border-primary/20 font-vazir">مدیر</span>
                                                    ) : (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground font-medium border border-white/5 font-vazir">کاربر</span>
                                                    )}
                                                    <p className="text-[9px] text-muted-foreground font-vazir">
                                                        {new Date(user.last_seen).toLocaleDateString('fa-IR')}
                                                    </p>
                                                </div>
                                                <ChevronRight size={16} className="text-muted-foreground rotate-180 group-hover:text-primary transition-colors" />
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-muted-foreground text-sm font-vazir">کاربری یافت نشد.</div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="withdrawals"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold font-vazir">درخواست‌های برداشت</h3>
                                <button
                                    onClick={fetchAllWithdrawals}
                                    className={`p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${withdrawalsLoading ? "animate-spin" : ""}`}
                                >
                                    <RefreshCcw size={16} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {withdrawalsLoading ? (
                                    <div className="py-12 text-center text-muted-foreground text-sm font-vazir">در حال بارگذاری...</div>
                                ) : withdrawalsList.length > 0 ? (
                                    withdrawalsList.map((withdrawal) => (
                                        <motion.div
                                            key={withdrawal.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => handleWithdrawalClick(withdrawal)}
                                            className="glass p-5 rounded-3xl border border-white/5 space-y-4 shadow-lg cursor-pointer hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center justify-between text-right">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {withdrawal.first_name?.[0] || "?"}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm font-vazir">{withdrawal.first_name} {withdrawal.last_name}</p>
                                                        <p dir="ltr" className="text-[10px] text-muted-foreground">@{withdrawal.username}</p>
                                                    </div>
                                                </div>
                                                <div className="text-left space-y-1">
                                                    <p className="text-base font-bold font-mono text-red-500">-$ {(withdrawal.amount).toLocaleString()}</p>
                                                    {getStatusBadge(withdrawal.status)}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                                                <span className="font-vazir">زمان درخواست:</span>
                                                <span className="font-mono">{new Date(withdrawal.created_at).toLocaleString('fa-IR')}</span>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-muted-foreground text-sm font-vazir">درخواستی یافت نشد.</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Withdrawal Detail Drawer */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent className="max-w-lg mx-auto" dir="rtl">
                    <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/10" />
                    <ScrollArea className="max-h-[85vh] overflow-y-auto">
                        <div className="p-6 space-y-8">
                            <DrawerHeader className="p-0 text-right">
                                <DrawerTitle className="text-2xl w-full font-bold font-vazir flex items-center justify-end gap-2">
                                    جزئیات درخواست برداشت
                                    <ArrowUpRight className="text-red-500" size={24} />
                                </DrawerTitle>
                                <DrawerDescription className="font-vazir text-muted-foreground">
                                    بررسی اطلاعات مالی و تایید پرداخت
                                </DrawerDescription>
                            </DrawerHeader>

                            {/* User Header Info */}
                            {selectedWithdrawal && (
                                <div className="flex items-center justify-end bg-white/5 p-4 gap-4 rounded-3xl border border-white/5">
                                    <div className="flex items-center gap-4">

                                        <div className="text-right">
                                            <h3 className="font-bold text-lg font-vazir">{selectedWithdrawal.first_name} {selectedWithdrawal.last_name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground font-mono">ID: {selectedWithdrawal.user_id}</span>
                                                <Separator orientation="vertical" className="h-3 bg-white/10" />
                                                <span className="text-xs text-muted-foreground font-mono">@{selectedWithdrawal.username}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-xl bg-white/5 text-primary hover:bg-primary hover:text-white"
                                        onClick={() => navigate(`/admin/user/${selectedWithdrawal.user_id}`)}
                                    >
                                        <User size={20} />
                                    </Button>
                                </div>
                            )}

                            {/* Withdrawal Details Card */}
                            {selectedWithdrawal && (
                                <div className="space-y-4">
                                    <h4 className="font-vazir font-semibold text-sm flex items-center justify-end gap-2 text-primary">
                                        اطلاعات برداشت جاری
                                        <Wallet size={16} />
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="glass p-4 rounded-2xl border border-white/5 space-y-1">
                                            <p className="text-[10px] text-muted-foreground font-vazir text-right">وضعیت فعلی</p>
                                            <div className="pt-1">{getStatusBadge(selectedWithdrawal.status)}</div>
                                        </div>
                                        <div className="glass p-4 rounded-2xl border border-white/5 space-y-1">
                                            <p className="text-[10px] text-muted-foreground font-vazir text-right">مبلغ درخواستی</p>
                                            <p className="text-xl font-bold font-mono text-red-500">{(selectedWithdrawal.amount).toLocaleString()} $</p>
                                        </div>
                                    </div>
                                    <div className="glass p-4 rounded-2xl border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-[10px] gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                                                onClick={() => copyToClipboard(selectedWithdrawal.address)}
                                            >
                                                <Copy size={12} /> کپی آدرس
                                            </Button>
                                            <p className="text-[10px] text-muted-foreground font-vazir">آدرس کیف پول گیرنده</p>
                                        </div>
                                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                            <p dir="ltr" className="text-xs font-mono break-all text-left text-muted-foreground leading-relaxed">
                                                {selectedWithdrawal.address}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Financial Summary */}
                            <div className="space-y-4">
                                <h4 className="font-vazir font-semibold text-sm flex items-center justify-end gap-2 text-primary">
                                    خلاصه وضعیت مالی کاربر
                                    <Database size={16} />
                                </h4>
                                {financeLoading ? (
                                    <div className="py-8 text-center text-muted-foreground text-xs font-vazir">در حال دریافت آمار...</div>
                                ) : userFinance ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 flex items-center justify-between gap-2">
                                                <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                                                    <TrendingUp size={18} />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted-foreground font-vazir">مجموع برداشت</p>
                                                    <p className="text-sm font-bold font-mono text-red-500">${userFinance.totalWithdrawals.toLocaleString()} $</p>
                                                </div>
                                            </div>
                                            <div className="bg-green-500/5 p-4 rounded-2xl border border-green-500/10 flex items-center justify-between gap-2">
                                                <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                                                    <TrendingDown size={18} />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted-foreground font-vazir">مجموع واریزی</p>
                                                    <p className="text-sm font-bold font-mono text-green-500">{userFinance.totalDeposits.toLocaleString()} $</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {userFinance.lastDeposit && (
                                                <div className="flex items-center justify-between glass p-3 rounded-xl border border-white/5 text-[10px]">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={12} className="text-muted-foreground" />
                                                        <span className="text-muted-foreground font-vazir">آخرین واریز موفق:</span>
                                                        <span className="font-mono text-green-500">+${userFinance.lastDeposit.amount}</span>
                                                    </div>
                                                    <span className="font-mono text-muted-foreground">
                                                        {new Date(userFinance.lastDeposit.created_at).toLocaleDateString('fa-IR')}
                                                    </span>
                                                </div>
                                            )}
                                            {userFinance.lastWithdrawal && (
                                                <div className="flex items-center justify-between glass p-3 rounded-xl border border-white/5 text-[10px]">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={12} className="text-muted-foreground" />
                                                        <span className="text-muted-foreground font-vazir">آخرین برداشت موفق:</span>
                                                        <span className="font-mono text-red-500">-${userFinance.lastWithdrawal.amount}</span>
                                                    </div>
                                                    <span className="font-mono text-muted-foreground">
                                                        {new Date(userFinance.lastWithdrawal.created_at).toLocaleDateString('fa-IR')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-4 text-center text-muted-foreground text-[10px] font-vazir italic">اطلاعات مالی در دسترس نیست</div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {selectedWithdrawal?.status === 'pending' && (
                                <div className="flex gap-3 pt-4 border-t border-white/5">
                                    <Button
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-vazir h-12 rounded-2xl shadow-lg shadow-green-500/20 gap-2"
                                        onClick={() => confirmWithdrawAction('completed')}
                                        disabled={actionLoading === selectedWithdrawal.id}
                                    >
                                        <Check size={20} />
                                        تایید و پرداخت نهایی
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-vazir h-12 rounded-2xl border border-red-500/10 gap-2"
                                        onClick={() => confirmWithdrawAction('failed')}
                                        disabled={actionLoading === selectedWithdrawal.id}
                                    >
                                        <Close size={20} />
                                        رد این درخواست
                                    </Button>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DrawerContent>
            </Drawer>

            {/* Confirmation Dialog */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="font-vazir text-right" dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmType === 'completed' ? "تایید نهایی واریز" : "رد درخواست برداشت"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmType === 'completed'
                                ? `آیا از تایید و پرداخت ${selectedWithdrawal?.amount?.toLocaleString()} دلار به این کاربر اطمینان دارید؟`
                                : "آیا از رد این درخواست برداشت اطمینان دارید؟ مبلغ به کیف پول کاربر عودت داده خواهد شد."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl font-vazir">انصراف</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedWithdrawal && handleWithdrawAction(selectedWithdrawal.id, confirmType!)}
                            className={`rounded-xl font-vazir ${confirmType === 'completed' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                        >
                            بله، مطمئنم
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <BottomNav />
        </div>
    );
};

export default AdminPage;
