import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    RefreshCw,
    TrendingUp,
    DollarSign,
    Calendar,
    CreditCard,
    BarChart3,
    PieChart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Pie, PieChart, Cell, Legend } from "recharts";
import { useGetDepositsStatsQuery } from "@/store/api";
import BottomNav from "@/components/BottomNav";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { TelegramButton } from "@/components/TelegramButton";
import { TelegramPullToRefresh } from "@/components/TelegramPullToRefresh";
import { hapticSelection } from "@/lib/telegram";

const AdminDepositsPage = () => {
    // Telegram BackButton - show on admin sub-pages
    useTelegramBackButton();
    
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const { data, isLoading, refetch } = useGetDepositsStatsQuery();

    const stats = data?.data;
    const total = stats?.total || 0;
    const byPaymentMethod = stats?.byPaymentMethod || [];
    const byDay = stats?.byDay || [];
    const byMonth = stats?.byMonth || [];
    const byStatus = stats?.byStatus || [];
    const recent = stats?.recent || [];

    // Format payment method names
    const formatPaymentMethod = (method: string) => {
        const methods: { [key: string]: string } = {
            'plisio': 'Plisio (کریپتو)',
            'telegram_stars': 'ستاره‌های تلگرام',
            'heleket': 'Heleket',
            'unknown': 'نامشخص'
        };
        return methods[method] || method;
    };

    // Format status names
    const formatStatus = (status: string) => {
        const statuses: { [key: string]: string } = {
            'completed': 'تکمیل شده',
            'pending': 'در انتظار',
            'failed': 'ناموفق',
            'cancelled': 'لغو شده'
        };
        return statuses[status] || status;
    };

    // Chart colors
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    // Prepare chart data
    const paymentMethodChartData = byPaymentMethod.map((item: any) => ({
        name: formatPaymentMethod(item.payment_method),
        value: item.total,
        count: item.count
    }));

    const dailyChartData = byDay.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
        amount: item.total,
        count: item.count
    }));

    const monthlyChartData = byMonth.map((item: any) => ({
        month: new Date(item.month + '-01').toLocaleDateString('fa-IR', { year: 'numeric', month: 'short' }),
        amount: item.total,
        count: item.count
    }));

    const statusChartData = byStatus.map((item: any) => ({
        name: formatStatus(item.status),
        value: item.total,
        count: item.count
    }));

    const chartConfig = {
        amount: {
            label: "مبلغ (دلار)",
            color: "hsl(var(--chart-1))",
        },
        count: {
            label: "تعداد",
            color: "hsl(var(--chart-2))",
        },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50 pb-20 relative z-0">
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/admin')}
                            className="rounded-full"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold font-vazir">آمار واریزی‌ها</h1>
                            <p className="text-sm text-muted-foreground">نمای کلی از تمام واریزی‌های سیستم</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="rounded-full"
                    >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Total Deposits Card */}
                        <Card className="glass border-white/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="text-green-400" size={20} />
                                    مجموع واریزی‌ها
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold font-mono text-green-400">
                                    ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    مجموع تمام واریزی‌های تکمیل شده
                                </p>
                            </CardContent>
                        </Card>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Payment Method Pie Chart */}
                            <Card className="glass border-white/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <PieChart className="text-blue-400" size={18} />
                                        واریزی‌ها بر اساس روش پرداخت
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={paymentMethodChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {paymentMethodChartData.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                                                                                ${(data.value as number).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            تعداد: {(data.payload as any).count}
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
                                </CardContent>
                            </Card>

                            {/* Status Pie Chart */}
                            <Card className="glass border-white/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="text-yellow-400" size={18} />
                                        واریزی‌ها بر اساس وضعیت
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={statusChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {statusChartData.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                                                                                ${(data.value as number).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            تعداد: {(data.payload as any).count}
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
                                </CardContent>
                            </Card>

                            {/* Daily Deposits Bar Chart */}
                            <Card className="glass border-white/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="text-purple-400" size={18} />
                                        واریزی‌های روزانه (۳۰ روز گذشته)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={dailyChartData}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis 
                                                    dataKey="date" 
                                                    className="text-xs"
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={80}
                                                />
                                                <YAxis className="text-xs" />
                                                <ChartTooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0];
                                                            return (
                                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                                    <div className="grid gap-2">
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <span className="text-sm font-medium font-vazir">مبلغ</span>
                                                                            <span className="text-sm font-bold font-mono">
                                                                                ${(data.value as number).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            تعداد: {(data.payload as any).count}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            {/* Monthly Deposits Bar Chart */}
                            <Card className="glass border-white/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="text-green-400" size={18} />
                                        واریزی‌های ماهانه (۱۲ ماه گذشته)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={chartConfig} className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={monthlyChartData}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis 
                                                    dataKey="month" 
                                                    className="text-xs"
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={80}
                                                />
                                                <YAxis className="text-xs" />
                                                <ChartTooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0];
                                                            return (
                                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                                    <div className="grid gap-2">
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <span className="text-sm font-medium font-vazir">مبلغ</span>
                                                                            <span className="text-sm font-bold font-mono">
                                                                                ${(data.value as number).toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            تعداد: {(data.payload as any).count}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Deposits */}
                        <Card className="glass border-white/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="text-blue-400" size={18} />
                                    آخرین واریزی‌ها
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-2">
                                        {recent.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-8">هیچ واریزی‌ای یافت نشد</p>
                                        ) : (
                                            recent.map((tx: any) => (
                                                <motion.div
                                                    key={tx.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-green-500/20">
                                                            <DollarSign className="text-green-400" size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {tx.first_name || ''} {tx.last_name || ''}
                                                                {tx.username && <span className="text-muted-foreground"> (@{tx.username})</span>}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(tx.created_at).toLocaleDateString('fa-IR', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold font-mono text-green-400">
                                                            +${tx.amount.toLocaleString()}
                                                        </p>
                                                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                                            {formatStatus(tx.status)}
                                                        </Badge>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
            <BottomNav />
        </div>
    );
};

export default AdminDepositsPage;
