import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Zap, Clock, HardDrive, ShieldCheck, Star, Trophy, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
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

interface Plan {
    id: string;
    name: string;
    traffic: number;
    duration: number;
    price: number;
    description?: string;
}

interface SubscriptionPlanProps {
    plan: Plan;
    onPurchase: (plan: Plan) => void;
    isLoading?: boolean;
}

const SubscriptionPlan: React.FC<SubscriptionPlanProps> = ({ plan, onPurchase, isLoading }) => {
    const isGold = plan.id === 'gold';
    const isSilver = plan.id === 'silver';
    const isBronze = plan.id === 'bronze';

    const getTierColor = () => {
        if (isGold) return 'from-yellow-400 via-amber-500 to-yellow-600';
        if (isSilver) return 'from-slate-300 via-gray-400 to-slate-500';
        return 'from-orange-400 via-amber-600 to-orange-700';
    };

    const getIcon = () => {
        if (isGold) return <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
        if (isSilver) return <Star className="w-8 h-8 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]" />;
        return <ShieldCheck className="w-8 h-8 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="h-full"
        >
            <Card className={`relative h-full overflow-hidden border-none bg-card/40 backdrop-blur-xl shadow-2xl group transition-all duration-500 ${isGold ? 'ring-2 ring-yellow-500/30' : ''}`}>
                {/* Background Glow */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${getTierColor()} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />

                <CardHeader className="relative space-y-1 pb-4">
                    <div className="flex justify-between items-start">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="p-3 bg-white/5 rounded-2xl border border-white/10"
                        >
                            {getIcon()}
                        </motion.div>
                        <Badge variant="outline" className={`font-mono text-lg py-1 px-3 border-white/10 bg-white/5 backdrop-blur-md ${isGold ? 'text-yellow-400' : 'text-foreground'}`}>
                            ${plan.price}
                        </Badge>
                    </div>
                    <CardTitle className="text-2xl font-black font-vazir pt-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        {plan.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-vazir">
                        {plan.description || 'پلن اختصاصی سرویس وی‌پی‌ان'}
                    </p>
                </CardHeader>

                <CardContent className="relative space-y-6 pb-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group/item hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <HardDrive className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-vazir text-muted-foreground">ترافیک ماهانه</span>
                            </div>
                            <span className="font-black font-mono text-lg">{plan.traffic} GB</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group/item hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-vazir text-muted-foreground">مدت اعتبار</span>
                            </div>
                            <span className="font-black font-mono text-lg">{plan.duration} روز</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                        <Zap className="w-3 h-3 text-yellow-500 animate-pulse" />
                        <span className="text-[10px] text-yellow-500/80 font-vazir">فعال‌سازی آنی پس از خرید</span>
                    </div>
                </CardContent>

                <CardFooter className="relative pt-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                className={`w-full h-12 font-black font-vazir text-base rounded-2xl shadow-lg transition-all duration-300 bg-gradient-to-r ${getTierColor()} hover:scale-[1.02] active:scale-[0.98] border-none text-white`}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        در حال پردازش...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        انتخاب و تمدید سرویس
                                        <Zap className="w-4 h-4" />
                                    </span>
                                )}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="font-vazir text-right rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl" dir="rtl">
                            <AlertDialogHeader>
                                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                    <AlertCircle size={32} />
                                </div>
                                <AlertDialogTitle className="text-2xl font-bold text-center">تایید نهایی خرید</AlertDialogTitle>
                                <AlertDialogDescription className="text-center text-muted-foreground pt-2">
                                    آیا از خرید اشتراک <span className="text-foreground font-bold">{plan.name}</span> به مبلغ <span className="text-primary font-bold">{plan.price} دلار</span> اطمینان دارید؟
                                    <br />
                                    مبلغ مورد نظر از کیف پول شما کسر خواهد شد.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row gap-3 pt-4">
                                <AlertDialogAction
                                    onClick={() => onPurchase(plan)}
                                    className={`flex-1 h-12 rounded-2xl font-bold text-white bg-gradient-to-r ${getTierColor()}`}
                                >
                                    بله، تایید و خرید
                                </AlertDialogAction>
                                <AlertDialogCancel className="flex-1 h-12 rounded-2xl font-bold border-white/10 bg-white/5 hover:bg-white/10 mt-0">
                                    انصراف
                                </AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

export default SubscriptionPlan;
