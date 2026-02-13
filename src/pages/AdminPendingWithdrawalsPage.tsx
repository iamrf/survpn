import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Search,
    RefreshCcw,
    ArrowUpRight,
    X as Close,
    Check,
    Copy,
    Wallet,
    User,
    ShieldCheck,
    Clock,
    Database,
    TrendingUp,
    TrendingDown
} from "lucide-react";
import { getAllWithdrawals, updateWithdrawalStatus, getUserFinanceSummary } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
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
import BottomNav from "@/components/BottomNav";

const AdminPendingWithdrawalsPage = () => {
    const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
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

    const fetchPendingWithdrawals = async () => {
        setLoading(true);
        const result = await getAllWithdrawals();
        if (result.success && result.withdrawals) {
            // Filter only pending
            setWithdrawalsList(result.withdrawals.filter((w: any) => w.status === 'pending'));
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPendingWithdrawals();
    }, []);

    const handleWithdrawAction = async (withdrawalId: string, status: 'completed' | 'failed') => {
        setActionLoading(withdrawalId);
        try {
            const result = await updateWithdrawalStatus(withdrawalId, status);
            if (result.success) {
                toast({ title: "موفقیت", description: result.message });
                fetchPendingWithdrawals();
                setIsDrawerOpen(false);
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "کپی شد", description: "در حافظه کپی شد." });
    };

    const filteredWithdrawals = withdrawalsList.filter(w =>
        w.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.user_id?.toString().includes(searchQuery)
    );

    return (
        <div className="min-h-screen flex flex-col pb-28 bg-background" dir="rtl">
            <div className="p-6 pt-12 max-w-lg mx-auto w-full">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-white/5">
                            <ArrowLeft size={20} className="rotate-180" />
                        </Button>
                        <div className="text-right">
                            <h1 className="text-xl font-bold font-vazir">درخواست‌های برداشت</h1>
                            <p className="text-muted-foreground text-xs font-vazir">مدیریت پرداخت‌های در انتظار</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchPendingWithdrawals}
                        className={`p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${loading ? "animate-spin" : ""}`}
                    >
                        <RefreshCcw size={18} />
                    </button>
                </header>

                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="جستجوی کاربر یا آیدی..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors font-vazir text-right"
                        />
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-12 text-center text-muted-foreground text-sm font-vazir">در حال بارگذاری...</div>
                        ) : filteredWithdrawals.length > 0 ? (
                            filteredWithdrawals.map((withdrawal) => (
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
                                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10 border-yellow-500/20 text-[10px]">در انتظار</Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                                        <span className="font-vazir">زمان درخواست:</span>
                                        <span className="font-mono">{new Date(withdrawal.created_at).toLocaleString('fa-IR')}</span>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-muted-foreground text-sm font-vazir bg-white/5 rounded-3xl border border-white/5 italic">
                                درخواست در انتظاری یافت نشد.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Withdrawal Detail Drawer */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent className="max-w-lg mx-auto" dir="rtl">
                    <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/10" />
                    <ScrollArea className="max-h-[85vh] overflow-y-auto">
                        <div className="p-6 space-y-8">
                            <DrawerHeader className="p-0 text-right">
                                <DrawerTitle className="text-2xl w-full font-bold font-vazir flex items-center justify-end gap-2 text-right">
                                    جزئیات درخواست برداشت
                                    <ArrowUpRight className="text-red-500" size={24} />
                                </DrawerTitle>
                                <DrawerDescription className="font-vazir text-muted-foreground text-right">
                                    بررسی اطلاعات مالی و تایید پرداخت
                                </DrawerDescription>
                            </DrawerHeader>

                            {selectedWithdrawal && (
                                <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/5">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-xl bg-white/5 text-primary hover:bg-primary hover:text-white"
                                        onClick={() => navigate(`/admin/user/${selectedWithdrawal.user_id}`)}
                                    >
                                        <User size={20} />
                                    </Button>
                                    <div className="text-right">
                                        <h3 className="font-bold text-lg font-vazir">{selectedWithdrawal.first_name} {selectedWithdrawal.last_name}</h3>
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-xs text-muted-foreground font-mono">@{selectedWithdrawal.username}</span>
                                            <Separator orientation="vertical" className="h-3 bg-white/10" />
                                            <span className="text-xs text-muted-foreground font-mono">ID: {selectedWithdrawal.user_id}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedWithdrawal && (
                                <div className="space-y-4">
                                    <h4 className="font-vazir font-semibold text-sm flex items-center justify-end gap-2 text-primary text-right">
                                        اطلاعات برداشت جاری
                                        <Wallet size={16} />
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="glass p-4 rounded-2xl border border-white/5 space-y-1">
                                            <p className="text-[10px] text-muted-foreground font-vazir text-right">وضعیت فعلی</p>
                                            <div className="pt-1 flex justify-end">
                                                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10 border-yellow-500/20 text-[10px]">در انتظار</Badge>
                                            </div>
                                        </div>
                                        <div className="glass p-4 rounded-2xl border border-white/5 space-y-1">
                                            <p className="text-[10px] text-muted-foreground font-vazir text-right">مبلغ درخواستی</p>
                                            <p className="text-xl font-bold font-mono text-red-500 text-right">{(selectedWithdrawal.amount).toLocaleString()} $</p>
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
                                            <p className="text-[10px] text-muted-foreground font-vazir text-right">آدرس کیف پول گیرنده</p>
                                        </div>
                                        <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                            <p dir="ltr" className="text-xs font-mono break-all text-left text-muted-foreground leading-relaxed">
                                                {selectedWithdrawal.address}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 text-right">
                                <h4 className="font-vazir font-semibold text-sm flex items-center justify-end gap-2 text-primary text-right">
                                    خلاصه وضعیت مالی کاربر
                                    <Database size={16} />
                                </h4>
                                {financeLoading ? (
                                    <div className="py-8 text-center text-muted-foreground text-xs font-vazir text-right">در حال دریافت آمار...</div>
                                ) : userFinance ? (
                                    <div className="space-y-3 text-right">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 flex items-center justify-between gap-2">
                                                <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                                                    <TrendingUp size={18} />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted-foreground font-vazir text-right">مجموع برداشت</p>
                                                    <p className="text-sm font-bold font-mono text-red-500 text-right">${userFinance.totalWithdrawals.toLocaleString()} $</p>
                                                </div>
                                            </div>
                                            <div className="bg-green-500/5 p-4 rounded-2xl border border-green-500/10 flex items-center justify-between gap-2">
                                                <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                                                    <TrendingDown size={18} />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted-foreground font-vazir text-right">مجموع واریزی</p>
                                                    <p className="text-sm font-bold font-mono text-green-500 text-right">{userFinance.totalDeposits.toLocaleString()} $</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-4 text-center text-muted-foreground text-[10px] font-vazir italic text-right">اطلاعات مالی در دسترس نیست</div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <Button
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-vazir h-12 rounded-2xl shadow-lg shadow-green-500/20 gap-2"
                                    onClick={() => confirmWithdrawAction('completed')}
                                    disabled={actionLoading === selectedWithdrawal?.id}
                                >
                                    <Check size={20} />
                                    تایید و پرداخت
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-vazir h-12 rounded-2xl border border-red-500/10 gap-2"
                                    onClick={() => confirmWithdrawAction('failed')}
                                    disabled={actionLoading === selectedWithdrawal?.id}
                                >
                                    <Close size={20} />
                                    رد درخواست
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>
                </DrawerContent>
            </Drawer>

            {/* Confirmation Dialog */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="font-vazir text-right" dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">
                            {confirmType === 'completed' ? "تایید نهایی واریز" : "رد درخواست برداشت"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            {confirmType === 'completed'
                                ? `آیا از تایید و پرداخت ${selectedWithdrawal?.amount?.toLocaleString()} دلار به این کاربر اطمینان دارید؟`
                                : "آیا از رد این درخواست برداشت اطمینان دارید؟ مبلغ به کیف پول کاربر عودت داده خواهد شد."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-3 sm:gap-0">
                        <AlertDialogAction
                            onClick={() => selectedWithdrawal && handleWithdrawAction(selectedWithdrawal.id, confirmType!)}
                            className={`flex-1 rounded-xl font-vazir ${confirmType === 'completed' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                        >
                            بله، مطمئنم
                        </AlertDialogAction>
                        <AlertDialogCancel className="flex-1 rounded-xl font-vazir mt-0">انصراف</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <BottomNav />
        </div>
    );
};

export default AdminPendingWithdrawalsPage;
