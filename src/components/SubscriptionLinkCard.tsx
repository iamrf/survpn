import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, QrCode, ExternalLink, Check, Zap, HardDrive, ShieldCheck, Calendar, Activity, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface SubscriptionLinkCardProps {
    url: string;
    dataLimit: number;
    dataUsed: number;
    expire?: number;
    status?: string;
    username?: string;
}

const SubscriptionLinkCard: React.FC<SubscriptionLinkCardProps> = ({ url, dataLimit, dataUsed, expire, status = 'active', username }) => {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast({
            title: "کپی شد",
            description: "لینک اشتراک با موفقیت کپی شد",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const usagePercent = dataLimit > 0 ? Math.min((dataUsed / dataLimit) * 100, 100) : 0;
    const remainingData = Math.max(0, dataLimit - dataUsed);

    // Calculate days remaining
    const now = Math.floor(Date.now() / 1000);
    const secondsRemaining = expire ? expire - now : null;
    const daysRemaining = secondsRemaining ? Math.ceil(secondsRemaining / 86400) : null;

    const getStatusLabel = (s: string) => {
        switch (s) {
            case 'active': return { label: 'فعال', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
            case 'limited': return { label: 'محدود شده', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' };
            case 'expired': return { label: 'منقضی شده', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
            case 'disabled': return { label: 'غیرفعال', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
            default: return { label: s, color: 'bg-primary/10 text-primary border-primary/20' };
        }
    };

    const statusObj = getStatusLabel(status);

    if (!url) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
            <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary/5 to-secondary/10 backdrop-blur-xl border border-white/5 shadow-2xl rounded-[2rem]">
                {/* Decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Zap className="w-32 h-32" />
                </div>

                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-black font-vazir flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            اشتراک V2Ray
                        </CardTitle>
                        <Badge variant="outline" className={`${statusObj.color} font-vazir border`}>
                            {statusObj.label}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                <User className="w-3 h-3" />
                                <span>نام سرویس</span>
                            </div>
                            <div className="font-mono text-sm font-bold truncate dir-ltr text-right">
                                {username || '---'}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                <Calendar className="w-3 h-3" />
                                <span>زمان باقیمانده</span>
                            </div>
                            <div className="font-vazir text-sm font-bold text-foreground">
                                {expire ? (
                                    daysRemaining && daysRemaining > 0 ? `${daysRemaining} روز` : 'منقضی'
                                ) : (
                                    'نامحدود'
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Usage Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-vazir text-muted-foreground">
                            <span>{formatBytes(dataUsed)} مصرف شده</span>
                            <span>{formatBytes(dataLimit)} کل</span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${usagePercent}%` }}
                                className={`h-full rounded-full bg-gradient-to-r ${usagePercent > 80 ? 'from-red-500 to-orange-500' : 'from-primary to-primary/60'}`}
                            />
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-vazir text-primary/80">
                            <HardDrive className="w-3 h-3" />
                            <span>باقیمانده: {formatBytes(remainingData)}</span>
                        </div>
                    </div>

                    {/* URL Display */}
                    <div className="relative group">
                        <div className="p-4 rounded-2xl bg-black/20 border border-white/5 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap pr-12 text-muted-foreground group-hover:text-foreground transition-colors">
                            {url}
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleCopy}
                                className="h-8 w-8 rounded-xl hover:bg-primary/20 hover:text-primary"
                            >
                                <AnimatePresence mode="wait">
                                    {copied ? (
                                        <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                            <Check className="w-4 h-4" />
                                        </motion.div>
                                    ) : (
                                        <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                            <Copy className="w-4 h-4" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex gap-3">
                    <Button
                        className="flex-1 h-12 rounded-2xl font-vazir font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                        onClick={() => window.open(url, '_blank')}
                    >
                        <ExternalLink className="w-4 h-4" />
                        اتصال مستقیم
                    </Button>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="secondary"
                                className="h-12 w-12 rounded-2xl p-0 flex items-center justify-center bg-white/5 border border-white/5 hover:bg-white/10"
                            >
                                <QrCode className="w-5 h-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10 rounded-[2.5rem] font-vazir">
                            <DialogHeader>
                                <DialogTitle className="text-center text-xl font-black">اسکن کد QR</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col items-center justify-center space-y-6 py-4">
                                <div className="p-6 bg-white rounded-[2rem] shadow-2xl">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`}
                                        alt="Subscription QR Code"
                                        className="w-48 h-48"
                                    />
                                </div>
                                <p className="text-sm text-center text-muted-foreground px-6">
                                    این کد را در اپلیکیشن v2ray (مانند v2rayNG یا Shadowrocket) اسکن کنید تا تنظیمات به صورت خودکار اعمال شود.
                                </p>
                                <Button onClick={handleCopy} variant="outline" className="rounded-xl gap-2 font-bold">
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    کپی لینک اشتراک
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

export default SubscriptionLinkCard;

