import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  HardDrive, 
  Calendar, 
  Activity, 
  TrendingUp, 
  Clock, 
  ShieldCheck,
  RefreshCw,
  Copy,
  QrCode,
  Check,
  Link2
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Cell, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n';
import { useFormatDate } from '@/lib/dateUtils';

interface SubscriptionInfoCardProps {
  subscriptionData: {
    url: string;
    limit: number;
    used: number;
    expire?: number;
    status?: string;
    username?: string;
    planName?: string;
    isBonus?: boolean;
  };
  onRefresh?: () => void;
  refreshing?: boolean;
}

const SubscriptionInfoCard: React.FC<SubscriptionInfoCardProps> = ({ 
  subscriptionData, 
  onRefresh,
  refreshing = false 
}) => {
  const { toast } = useToast();
  const { t, dir, isRTL } = useI18n();
  const { formatDateOnly, formatDateTime } = useFormatDate();
  const [copiedLink, setCopiedLink] = React.useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle cases where limit might be 0 (limited subscriptions)
  const usagePercent = subscriptionData.limit > 0 
    ? Math.min((subscriptionData.used / subscriptionData.limit) * 100, 100) 
    : subscriptionData.used > 0 
      ? 100 // If used > 0 but limit is 0, show 100% usage
      : 0;
  const remainingData = Math.max(0, subscriptionData.limit - subscriptionData.used);

  // Calculate days remaining (can be negative if expired)
  const now = Math.floor(Date.now() / 1000);
  const secondsRemaining = subscriptionData.expire ? subscriptionData.expire - now : null;
  const daysRemaining = secondsRemaining !== null ? Math.ceil(secondsRemaining / 86400) : null;
  const hoursRemaining = secondsRemaining !== null ? Math.ceil((secondsRemaining % 86400) / 3600) : null;
  const isExpired = secondsRemaining !== null && secondsRemaining < 0;

  // Calculate time-based data for first chart
  // Total subscription duration (estimate: if expired, use daysRemaining; otherwise estimate from expire)
  // Since we don't have start date, we'll estimate total duration from expire timestamp
  // For active subscriptions, estimate total duration as remaining + some buffer, or use a default
  const totalDaysEstimate = daysRemaining !== null && daysRemaining > 0 
    ? Math.max(daysRemaining, 30) // At least 30 days or remaining days, whichever is larger
    : 30; // Default 30 days if expired or unknown
  const timeRemainingPercent = daysRemaining !== null && daysRemaining > 0
    ? Math.min((daysRemaining / totalDaysEstimate) * 100, 100)
    : 0;
  const timeRemainingDays = daysRemaining !== null && daysRemaining > 0 ? daysRemaining : 0;
  const timeUsedDays = totalDaysEstimate - timeRemainingDays;

  // Get status badge (check expiration time if status is active)
  const getStatusBadge = (status: string) => {
    // If expired by time, override status
    if (isExpired) {
      return { label: t.subscription.expired, color: 'bg-red-500/10 text-red-500 border-red-500/20' };
    }
    
    switch (status) {
      case 'active': return { label: t.subscription.active, color: 'bg-green-500/10 text-green-500 border-green-500/20' };
      case 'limited': return { label: t.subscription.limited, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' };
      case 'expired': return { label: t.subscription.expired, color: 'bg-red-500/10 text-red-500 border-red-500/20' };
      case 'disabled': return { label: t.subscription.disabled, color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
      default: return { label: status || t.subscription.inactive, color: 'bg-primary/10 text-primary border-primary/20' };
    }
  };

  const statusBadge = getStatusBadge(subscriptionData.status || 'active');

  // Get usage bar color
  const getUsageBarColor = (percent: number) => {
    if (percent >= 90) return '#ef4444'; // red
    if (percent >= 80) return '#f97316'; // orange
    if (percent >= 50) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  // Chart data for usage (handle limited subscriptions where limit might be 0)
  const usageChartData = subscriptionData.limit > 0 || subscriptionData.used > 0
    ? [
        { name: t.subscription.used, value: subscriptionData.used, fill: getUsageBarColor(usagePercent) },
        { name: t.subscription.remaining || 'Remaining', value: remainingData, fill: '#1f2937' }
      ]
    : [
        { name: t.subscription.used, value: 0, fill: '#1f2937' },
        { name: t.subscription.remaining || 'Remaining', value: 1, fill: '#1f2937' } // Show empty chart
      ];

  // Chart data for time-based radial progress (first chart)
  const timeChartData = [
    {
      name: t.subscription.remainingTimeLabel || t.subscription.remainingTime,
      value: timeRemainingPercent,
      fill: isExpired ? '#ef4444' : getUsageBarColor(timeRemainingPercent)
    }
  ];

  // Chart data for usage radial progress (legacy - can be removed if not needed)
  const radialData = [
    {
      name: 'Usage',
      value: usagePercent,
      fill: getUsageBarColor(usagePercent)
    }
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(subscriptionData.url);
      setCopiedLink(true);
      toast({
        title: t.common.copied,
        description: t.settings.subscriptionLinkCopied,
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast({
        title: t.common.error,
        description: t.common.error,
        variant: "destructive",
      });
    }
  };

  const getTitle = () => {
    if (subscriptionData.isBonus) {
      return t.subscription.freeSubscription || 'Free Subscription';
    }
    return subscriptionData.planName || t.subscription.professionalSubscription || 'Professional Subscription';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`border-none bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10 backdrop-blur-xl shadow-2xl overflow-hidden ${isExpired ? 'opacity-90' : ''}`}>
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${isExpired ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black font-vazir">{getTitle()}</CardTitle>
                <p className="text-xs text-muted-foreground font-vazir mt-1">
                  {subscriptionData.username || t.subscription.username}
                  {isExpired && (
                    <span className="text-red-500 mr-2">({t.subscription.expired})</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${statusBadge.color} font-vazir border`}>
                {statusBadge.label}
              </Badge>
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Usage Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Time-based Progress Chart (Total Time vs Remaining Time) */}
            <div className="space-y-3">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="w-4 h-4 text-primary" />
                  <span className={`text-sm font-bold font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.subscription.remainingTimeLabel || t.subscription.remainingTime}</span>
                </div>
                <span className="text-2xl font-black font-mono" style={{ color: isExpired ? '#ef4444' : getUsageBarColor(timeRemainingPercent) }}>
                  {Math.round(timeRemainingPercent)}%
                </span>
              </div>
              <div className="h-48 flex items-center justify-center">
                <ChartContainer
                  config={{
                    timeRemaining: {
                      label: t.subscription.remainingTimeLabel || t.subscription.remainingTime,
                      color: isExpired ? '#ef4444' : getUsageBarColor(timeRemainingPercent),
                    },
                  }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="60%"
                      outerRadius="90%"
                      data={timeChartData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        fill="var(--color-timeRemaining)"
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-2">
                                  <div className={`flex items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <span className={`text-sm font-medium font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.subscription.remainingTimeLabel || t.subscription.remainingTime}</span>
                                    <span className="text-sm font-bold font-mono">
                                      {payload[0].value?.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className={`space-y-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.subscription.totalTime}</p>
                <p className="text-lg font-bold font-vazir" dir={dir}>
                  {timeRemainingDays > 0 
                    ? `${timeRemainingDays} ${t.subscription.days} ${t.subscription.remainingTimeLabel || t.subscription.remainingTime}`
                    : isExpired 
                      ? t.subscription.expired
                      : t.subscription.unknown
                  }
                </p>
              </div>
            </div>

            {/* Pie Chart for Data Distribution */}
            <div className="space-y-3">
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <HardDrive className="w-4 h-4 text-primary" />
                <span className={`text-sm font-bold font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.subscription.trafficDistribution}</span>
              </div>
              <div className="h-48 flex items-center justify-center">
                <ChartContainer
                  config={{
                    used: {
                      label: t.subscription.used,
                      color: getUsageBarColor(usagePercent),
                    },
                    remaining: {
                      label: t.subscription.remaining,
                      color: "#1f2937",
                    },
                  }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usageChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {usageChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-2">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-medium font-vazir">{data.name}</span>
                                    <span className="text-sm font-bold font-mono">
                                      {formatBytes(data.value as number)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className={`flex items-center justify-center gap-4 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getUsageBarColor(usagePercent) }}></div>
                  <span className={`font-vazir text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{t.subscription.used}</span>
                </div>
                <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                  <span className={`font-vazir text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{t.subscription.remaining}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <HardDrive className="w-4 h-4 text-primary" />
                <span className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.subscription.remainingVolume || t.subscription.remainingData}</span>
              </div>
              <p className="text-lg font-black font-mono" dir="ltr">
                {formatBytes(remainingData)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.subscription.totalVolume || t.subscription.totalData}</span>
              </div>
              <p className="text-lg font-black font-mono" dir="ltr">
                {formatBytes(subscriptionData.limit)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className="w-4 h-4 text-primary" />
                <span className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>
                  {isExpired ? t.subscription.expiredTime : t.subscription.remainingTime}
                </span>
              </div>
              <p className={`text-lg font-black font-vazir ${isExpired ? 'text-red-500' : ''}`}>
                {daysRemaining !== null && daysRemaining > 0 
                  ? `${daysRemaining} ${t.subscription.days}${hoursRemaining && hoursRemaining > 0 ? ` ${hoursRemaining} ${t.subscription.hours}` : ''}`
                  : daysRemaining === 0 
                    ? t.subscription.expiresToday
                    : isExpired && daysRemaining !== null
                      ? `${Math.abs(daysRemaining)} ${t.subscription.days} ${t.subscription.expiredDaysAgo.replace('{days}', '')}`
                      : t.subscription.unknown
                }
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Clock className="w-4 h-4 text-primary" />
                <span className={`text-xs text-muted-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.subscription.status}</span>
              </div>
              <Badge variant="outline" className={`${statusBadge.color} font-vazir border text-xs`}>
                {statusBadge.label}
              </Badge>
            </div>
          </div>

          {/* Usage Progress Bar */}
          <div className="space-y-2">
            <div className={`flex items-center justify-between text-xs font-vazir ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className={`text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{t.subscription.usageChart}</span>
              <span className="font-bold" style={{ color: getUsageBarColor(usagePercent) }}>
                {Math.round(usagePercent)}% {t.subscription.used}
              </span>
            </div>
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usagePercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: getUsageBarColor(usagePercent) }}
              />
            </div>
            <div className={`flex items-center justify-between text-xs font-vazir text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span dir="ltr" className={isRTL ? 'text-right' : 'text-left'}>{formatBytes(subscriptionData.used)} {t.subscription.used}</span>
              <span dir="ltr" className={isRTL ? 'text-right' : 'text-left'}>{formatBytes(remainingData)} {t.subscription.remaining}</span>
            </div>
          </div>

          {/* Expired Notice */}
          {isExpired && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className={`text-sm text-red-500 font-vazir text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                ⚠️ {t.subscription.expiredNotice}
              </p>
            </div>
          )}

          {/* Subscription Link Section */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Link2 className="w-4 h-4 text-primary" />
              <span className={`text-sm font-bold text-foreground font-vazir ${isRTL ? 'text-right' : 'text-left'}`}>{t.subscription.subscriptionLink}</span>
              {isExpired && (
                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/20">
                  {t.subscription.disabled}
                </Badge>
              )}
            </div>
            <div className="relative group">
              <div 
                dir="ltr" 
                className="p-3 pl-20 rounded-xl bg-black/20 border border-white/5 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground group-hover:text-foreground transition-colors text-left cursor-pointer"
                onClick={handleCopyLink}
              >
                {subscriptionData.url}
              </div>
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyLink();
                  }}
                  className="h-8 w-8 rounded-lg hover:bg-primary/20 hover:text-primary"
                >
                  <AnimatePresence mode="wait">
                    {copiedLink ? (
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 w-8 rounded-lg hover:bg-primary/20 hover:text-primary"
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10 rounded-[2.5rem] font-vazir ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
                    <DialogHeader>
                      <DialogTitle className={`text-center text-xl font-black ${isRTL ? 'text-right' : 'text-left'}`}>{t.subscription.scanQRCode}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center space-y-6 py-4">
                      <div className="p-6 bg-white rounded-[2rem] shadow-2xl">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(subscriptionData.url)}`}
                          alt="Subscription QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <p className={`text-sm text-center text-muted-foreground px-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.subscription.qrCodeDescription}
                      </p>
                      <Button onClick={handleCopyLink} variant="outline" className={`rounded-xl gap-2 font-bold ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {t.subscription.copySubscriptionLink}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SubscriptionInfoCard;
