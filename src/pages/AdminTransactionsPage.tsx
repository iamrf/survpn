import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Search,
    RefreshCcw,
    ArrowUpRight,
    ArrowDownLeft,
    Copy,
    User,
    Filter,
    X as Close,
    Check,
    RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetAllTransactionsQuery, useVerifyPlisioTransactionMutation } from "@/store/api";
import BottomNav from "@/components/BottomNav";

const AdminTransactionsPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);

    const { data, isLoading, refetch } = useGetAllTransactionsQuery({
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        limit: 200
    });

    const [verifyPlisioTransaction] = useVerifyPlisioTransactionMutation();

    const transactions = data?.transactions || [];

    const filteredTransactions = transactions.filter((tx: any) => {
        const matchesSearch = 
            tx.id?.toString().includes(searchQuery) ||
            tx.user_id?.toString().includes(searchQuery) ||
            tx.plisio_invoice_id?.toString().includes(searchQuery) ||
            tx.telegram_stars_order_id?.toString().includes(searchQuery);
        
        return matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            completed: { label: "تکمیل شده", className: "bg-green-500/10 text-green-500 border-green-500/20" },
            paid: { label: "پرداخت شده", className: "bg-green-500/10 text-green-500 border-green-500/20" },
            pending: { label: "در انتظار", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
            failed: { label: "ناموفق", className: "bg-red-500/10 text-red-500 border-red-500/20" },
            cancelled: { label: "لغو شده", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
            expired: { label: "منقضی شده", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
        };
        const statusInfo = statusMap[status] || { label: status, className: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
        return (
            <Badge variant="secondary" className={`${statusInfo.className} text-[10px]`}>
                {statusInfo.label}
            </Badge>
        );
    };

    const getTypeLabel = (type: string) => {
        const typeMap: Record<string, string> = {
            deposit: "شارژ حساب",
            withdrawal: "برداشت وجه",
            subscription: "خرید اشتراک",
            custom_subscription: "اشتراک سفارشی",
        };
        return typeMap[type] || type;
    };

    const handleTxClick = (tx: any) => {
        setSelectedTx(tx);
        setIsDrawerOpen(true);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "کپی شد", description: "در حافظه کپی شد." });
    };

    const handleVerifyPlisio = async () => {
        if (!selectedTx?.plisio_invoice_id) return;
        
        setVerifyLoading(true);
        try {
            const result = await verifyPlisioTransaction({
                order_number: selectedTx.id,
                txn_id: selectedTx.plisio_invoice_id
            }).unwrap();
            
            if (result.success) {
                toast({
                    title: "موفقیت",
                    description: result.message || "تراکنش با موفقیت تایید و به‌روزرسانی شد",
                });
                refetch();
            } else {
                toast({
                    title: "خطا",
                    description: result.error || "خطا در تایید تراکنش",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "خطا",
                description: error?.data?.error || "مشکلی در تایید تراکنش پیش آمد",
                variant: "destructive",
            });
        } finally {
            setVerifyLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col pb-28 bg-background relative z-0" dir="rtl">
            <div className="p-6 pt-12 max-w-lg mx-auto w-full">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-white/5">
                            <ArrowLeft size={20} className="rotate-180" />
                        </Button>
                        <div className="text-right">
                            <h1 className="text-xl font-bold font-vazir">همه تراکنش‌ها</h1>
                            <p className="text-muted-foreground text-xs font-vazir">مدیریت و مشاهده تمام تراکنش‌های سیستم</p>
                        </div>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className={`p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${isLoading ? "animate-spin" : ""}`}
                    >
                        <RefreshCcw size={18} />
                    </button>
                </header>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="جستجوی تراکنش، کاربر یا شناسه..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors font-vazir text-right"
                        />
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground font-vazir text-right">وضعیت</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="bg-white/5 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">همه</SelectItem>
                                    <SelectItem value="pending">در انتظار</SelectItem>
                                    <SelectItem value="completed">تکمیل شده</SelectItem>
                                    <SelectItem value="paid">پرداخت شده</SelectItem>
                                    <SelectItem value="failed">ناموفق</SelectItem>
                                    <SelectItem value="cancelled">لغو شده</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground font-vazir text-right">نوع</label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="bg-white/5 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">همه</SelectItem>
                                    <SelectItem value="deposit">شارژ حساب</SelectItem>
                                    <SelectItem value="withdrawal">برداشت وجه</SelectItem>
                                    <SelectItem value="subscription">خرید اشتراک</SelectItem>
                                    <SelectItem value="custom_subscription">اشتراک سفارشی</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Transactions List */}
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="py-12 text-center text-muted-foreground text-sm font-vazir">در حال بارگذاری...</div>
                        ) : filteredTransactions.length > 0 ? (
                            filteredTransactions.map((tx: any) => {
                                const isPositive = tx.type === 'deposit';
                                return (
                                    <motion.div
                                        key={tx.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => handleTxClick(tx)}
                                        className="glass p-4 rounded-2xl border border-white/5 space-y-3 cursor-pointer hover:bg-white/5 transition-colors"
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
                                                    <p className="text-sm font-bold font-vazir">{getTypeLabel(tx.type)}</p>
                                                    <p className="text-[10px] text-muted-foreground font-vazir px-1">{new Date(tx.created_at).toLocaleString('fa-IR')}</p>
                                                </div>
                                                <div className={`p-2 rounded-xl ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {isPositive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                            <span className="font-vazir">کاربر ID: {tx.user_id}</span>
                                            <span className="font-mono">TX: {tx.id}</span>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="py-12 text-center text-muted-foreground text-sm font-vazir bg-white/5 rounded-3xl border border-white/5 italic">
                                تراکنشی یافت نشد.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transaction Detail Drawer */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
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

                                    <div className="space-y-4">
                                        <h4 className="font-vazir font-semibold text-sm flex items-center justify-end gap-2 text-primary">
                                            اطلاعات تراکنش
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="glass p-4 rounded-2xl border border-white/5 space-y-1">
                                                <p className="text-[10px] text-muted-foreground text-right">نوع تراکنش</p>
                                                <p className="font-bold text-sm">{getTypeLabel(selectedTx.type)}</p>
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

                                        {/* Transaction IDs */}
                                        <div className="space-y-3">
                                            <div className="glass p-4 rounded-2xl border border-white/5 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-[10px] gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                                                        onClick={() => copyToClipboard(selectedTx.id)}
                                                    >
                                                        <Copy size={12} /> کپی
                                                    </Button>
                                                    <p className="text-[10px] text-muted-foreground">شناسه تراکنش</p>
                                                </div>
                                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                                    <p dir="ltr" className="text-xs font-mono break-all text-left text-muted-foreground leading-relaxed">
                                                        {selectedTx.id}
                                                    </p>
                                                </div>
                                            </div>

                                            {selectedTx.plisio_invoice_id && (
                                                <div className="glass p-4 rounded-2xl border border-white/5 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-[10px] gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                                                            onClick={() => copyToClipboard(selectedTx.plisio_invoice_id)}
                                                        >
                                                            <Copy size={12} /> کپی
                                                        </Button>
                                                        <p className="text-[10px] text-muted-foreground">شناسه فاکتور Plisio</p>
                                                    </div>
                                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                                        <p dir="ltr" className="text-xs font-mono break-all text-left text-muted-foreground leading-relaxed">
                                                            {selectedTx.plisio_invoice_id}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedTx.telegram_stars_order_id && (
                                                <div className="glass p-4 rounded-2xl border border-white/5 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-[10px] gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                                                            onClick={() => copyToClipboard(selectedTx.telegram_stars_order_id)}
                                                        >
                                                            <Copy size={12} /> کپی
                                                        </Button>
                                                        <p className="text-[10px] text-muted-foreground">شناسه سفارش Telegram Stars</p>
                                                    </div>
                                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                                        <p dir="ltr" className="text-xs font-mono break-all text-left text-muted-foreground leading-relaxed">
                                                            {selectedTx.telegram_stars_order_id}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedTx.payment_method && (
                                                <div className="glass p-4 rounded-2xl border border-white/5 space-y-1">
                                                    <p className="text-[10px] text-muted-foreground text-right">روش پرداخت</p>
                                                    <p className="text-sm font-bold">
                                                        {selectedTx.payment_method === 'plisio' ? 'Plisio (کریپتو)' :
                                                         selectedTx.payment_method === 'telegram_stars' ? 'Telegram Stars' :
                                                         selectedTx.payment_method === 'heleket' ? 'Heleket' :
                                                         selectedTx.payment_method}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        {selectedTx.type === 'deposit' && selectedTx.status === 'pending' && selectedTx.plisio_invoice_id && (
                                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                                <Button
                                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-12 rounded-2xl shadow-lg shadow-blue-500/20 gap-2"
                                                    onClick={handleVerifyPlisio}
                                                    disabled={verifyLoading}
                                                >
                                                    <RefreshCw size={20} className={verifyLoading ? "animate-spin" : ""} />
                                                    {verifyLoading ? "در حال بررسی..." : "بررسی و تایید از Plisio"}
                                                </Button>
                                            </div>
                                        )}

                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => navigate(`/admin/user/${selectedTx.user_id}`)}
                                        >
                                            <User size={16} className="ml-2" />
                                            مشاهده کاربر
                                        </Button>
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

            <BottomNav />
        </div>
    );
};

export default AdminTransactionsPage;
