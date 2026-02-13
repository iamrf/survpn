import { useNavigate } from "react-router-dom";
import { ShieldCheck, Users, Settings, Database, Activity, Search, RefreshCcw, ChevronRight, ArrowUpRight, Copy, Check, X as Close, Wallet, Banknote, User, TrendingUp, TrendingDown, Clock, ExternalLink, Package, Plus, Edit, Trash2, Gift, Percent, Star } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { useI18n } from "@/lib/i18n";
import {
    useGetUsersQuery,
    useGetAllWithdrawalsQuery,
    useUpdateWithdrawalStatusMutation,
    useGetTotalDepositsQuery,
    useGetUserFinanceSummaryQuery,
    useGetConfigsQuery,
    useUpdateConfigMutation,
    useGetAdminPlansQuery,
    useCreatePlanMutation,
    useUpdatePlanMutation,
    useDeletePlanMutation,
} from "@/store/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
    const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "withdrawals" | "plans">("overview");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Withdrawal Detail Drawer State
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Confirmation Alert State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmType, setConfirmType] = useState<'completed' | 'failed' | null>(null);

    // Config State
    const [saveConfigLoading, setSaveConfigLoading] = useState(false);
    const [isBonusDrawerOpen, setIsBonusDrawerOpen] = useState(false);
    const [bonusTraffic, setBonusTraffic] = useState<string>('');
    const [bonusDuration, setBonusDuration] = useState<string>('');
    const [isReferralDrawerOpen, setIsReferralDrawerOpen] = useState(false);
    const [defaultCommissionRate, setDefaultCommissionRate] = useState<string>('');
    const [defaultRegistrationBonus, setDefaultRegistrationBonus] = useState<string>('');
    const [isCustomSubscriptionDrawerOpen, setIsCustomSubscriptionDrawerOpen] = useState(false);
    const [customTrafficPrice, setCustomTrafficPrice] = useState<string>('');
    const [customDurationPrice, setCustomDurationPrice] = useState<string>('');
    const [isTelegramStarsDrawerOpen, setIsTelegramStarsDrawerOpen] = useState(false);
    const [telegramStarsPerUSD, setTelegramStarsPerUSD] = useState<string>('');

    // Plans State
    const [isPlanDrawerOpen, setIsPlanDrawerOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);
    const [savePlanLoading, setSavePlanLoading] = useState(false);
    const [planForm, setPlanForm] = useState({
        id: '',
        name: '',
        traffic: '',
        duration: '',
        price: '',
        description: '',
        is_active: true,
        display_order: 0
    });

    const navigate = useNavigate();
    const { toast } = useToast();
    const { dir, isRTL } = useI18n();

    // RTK Query hooks
    const { data: usersData } = useGetUsersQuery(undefined, { skip: activeTab !== 'overview' });
    const usersList = usersData?.users || [];
    
    const { data: withdrawalsData, isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useGetAllWithdrawalsQuery(undefined, {
        skip: activeTab !== 'overview' && activeTab !== 'withdrawals',
    });
    const withdrawalsList = withdrawalsData?.withdrawals || [];
    
    const { data: depositsData } = useGetTotalDepositsQuery(undefined, { skip: activeTab !== 'overview' });
    const totalDeposits = depositsData?.total ?? null;
    
    const { data: configsData, refetch: refetchConfigs } = useGetConfigsQuery(undefined, { skip: activeTab !== 'overview' });
    const configs = configsData?.configs || {};
    
    const { data: plansData, isLoading: plansLoading, refetch: refetchPlans } = useGetAdminPlansQuery(undefined, {
        skip: activeTab !== 'plans',
    });
    const plansList = plansData?.plans || [];
    
    // Mutations
    const [updateWithdrawalStatus] = useUpdateWithdrawalStatusMutation();
    const [updateConfig] = useUpdateConfigMutation();
    const [createPlan] = useCreatePlanMutation();
    const [updatePlan] = useUpdatePlanMutation();
    const [deletePlan] = useDeletePlanMutation();
    const { data: userFinanceData, isLoading: financeLoading } = useGetUserFinanceSummaryQuery(
        selectedWithdrawal?.user_id,
        { skip: !selectedWithdrawal?.user_id }
    );
    const userFinance = userFinanceData?.summary;

    const stats = [
        { label: "تعداد کاربران", value: usersList.length.toLocaleString('fa-IR') || "...", icon: Users, color: "text-blue-400" },
        { label: "درخواست برداشت", value: withdrawalsList.filter((w: any) => w.status === 'pending').length.toLocaleString('fa-IR') || "۰", icon: ArrowUpRight, color: "text-yellow-400" },
        { label: "مجموع واریزی‌ها", value: totalDeposits !== null ? `$${totalDeposits.toLocaleString()}` : "...", icon: Banknote, color: "text-green-400" },
        { label: "تراکنش‌ها", value: "مشاهده همه", icon: Database, color: "text-purple-400" },
    ];

    const handleUpdateConfig = async (key: string, value: string) => {
        setSaveConfigLoading(true);
        try {
            const result = await updateConfig({ key, value }).unwrap();
            if (result.success) {
                toast({ title: "تنظیمات ذخیره شد", description: "تغییرات با موفقیت اعمال شد" });
                refetchConfigs();
            } else {
                toast({ title: "خطا", description: "خطا در ذخیره تنظیمات", variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "خطا", description: err?.data?.error || "خطا در ذخیره تنظیمات", variant: "destructive" });
        } finally {
            setSaveConfigLoading(false);
        }
    };

    const handleOpenPlanDrawer = (plan?: any) => {
        if (plan) {
            setSelectedPlan(plan);
            setPlanForm({
                id: plan.id,
                name: plan.name,
                traffic: plan.traffic.toString(),
                duration: plan.duration.toString(),
                price: plan.price.toString(),
                description: plan.description || '',
                is_active: plan.is_active === 1,
                display_order: plan.display_order || 0
            });
        } else {
            setSelectedPlan(null);
            setPlanForm({
                id: '',
                name: '',
                traffic: '',
                duration: '',
                price: '',
                description: '',
                is_active: true,
                display_order: 0
            });
        }
        setIsPlanDrawerOpen(true);
    };

    const handleSavePlan = async () => {
        if (!planForm.id || !planForm.name || !planForm.traffic || !planForm.duration || !planForm.price) {
            toast({ title: "خطا", description: "لطفا تمام فیلدهای الزامی را پر کنید", variant: "destructive" });
            return;
        }

        setSavePlanLoading(true);
        const planData = {
            id: planForm.id,
            name: planForm.name,
            traffic: parseInt(planForm.traffic),
            duration: parseInt(planForm.duration),
            price: parseFloat(planForm.price),
            description: planForm.description,
            is_active: planForm.is_active,
            display_order: planForm.display_order
        };

        try {
            const result = selectedPlan
                ? await updatePlan({ planId: selectedPlan.id, plan: planData }).unwrap()
                : await createPlan(planData).unwrap();

            if (result.success) {
                toast({ title: "موفقیت", description: result.message || "پلن با موفقیت ذخیره شد" });
                setIsPlanDrawerOpen(false);
                refetchPlans();
            } else {
                toast({ title: "خطا", description: result.error || "خطا در ذخیره پلن", variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "خطا", description: err?.data?.error || "خطا در ذخیره پلن", variant: "destructive" });
        } finally {
            setSavePlanLoading(false);
        }
    };

    const handleDeletePlan = async () => {
        if (!planToDelete) return;
        try {
            const result = await deletePlan(planToDelete).unwrap();
            if (result.success) {
                toast({ title: "موفقیت", description: result.message || "پلن با موفقیت حذف شد" });
                setIsDeleteConfirmOpen(false);
                setPlanToDelete(null);
                refetchPlans();
            } else {
                toast({ title: "خطا", description: result.error || "خطا در حذف پلن", variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "خطا", description: err?.data?.error || "خطا در حذف پلن", variant: "destructive" });
        }
    };

    // Data is automatically fetched via RTK Query hooks based on activeTab

    const handleWithdrawAction = async (withdrawalId: string, status: 'completed' | 'failed') => {
        setActionLoading(withdrawalId);
        try {
            const result = await updateWithdrawalStatus({ withdrawalId, status }).unwrap();
            if (result.success) {
                toast({ title: "موفقیت", description: result.message });
                refetchWithdrawals();
                setIsDrawerOpen(false); // Close drawer after action
                setIsConfirmOpen(false);
            } else {
                toast({ title: "خطا", description: result.error || "خطا در بروزرسانی وضعیت", variant: "destructive" });
            }
        } catch (err: any) {
            toast({ title: "خطا", description: err?.data?.error || "خطا در ارتباط با سرور", variant: "destructive" });
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

    const handleWithdrawalClick = (withdrawal: any) => {
        setSelectedWithdrawal(withdrawal);
        setIsDrawerOpen(true);
        // Finance data is automatically fetched via RTK Query hook
    };

    return (
        <div className={`min-h-screen flex flex-col pb-28 bg-background ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
            <div className="p-6 pt-12 max-w-lg mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-8"
                >
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                        <h1 className={`text-2xl font-bold font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>پنل مدیریت</h1>
                        <p className={`text-muted-foreground text-sm font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>مدیریت سیستم و امور مالی</p>
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
                        onClick={() => setActiveTab("withdrawals")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${activeTab === "withdrawals" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"}`}
                    >
                        <ArrowUpRight size={16} />
                        برداشت‌ها
                    </button>
                    <button
                        onClick={() => setActiveTab("plans")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${activeTab === "plans" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"}`}
                    >
                        <Package size={16} />
                        پلن‌ها
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
                                        onClick={() => {
                                            if (index === 0) navigate('/admin/users');
                                            if (index === 1) navigate('/admin/withdrawals/pending');
                                            if (index === 2) navigate('/admin/deposits');
                                            if (index === 3) navigate('/admin/transactions');
                                        }}
                                        className={`glass p-5 rounded-3xl flex items-center justify-between border border-white/5 shadow-xl ${index <= 1 || index === 3 ? 'cursor-pointer hover:bg-white/5 active:scale-95 transition-all' : ''}`}
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
                                        {(index <= 1 || index === 3) && <ChevronRight size={16} className="text-muted-foreground rotate-180" />}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Welcome Bonus Section */}
                            <div className="glass rounded-3xl p-6 border border-white/5 shadow-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold flex items-center gap-2 font-vazir">
                                        <Wallet size={20} className="text-primary" />
                                        بونوس خوش‌آمدگویی
                                    </h2>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs font-vazir border-white/10 hover:bg-white/5"
                                        onClick={() => setIsBonusDrawerOpen(true)}
                                    >
                                        ویرایش
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-right">
                                        <div className="flex items-end gap-1">
                                            <span className="text-[10px] text-muted-foreground font-vazir mb-1">حجم هدیه</span>
                                            <span className="text-xl font-bold font-mono text-primary">{configs['welcome_bonus_traffic'] || '5'}</span>
                                            <span className="text-[10px] text-muted-foreground font-vazir mb-1">GB</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-right">
                                        <div className="flex items-end gap-1">
                                            <span className="text-[10px] text-muted-foreground font-vazir mb-1">مدت زمان</span>
                                            <span className="text-xl font-bold font-mono text-primary">{configs['welcome_bonus_duration'] || '30'}</span>
                                            <span className="text-[10px] text-muted-foreground font-vazir mb-1">روز</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Default Referral Commission Section */}
                            <div className="glass rounded-3xl p-6 border border-white/5 shadow-xl space-y-4">
                                <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold flex items-center gap-2 font-vazir">
                                        <Gift size={20} className="text-primary" />
                                        کمیسیون پیش‌فرض معرفی
                                </h2>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs font-vazir border-white/10 hover:bg-white/5"
                                        onClick={() => setIsReferralDrawerOpen(true)}
                                    >
                                        ویرایش
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-right">
                                        <div className="flex items-end gap-1">
                                            <span className="text-[10px] text-muted-foreground font-vazir mb-1">نرخ کمیسیون</span>
                                            <span className="text-xl font-bold font-mono text-primary">{configs['default_referral_commission_rate'] || '10.00'}</span>
                                            <span className="text-[10px] text-muted-foreground font-vazir mb-1">%</span>
                                </div>
                            </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-right">
                                        <div className="flex items-end gap-1">
                                            <span className="text-[10px] text-muted-foreground font-vazir mb-1">پاداش ثبت‌نام</span>
                                            <span className="text-xl font-bold font-mono text-primary">${configs['referral_registration_bonus'] || '1.00'}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-vazir text-right mt-2">
                                    این مقادیر برای کاربران جدید به صورت پیش‌فرض تنظیم می‌شود. می‌توانید برای هر کاربر به صورت جداگانه تغییر دهید.
                                </p>
                            </div>

                            {/* Custom Subscription Pricing Section */}
                            <div className="glass rounded-3xl p-6 border border-white/5 shadow-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold flex items-center gap-2 font-vazir">
                                        <Package size={20} className="text-primary" />
                                        قیمت‌گذاری اشتراک سفارشی
                                    </h2>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs font-vazir border-white/10 hover:bg-white/5"
                                        onClick={() => setIsCustomSubscriptionDrawerOpen(true)}
                                    >
                                        ویرایش
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-right">
                                        <div className="flex items-end gap-1">
                                            <span className="text-[10px] text-muted-foreground font-vazir mb-1">قیمت هر GB</span>
                                            <span className="text-xl font-bold font-mono text-primary">${configs['custom_subscription_traffic_price'] || '0.07'}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-right">
                                        <div className="flex items-end gap-1">
                                            <span className="text-[10px] text-muted-foreground font-vazir mb-1">قیمت هر روز</span>
                                            <span className="text-xl font-bold font-mono text-primary">${configs['custom_subscription_duration_price'] || '0.03'}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-vazir text-right mt-2">
                                    این قیمت‌ها برای محاسبه هزینه اشتراک‌های سفارشی استفاده می‌شود.
                                </p>
                            </div>

                            {/* Telegram Stars Pricing Section */}
                            <div className="glass rounded-3xl p-6 border border-white/5 shadow-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold flex items-center gap-2 font-vazir">
                                        <Star size={20} className="text-primary" />
                                        نرخ تبدیل ستاره‌های تلگرام
                                    </h2>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-xs font-vazir border-white/10 hover:bg-white/5"
                                        onClick={() => setIsTelegramStarsDrawerOpen(true)}
                                    >
                                        ویرایش
                                    </Button>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-right">
                                    <div className="flex items-end gap-1">
                                        <span className="text-[10px] text-muted-foreground font-vazir mb-1">ستاره به ازای هر دلار</span>
                                        <span className="text-xl font-bold font-mono text-primary">{configs['telegram_stars_per_usd'] || '100'}</span>
                                        <span className="text-[10px] text-muted-foreground font-vazir mb-1">ستاره</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-vazir text-right mt-2">
                                    این نرخ برای تبدیل مبلغ دلاری به ستاره‌های تلگرام استفاده می‌شود.
                                </p>
                            </div>

                        </motion.div>
                    ) : activeTab === "withdrawals" ? (
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
                                    onClick={() => refetchWithdrawals()}
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
                    ) : activeTab === "plans" ? (
                        <motion.div
                            key="plans"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold font-vazir">مدیریت پلن‌ها</h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => refetchPlans()}
                                        className={`p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${plansLoading ? "animate-spin" : ""}`}
                                    >
                                        <RefreshCcw size={16} />
                                    </button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleOpenPlanDrawer()}
                                        className="h-9 rounded-xl gap-2 font-vazir"
                                    >
                                        <Plus size={16} />
                                        افزودن پلن
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {plansLoading ? (
                                    <div className="py-12 text-center text-muted-foreground text-sm font-vazir">در حال بارگذاری...</div>
                                ) : plansList.length > 0 ? (
                                    plansList.map((plan) => (
                                        <motion.div
                                            key={plan.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="glass p-5 rounded-3xl border border-white/5 space-y-4 shadow-lg"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                                        <Package size={20} />
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-base font-vazir">{plan.name}</h4>
                                                            {plan.is_active === 0 && (
                                                                <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px]">غیرفعال</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground font-vazir mt-1">{plan.description || 'بدون توضیحات'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-left space-y-1">
                                                    <p className="text-lg font-bold font-mono text-primary">${plan.price}</p>
                                                    <p className="text-[10px] text-muted-foreground font-vazir">ID: {plan.id}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                                    <p className="text-[10px] text-muted-foreground font-vazir mb-1">حجم</p>
                                                    <p className="text-sm font-bold font-mono">{plan.traffic} GB</p>
                                                </div>
                                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                                    <p className="text-[10px] text-muted-foreground font-vazir mb-1">مدت زمان</p>
                                                    <p className="text-sm font-bold font-mono">{plan.duration} روز</p>
                                                </div>
                                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                                    <p className="text-[10px] text-muted-foreground font-vazir mb-1">ترتیب</p>
                                                    <p className="text-sm font-bold font-mono">{plan.display_order || 0}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2 border-t border-white/5">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 rounded-xl gap-2 font-vazir border-white/10 hover:bg-white/5"
                                                    onClick={() => handleOpenPlanDrawer(plan)}
                                                >
                                                    <Edit size={14} />
                                                    ویرایش
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="rounded-xl gap-2 font-vazir text-red-500 hover:bg-red-500/10 hover:text-red-500"
                                                    onClick={() => {
                                                        setPlanToDelete(plan.id);
                                                        setIsDeleteConfirmOpen(true);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-muted-foreground text-sm font-vazir">پلنی یافت نشد.</div>
                                )}
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            {/* Withdrawal Detail Drawer */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent className={`max-w-lg mx-auto ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
                    <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/10" />
                    <ScrollArea className="max-h-[85vh] overflow-y-auto">
                        <div className="p-6 space-y-8">
                            <DrawerHeader className={`p-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                                <DrawerTitle className={`text-2xl w-full font-bold font-vazir flex items-center gap-2 ${isRTL ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
                                    جزئیات درخواست برداشت
                                    <ArrowUpRight className="text-red-500" size={24} />
                                </DrawerTitle>
                                <DrawerDescription className={`font-vazir text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
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

            {/* Referral Commission Config Drawer */}
            <Drawer open={isReferralDrawerOpen} onOpenChange={setIsReferralDrawerOpen}>
                <DrawerContent className={`max-w-md mx-auto bg-card/95 backdrop-blur-xl border-white/10 font-vazir ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
                    <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/10" />
                    <div className="p-6 space-y-6">
                        <DrawerHeader className="p-0 text-right">
                            <DrawerTitle className="text-xl font-black">مدیریت کمیسیون پیش‌فرض معرفی</DrawerTitle>
                            <DrawerDescription className="font-vazir text-muted-foreground">
                                تنظیم نرخ کمیسیون و پاداش ثبت‌نام پیش‌فرض برای کاربران جدید
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="space-y-4">
                            <div className="space-y-2 text-right">
                                <Label htmlFor="commission-rate">نرخ کمیسیون تراکنش (%)</Label>
                                <div className="relative">
                                    <Input
                                        id="commission-rate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        className="bg-white/5 border-white/10 rounded-xl pl-10 font-mono text-left"
                                        value={defaultCommissionRate || configs['default_referral_commission_rate'] || '10.00'}
                                        onChange={(e) => setDefaultCommissionRate(e.target.value)}
                                    />
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                </div>
                                <p className="text-[10px] text-muted-foreground">درصد کمیسیون از هر تراکنش معرفی‌شده (0-100)</p>
                            </div>
                            <div className="space-y-2 text-right">
                                <Label htmlFor="registration-bonus">پاداش ثبت‌نام (USD)</Label>
                                <div className="relative">
                                    <Input
                                        id="registration-bonus"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="bg-white/5 border-white/10 rounded-xl pl-10 font-mono text-left"
                                        value={defaultRegistrationBonus || configs['referral_registration_bonus'] || '1.00'}
                                        onChange={(e) => setDefaultRegistrationBonus(e.target.value)}
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">$</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground">مبلغ پاداش برای هر ثبت‌نام از طریق لینک معرفی</p>
                            </div>
                        </div>

                        <DrawerFooter className="p-0 gap-3">
                            <Button
                                className="w-full rounded-xl font-bold h-12"
                                onClick={async () => {
                                    await handleUpdateConfig('default_referral_commission_rate', defaultCommissionRate || configs['default_referral_commission_rate'] || '10.00');
                                    await handleUpdateConfig('referral_registration_bonus', defaultRegistrationBonus || configs['referral_registration_bonus'] || '1.00');
                                    setIsReferralDrawerOpen(false);
                                }}
                                disabled={saveConfigLoading}
                            >
                                {saveConfigLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                            </Button>
                            <DrawerClose asChild>
                                <Button variant="ghost" className="rounded-xl h-12">انصراف</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Telegram Stars Pricing Drawer */}
            <Drawer open={isTelegramStarsDrawerOpen} onOpenChange={setIsTelegramStarsDrawerOpen}>
                <DrawerContent className={`max-w-md mx-auto bg-card/95 backdrop-blur-xl border-white/10 font-vazir ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
                    <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/10" />
                    <div className="p-6 space-y-6">
                        <DrawerHeader className="p-0 text-right">
                            <DrawerTitle className="text-xl font-black">مدیریت نرخ تبدیل ستاره‌های تلگرام</DrawerTitle>
                            <DrawerDescription className="font-vazir text-muted-foreground">
                                تنظیم تعداد ستاره‌های تلگرام به ازای هر دلار
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="space-y-4">
                            <div className="space-y-2 text-right">
                                <Label htmlFor="stars-per-usd">ستاره به ازای هر دلار</Label>
                                <div className="relative">
                                    <Input
                                        id="stars-per-usd"
                                        type="number"
                                        step="1"
                                        min="1"
                                        className="bg-white/5 border-white/10 rounded-xl pl-10 font-mono text-left"
                                        value={telegramStarsPerUSD || configs['telegram_stars_per_usd'] || '100'}
                                        onChange={(e) => setTelegramStarsPerUSD(e.target.value)}
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">⭐</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground">تعداد ستاره‌های تلگرام که معادل یک دلار است</p>
                            </div>
                        </div>

                        <DrawerFooter className="p-0 gap-3">
                            <Button
                                className="w-full rounded-xl font-bold h-12"
                                onClick={async () => {
                                    await handleUpdateConfig('telegram_stars_per_usd', telegramStarsPerUSD || configs['telegram_stars_per_usd'] || '100');
                                    setIsTelegramStarsDrawerOpen(false);
                                    setTelegramStarsPerUSD('');
                                }}
                                disabled={saveConfigLoading}
                            >
                                {saveConfigLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full rounded-xl font-bold h-12 border-white/10 hover:bg-white/5"
                                onClick={() => {
                                    setIsTelegramStarsDrawerOpen(false);
                                    setTelegramStarsPerUSD('');
                                }}
                            >
                                انصراف
                            </Button>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Custom Subscription Pricing Drawer */}
            <Drawer open={isCustomSubscriptionDrawerOpen} onOpenChange={setIsCustomSubscriptionDrawerOpen}>
                <DrawerContent className={`max-w-md mx-auto bg-card/95 backdrop-blur-xl border-white/10 font-vazir ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
                    <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/10" />
                    <div className="p-6 space-y-6">
                        <DrawerHeader className="p-0 text-right">
                            <DrawerTitle className="text-xl font-black">مدیریت قیمت‌گذاری اشتراک سفارشی</DrawerTitle>
                            <DrawerDescription className="font-vazir text-muted-foreground">
                                تنظیم قیمت هر گیگابایت و هر روز برای اشتراک‌های سفارشی
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="space-y-4">
                            <div className="space-y-2 text-right">
                                <Label htmlFor="traffic-price">قیمت هر گیگابایت (USD)</Label>
                                <div className="relative">
                                    <Input
                                        id="traffic-price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="bg-white/5 border-white/10 rounded-xl pl-10 font-mono text-left"
                                        value={customTrafficPrice || configs['custom_subscription_traffic_price'] || '0.07'}
                                        onChange={(e) => setCustomTrafficPrice(e.target.value)}
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">$</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground">قیمت هر گیگابایت ترافیک</p>
                            </div>
                            <div className="space-y-2 text-right">
                                <Label htmlFor="duration-price">قیمت هر روز (USD)</Label>
                                <div className="relative">
                                    <Input
                                        id="duration-price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="bg-white/5 border-white/10 rounded-xl pl-10 font-mono text-left"
                                        value={customDurationPrice || configs['custom_subscription_duration_price'] || '0.03'}
                                        onChange={(e) => setCustomDurationPrice(e.target.value)}
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">$</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground">قیمت هر روز اعتبار</p>
                            </div>
                        </div>

                        <DrawerFooter className="p-0 gap-3">
                            <Button
                                className="w-full rounded-xl font-bold h-12"
                                onClick={async () => {
                                    await handleUpdateConfig('custom_subscription_traffic_price', customTrafficPrice || configs['custom_subscription_traffic_price'] || '0.07');
                                    await handleUpdateConfig('custom_subscription_duration_price', customDurationPrice || configs['custom_subscription_duration_price'] || '0.03');
                                    setIsCustomSubscriptionDrawerOpen(false);
                                }}
                                disabled={saveConfigLoading}
                            >
                                {saveConfigLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                            </Button>
                            <DrawerClose asChild>
                                <Button variant="ghost" className="rounded-xl h-12">انصراف</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Bonus Config Drawer */}
            <Drawer open={isBonusDrawerOpen} onOpenChange={setIsBonusDrawerOpen}>
                <DrawerContent className={`max-w-md mx-auto bg-card/95 backdrop-blur-xl border-white/10 font-vazir ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
                    <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/10" />
                    <div className="p-6 space-y-6">
                        <DrawerHeader className="p-0 text-right">
                            <DrawerTitle className="text-xl font-black">مدیریت بونوس خوش‌آمدگویی</DrawerTitle>
                            <DrawerDescription className="font-vazir text-muted-foreground">
                                تنظیم مقدار حجم و زمان هدیه برای کاربران جدید
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="space-y-4">
                            <div className="space-y-2 text-right">
                                <Label htmlFor="traffic">حجم هدیه (گیگابایت)</Label>
                                <div className="relative">
                                    <Input
                                        id="traffic"
                                        type="number"
                                        className="bg-white/5 border-white/10 rounded-xl pl-10 font-mono text-left"
                                        value={bonusTraffic || configs['welcome_bonus_traffic'] || '5'}
                                        onChange={(e) => setBonusTraffic(e.target.value)}
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">GB</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-right">
                                <Label htmlFor="duration">مدت زمان (روز)</Label>
                                <div className="relative">
                                    <Input
                                        id="duration"
                                        type="number"
                                        className="bg-white/5 border-white/10 rounded-xl pl-10 font-mono text-left"
                                        value={bonusDuration || configs['welcome_bonus_duration'] || '30'}
                                        onChange={(e) => setBonusDuration(e.target.value)}
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-vazir">روز</span>
                                </div>
                            </div>
                        </div>

                        <DrawerFooter className="p-0 gap-3">
                            <Button
                                className="w-full rounded-xl font-bold h-12"
                                onClick={async () => {
                                    await handleUpdateConfig('welcome_bonus_traffic', bonusTraffic || configs['welcome_bonus_traffic'] || '5');
                                    await handleUpdateConfig('welcome_bonus_duration', bonusDuration || configs['welcome_bonus_duration'] || '30');
                                    setIsBonusDrawerOpen(false);
                                }}
                                disabled={saveConfigLoading}
                            >
                                {saveConfigLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                            </Button>
                            <DrawerClose asChild>
                                <Button variant="ghost" className="rounded-xl h-12">انصراف</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Plan Edit/Create Drawer */}
            <Drawer open={isPlanDrawerOpen} onOpenChange={setIsPlanDrawerOpen}>
                <DrawerContent className={`max-w-md mx-auto bg-card/95 backdrop-blur-xl border-white/10 font-vazir ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
                    <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/10" />
                    <ScrollArea className="max-h-[85vh] overflow-y-auto">
                        <div className="p-6 space-y-6">
                            <DrawerHeader className="p-0 text-right">
                                <DrawerTitle className="text-xl font-black">
                                    {selectedPlan ? 'ویرایش پلن' : 'افزودن پلن جدید'}
                                </DrawerTitle>
                                <DrawerDescription className="font-vazir text-muted-foreground">
                                    {selectedPlan ? 'ویرایش اطلاعات و ویژگی‌های پلن' : 'ایجاد پلن جدید برای کاربران'}
                                </DrawerDescription>
                            </DrawerHeader>

                            <div className="space-y-4">
                                <div className="space-y-2 text-right">
                                    <Label htmlFor="plan-id">شناسه پلن (ID)</Label>
                                    <Input
                                        id="plan-id"
                                        className="bg-white/5 border-white/10 rounded-xl font-mono"
                                        value={planForm.id}
                                        onChange={(e) => setPlanForm({ ...planForm, id: e.target.value })}
                                        disabled={!!selectedPlan}
                                        placeholder="مثال: bronze"
                                    />
                                    <p className="text-[10px] text-muted-foreground">شناسه یکتا برای پلن (فقط حروف انگلیسی و اعداد)</p>
                                </div>

                                <div className="space-y-2 text-right">
                                    <Label htmlFor="plan-name">نام پلن</Label>
                                    <Input
                                        id="plan-name"
                                        className="bg-white/5 border-white/10 rounded-xl font-vazir"
                                        value={planForm.name}
                                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                        placeholder="مثال: برنز (اقتصادی)"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2 text-right">
                                        <Label htmlFor="plan-traffic">حجم (GB)</Label>
                                        <Input
                                            id="plan-traffic"
                                            type="number"
                                            className="bg-white/5 border-white/10 rounded-xl font-mono text-left"
                                            value={planForm.traffic}
                                            onChange={(e) => setPlanForm({ ...planForm, traffic: e.target.value })}
                                            placeholder="10"
                                        />
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <Label htmlFor="plan-duration">مدت زمان (روز)</Label>
                                        <Input
                                            id="plan-duration"
                                            type="number"
                                            className="bg-white/5 border-white/10 rounded-xl font-mono text-left"
                                            value={planForm.duration}
                                            onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
                                            placeholder="30"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2 text-right">
                                        <Label htmlFor="plan-price">قیمت ($)</Label>
                                        <Input
                                            id="plan-price"
                                            type="number"
                                            step="0.01"
                                            className="bg-white/5 border-white/10 rounded-xl font-mono text-left"
                                            value={planForm.price}
                                            onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                                            placeholder="2.00"
                                        />
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <Label htmlFor="plan-order">ترتیب نمایش</Label>
                                        <Input
                                            id="plan-order"
                                            type="number"
                                            className="bg-white/5 border-white/10 rounded-xl font-mono text-left"
                                            value={planForm.display_order}
                                            onChange={(e) => setPlanForm({ ...planForm, display_order: parseInt(e.target.value) || 0 })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 text-right">
                                    <Label htmlFor="plan-description">توضیحات</Label>
                                    <Textarea
                                        id="plan-description"
                                        className="bg-white/5 border-white/10 rounded-xl font-vazir resize-none"
                                        rows={3}
                                        value={planForm.description}
                                        onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                                        placeholder="توضیحات پلن..."
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                                    <Label htmlFor="plan-active" className="cursor-pointer font-vazir">فعال بودن پلن</Label>
                                    <Switch
                                        id="plan-active"
                                        checked={planForm.is_active}
                                        onCheckedChange={(checked) => setPlanForm({ ...planForm, is_active: checked })}
                                    />
                                </div>
                            </div>

                            <DrawerFooter className="p-0 gap-3">
                                <Button
                                    className="w-full rounded-xl font-bold h-12"
                                    onClick={handleSavePlan}
                                    disabled={savePlanLoading}
                                >
                                    {savePlanLoading ? 'در حال ذخیره...' : selectedPlan ? 'ذخیره تغییرات' : 'ایجاد پلن'}
                                </Button>
                                <DrawerClose asChild>
                                    <Button variant="ghost" className="rounded-xl h-12">انصراف</Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </div>
                    </ScrollArea>
                </DrawerContent>
            </Drawer>

            {/* Delete Plan Confirmation */}
            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogContent className="font-vazir text-right" dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف پلن</AlertDialogTitle>
                        <AlertDialogDescription>
                            آیا از حذف این پلن اطمینان دارید؟ این عمل غیرقابل بازگشت است.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl font-vazir">انصراف</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePlan}
                            className="rounded-xl font-vazir bg-red-600 hover:bg-red-700"
                        >
                            بله، حذف کن
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <BottomNav />
            <br />
        </div>
    );
};

export default AdminPage;
