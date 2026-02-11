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
  const [copiedLink, setCopiedLink] = React.useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercent = subscriptionData.limit > 0 
    ? Math.min((subscriptionData.used / subscriptionData.limit) * 100, 100) 
    : 0;
  const remainingData = Math.max(0, subscriptionData.limit - subscriptionData.used);

  // Calculate days remaining
  const now = Math.floor(Date.now() / 1000);
  const secondsRemaining = subscriptionData.expire ? subscriptionData.expire - now : null;
  const daysRemaining = secondsRemaining ? Math.ceil(secondsRemaining / 86400) : null;
  const hoursRemaining = secondsRemaining ? Math.ceil((secondsRemaining % 86400) / 3600) : null;

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { label: 'فعال', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
      case 'limited': return { label: 'محدود شده', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' };
      case 'expired': return { label: 'منقضی شده', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
      case 'disabled': return { label: 'غیرفعال', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
      default: return { label: status || 'نامشخص', color: 'bg-primary/10 text-primary border-primary/20' };
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

  // Chart data for usage
  const usageChartData = [
    { name: 'استفاده شده', value: subscriptionData.used, fill: getUsageBarColor(usagePercent) },
    { name: 'باقیمانده', value: remainingData, fill: '#1f2937' }
  ];

  // Chart data for radial progress
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
        title: "کپی شد",
        description: "لینک اشتراک با موفقیت کپی شد",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast({
        title: "خطا",
        description: "کپی انجام نشد",
        variant: "destructive",
      });
    }
  };

  const getTitle = () => {
    if (subscriptionData.isBonus) {
      return 'اشتراک رایگان';
    }
    return subscriptionData.planName || 'اشتراک حرفه‌ای';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-none bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black font-vazir">{getTitle()}</CardTitle>
                <p className="text-xs text-muted-foreground font-vazir mt-1">
                  {subscriptionData.username || 'نام کاربری'}
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
            {/* Circular Progress Chart */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold font-vazir">میزان استفاده</span>
                </div>
                <span className="text-2xl font-black font-mono" style={{ color: getUsageBarColor(usagePercent) }}>
                  {Math.round(usagePercent)}%
                </span>
              </div>
              <div className="h-48 flex items-center justify-center">
                <ChartContainer
                  config={{
                    usage: {
                      label: "Usage",
                      color: getUsageBarColor(usagePercent),
                    },
                  }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="60%"
                      outerRadius="90%"
                      data={radialData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        fill="var(--color-usage)"
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-2">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-medium font-vazir">استفاده شده</span>
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
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground font-vazir">از کل حجم</p>
                <p className="text-lg font-bold font-mono" dir="ltr">
                  {formatBytes(subscriptionData.used)} / {formatBytes(subscriptionData.limit)}
                </p>
              </div>
            </div>

            {/* Pie Chart for Data Distribution */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold font-vazir">توزیع ترافیک</span>
              </div>
              <div className="h-48 flex items-center justify-center">
                <ChartContainer
                  config={{
                    used: {
                      label: "استفاده شده",
                      color: getUsageBarColor(usagePercent),
                    },
                    remaining: {
                      label: "باقیمانده",
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
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getUsageBarColor(usagePercent) }}></div>
                  <span className="font-vazir text-muted-foreground">استفاده شده</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                  <span className="font-vazir text-muted-foreground">باقیمانده</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground font-vazir">حجم باقیمانده</span>
              </div>
              <p className="text-lg font-black font-mono" dir="ltr">
                {formatBytes(remainingData)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground font-vazir">حجم کل</span>
              </div>
              <p className="text-lg font-black font-mono" dir="ltr">
                {formatBytes(subscriptionData.limit)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground font-vazir">زمان باقیمانده</span>
              </div>
              <p className="text-lg font-black font-vazir">
                {daysRemaining !== null && daysRemaining > 0 
                  ? `${daysRemaining} روز ${hoursRemaining && hoursRemaining > 0 ? `و ${hoursRemaining} ساعت` : ''}`
                  : daysRemaining === 0 
                    ? 'امروز منقضی می‌شود'
                    : 'منقضی شده'
                }
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground font-vazir">وضعیت</span>
              </div>
              <Badge variant="outline" className={`${statusBadge.color} font-vazir border text-xs`}>
                {statusBadge.label}
              </Badge>
            </div>
          </div>

          {/* Usage Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-vazir">
              <span className="text-muted-foreground">نمودار استفاده</span>
              <span className="font-bold" style={{ color: getUsageBarColor(usagePercent) }}>
                {Math.round(usagePercent)}% استفاده شده
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
            <div className="flex items-center justify-between text-xs font-vazir text-muted-foreground">
              <span dir="ltr" className="text-left">{formatBytes(subscriptionData.used)} استفاده شده</span>
              <span dir="ltr" className="text-left">{formatBytes(remainingData)} باقیمانده</span>
            </div>
          </div>

          {/* Subscription Link Section */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground font-vazir">لینک اشتراک</span>
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
                  <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10 rounded-[2.5rem] font-vazir">
                    <DialogHeader>
                      <DialogTitle className="text-center text-xl font-black">اسکن کد QR</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center space-y-6 py-4">
                      <div className="p-6 bg-white rounded-[2rem] shadow-2xl">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(subscriptionData.url)}`}
                          alt="Subscription QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <p className="text-sm text-center text-muted-foreground px-6">
                        این کد را در اپلیکیشن v2ray (مانند v2rayNG یا Shadowrocket) اسکن کنید تا تنظیمات به صورت خودکار اعمال شود.
                      </p>
                      <Button onClick={handleCopyLink} variant="outline" className="rounded-xl gap-2 font-bold">
                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        کپی لینک اشتراک
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
