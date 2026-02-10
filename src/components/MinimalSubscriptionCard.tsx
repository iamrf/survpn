import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ChevronLeft, HardDrive, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MinimalSubscriptionCardProps {
    url: string;
    dataLimit: number;
    dataUsed: number;
    expire?: number;
    status?: string;
    username?: string;
    planName?: string;
    isBonus?: boolean;
    onClick: () => void;
}

const MinimalSubscriptionCard: React.FC<MinimalSubscriptionCardProps> = ({ 
    url, 
    dataLimit, 
    dataUsed, 
    expire, 
    status = 'active', 
    username,
    planName,
    isBonus = false,
    onClick 
}) => {
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className="glass rounded-2xl p-4 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="text-right flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold font-vazir truncate">
                                {isBonus ? 'اشتراک رایگان' : (planName || 'اشتراک V2Ray')}
                            </p>
                            <Badge variant="outline" className={`${statusObj.color} font-vazir border text-[10px] px-2 py-0.5 shrink-0`}>
                                {statusObj.label}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <HardDrive className="w-3 h-3" />
                                <span className="font-mono">{Math.round(usagePercent)}%</span>
                            </div>
                            {daysRemaining !== null && daysRemaining > 0 && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span className="font-vazir">{daysRemaining} روز</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 shrink-0" />
            </div>
        </motion.div>
    );
};

export default MinimalSubscriptionCard;
