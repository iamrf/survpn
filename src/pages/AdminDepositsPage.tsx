import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Search,
    RefreshCcw,
    ArrowDownLeft,
    Copy,
    User,
    Filter,
    X as Close,
    Check,
    RefreshCw,
    Banknote
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetAllTransactionsQuery, useVerifyPlisioTransactionMutation } from "@/store/api";
import BottomNav from "@/components/BottomNav";
import { useI18n } from "@/lib/i18n";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";

const AdminDepositsPage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { t, dir, isRTL } = useI18n();
    
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);

    // Show back button
    useTelegramBackButton({
        isVisible: true,
        onClick: () => navigate('/admin'),
    });

    const { data, isLoading, refetch } = useGetAllTransactionsQuery({
        type: 'deposit',
        status: 'completed',
        limit: 500
    });

    const [verifyPlisioTransaction] = useVerifyPlisioTransactionMutation();

    // Filter only completed deposits
    const allTransactions = data?.transactions || [];
    const deposits = allTransactions.filter((tx: any) => 
        tx.type === 'deposit' && 
        (tx.status === 'completed' || tx.status === 'paid')
    );

    const filteredDeposits = deposits.filter((tx: any) => {
        const matchesSearch = 
            tx.id?.toString().includes(searchQuery) ||
            tx.user_id?.toString().includes(searchQuery) ||
            tx.plisio_invoice_id?.toString().includes(searchQuery) ||
            tx.telegram_stars_order_id?.toString().includes(searchQuery);
        
        return matchesSearch;
    });

    // Calculate total
    const totalAmount = filteredDeposits.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

    const handleTxClick = (tx: any) => {
        setSelectedTx(tx);
        setIsDrawerOpen(true);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ 
            title: t.common.copied, 
            description: t.common.copied 
        });
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
                    title: t.common.success, 
                    description: result.message || t.common.success 
                });
                refetch();
                setIsDrawerOpen(false);
            } else {
                toast({ 
                    title: t.common.error, 
                    description: result.error || t.common.error,
                    variant: "destructive" 
                });
            }
        } catch (err: any) {
            toast({ 
                title: t.common.error, 
                description: err?.data?.error || t.common.error,
                variant: "destructive" 
            });
        } finally {
            setVerifyLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex flex-col pb-24 bg-background ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
            <div className="p-6 pt-12 max-w-lg mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-3 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/admin')}
                        className={`h-10 w-10 ${isRTL ? '' : ''}`}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className={`p-3 rounded-2xl bg-primary/10 text-primary`}>
                        <Banknote className="h-8 w-8" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                        <h1 className={`text-2xl font-bold font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t.admin.completedDeposits || 'Completed Deposits'}
                        </h1>
                        <p className={`text-muted-foreground text-sm font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t.admin.allCompletedDeposits || 'All completed deposit transactions'}
                        </p>
                    </div>
                </motion.div>

                {/* Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-5 rounded-3xl border border-white/5 shadow-xl mb-6"
                >
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                            <p className={`text-muted-foreground text-xs font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                {t.admin.totalCompletedDeposits || 'Total Completed Deposits'}
                            </p>
                            <p className="text-2xl font-bold font-mono text-green-500">
                                ${totalAmount.toLocaleString()}
                            </p>
                            <p className={`text-xs text-muted-foreground font-vazir mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                {filteredDeposits.length} {t.admin.transactions || 'transactions'}
                            </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-green-500/10 text-green-500">
                            <Banknote className="h-6 w-6" />
                        </div>
                    </div>
                </motion.div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                    <Input
                        type="text"
                        placeholder={t.admin.searchTransactions || 'Search by ID, User ID, Invoice ID...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`${isRTL ? 'pr-10' : 'pl-10'}`}
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`absolute top-1/2 -translate-y-1/2 h-8 w-8 ${isRTL ? 'left-2' : 'right-2'}`}
                            onClick={() => setSearchQuery("")}
                        >
                            <Close className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Transactions List */}
                {isLoading ? (
                    <div className={`text-center py-10 text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.common.loading}
                    </div>
                ) : filteredDeposits.length === 0 ? (
                    <div className={`text-center py-10 text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.admin.noTransactions || 'No completed deposits found'}
                    </div>
                ) : (
                    <ScrollArea className="h-[calc(100vh-400px)]">
                        <div className="space-y-3">
                            {filteredDeposits.map((tx: any) => (
                                <motion.div
                                    key={tx.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handleTxClick(tx)}
                                    className="glass p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/5 active:scale-95 transition-all"
                                >
                                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <div className={`flex items-center gap-3 flex-1 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <div className="p-2 rounded-xl bg-green-500/10 text-green-500 shrink-0">
                                                <ArrowDownLeft className="w-5 h-5" />
                                            </div>
                                            <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                                                <p className="text-lg font-bold font-mono text-green-500">
                                                    +${tx.amount?.toLocaleString()}
                                                </p>
                                                <p className={`text-xs text-muted-foreground font-vazir mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                                    {new Date(tx.created_at).toLocaleString(isRTL ? 'fa-IR' : 'en-US')}
                                                </p>
                                                <p className={`text-[10px] text-muted-foreground font-mono mt-1 ${isRTL ? 'text-right' : 'text-left'}`} dir="ltr">
                                                    ID: {tx.id}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`shrink-0 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                                            <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px]">
                                                {t.wallet.transactionCompleted}
                                            </Badge>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </ScrollArea>
                )}

                {/* Transaction Detail Drawer */}
                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <DrawerContent className={`max-w-lg mx-auto ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
                        <div className="p-6 pb-12">
                            <DrawerHeader className="p-0 mb-6">
                                <DrawerTitle className={`font-vazir text-xl ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t.admin.transactionDetails || 'Transaction Details'}
                                </DrawerTitle>
                                <DrawerDescription className={`font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                    {t.admin.depositTransactionInfo || 'Deposit transaction information'}
                                </DrawerDescription>
                            </DrawerHeader>

                            {selectedTx && (
                                <ScrollArea className="max-h-[60vh] pr-4">
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-muted/50 border">
                                            <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <span className={`text-sm font-bold font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                                    {t.wallet.amount}
                                                </span>
                                                <span className="text-xl font-bold font-mono text-green-500">
                                                    +${selectedTx.amount?.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <span className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                                    {t.wallet.status}
                                                </span>
                                                <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px]">
                                                    {t.wallet.transactionCompleted}
                                                </Badge>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-3">
                                            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <span className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                                    {t.admin.transactionId || 'Transaction ID'}
                                                </span>
                                                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-xs font-mono" dir="ltr">{selectedTx.id}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => copyToClipboard(selectedTx.id)}
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <span className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                                    {t.admin.userId || 'User ID'}
                                                </span>
                                                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-xs font-mono" dir="ltr">{selectedTx.user_id}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => copyToClipboard(selectedTx.user_id?.toString())}
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {selectedTx.plisio_invoice_id && (
                                                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                    <span className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                                        Plisio Invoice ID
                                                    </span>
                                                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                        <span className="text-xs font-mono" dir="ltr">{selectedTx.plisio_invoice_id}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => copyToClipboard(selectedTx.plisio_invoice_id)}
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedTx.telegram_stars_order_id && (
                                                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                    <span className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                                        Telegram Stars Order ID
                                                    </span>
                                                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                        <span className="text-xs font-mono" dir="ltr">{selectedTx.telegram_stars_order_id}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => copyToClipboard(selectedTx.telegram_stars_order_id)}
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <span className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                                    {t.wallet.paymentMethod || 'Payment Method'}
                                                </span>
                                                <span className="text-xs font-vazir">
                                                    {selectedTx.payment_method === 'plisio' ? t.wallet.crypto : 
                                                     selectedTx.payment_method === 'telegram_stars' ? t.wallet.telegramStars :
                                                     selectedTx.payment_method || '-'}
                                                </span>
                                            </div>

                                            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <span className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                                                    {t.wallet.date || 'Date'}
                                                </span>
                                                <span className="text-xs font-vazir">
                                                    {new Date(selectedTx.created_at).toLocaleString(isRTL ? 'fa-IR' : 'en-US')}
                                                </span>
                                            </div>
                                        </div>

                                        {selectedTx.plisio_invoice_id && (
                                            <>
                                                <Separator />
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={handleVerifyPlisio}
                                                    disabled={verifyLoading}
                                                >
                                                    {verifyLoading ? t.common.processing : t.wallet.checkTransactions}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </ScrollArea>
                            )}

                            <DrawerClose asChild>
                                <Button variant="outline" className="w-full mt-4">{t.common.close}</Button>
                            </DrawerClose>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
            <BottomNav />
        </div>
    );
};

export default AdminDepositsPage;
