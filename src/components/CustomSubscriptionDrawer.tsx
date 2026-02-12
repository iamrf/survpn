import React, { useState, useMemo } from 'react';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings2, Zap, HardDrive, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { useCreateCustomSubscriptionMutation, useGetConfigsQuery } from '@/store/api';
import { useToast } from '@/components/ui/use-toast';
import { getTelegramUser } from '@/lib/telegram';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const CustomSubscriptionDrawer: React.FC = () => {
    const [traffic, setTraffic] = useState<number>(50);
    const [duration, setDuration] = useState<number>(30);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const [createCustomSubscription, { isLoading }] = useCreateCustomSubscriptionMutation();
    const { data: configsData } = useGetConfigsQuery();
    const configs = configsData?.configs || {};
    const currentUser = useAppSelector((state) => state.user.currentUser);
    const balance = currentUser?.balance || 0;

    // Get pricing from configs (default: $0.07 per GB, $0.03 per day)
    const trafficPrice = parseFloat(configs['custom_subscription_traffic_price'] || '0.07');
    const durationPrice = parseFloat(configs['custom_subscription_duration_price'] || '0.03');

    // Calculate price dynamically based on configs
    const price = useMemo(() => {
        return (traffic * trafficPrice) + (duration * durationPrice);
    }, [traffic, duration, trafficPrice, durationPrice]);

    const canAfford = balance >= price;
    const remainingBalance = balance - price;

    const handleSubmit = async () => {
        const user = getTelegramUser();
        if (!user) {
            toast({
                variant: "destructive",
                title: "خطا",
                description: "کاربر یافت نشد",
            });
            return;
        }

        if (!canAfford) {
            toast({
                variant: "destructive",
                title: "موجودی ناکافی",
                description: `موجودی شما کافی نیست. نیاز: $${price.toFixed(2)}، موجودی: $${balance.toFixed(2)}`,
            });
            return;
        }

        try {
            const result = await createCustomSubscription({
                userId: user.id,
                traffic: traffic,
                duration: duration,
            }).unwrap();
            
            if (result.success) {
                toast({
                    title: "موفقیت",
                    description: result.message || "اشتراک سفارشی با موفقیت ایجاد شد",
                });
                // User data auto-refreshes via RTK Query tag invalidation
                // createCustomSubscription invalidates 'User' tag → getCurrentUser refetches
                
                setIsOpen(false);
                // Reset values
                setTraffic(50);
                setDuration(30);
            } else {
                toast({
                    variant: "destructive",
                    title: "خطا",
                    description: result.error || "خطا در ایجاد اشتراک",
                });
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "خطا",
                description: error?.data?.error || "خطایی رخ داد",
            });
        }
    };

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Button 
                    variant="outline" 
                    className="w-full py-6 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary font-vazir"
                >
                    <Settings2 className="w-5 h-5 ml-2" />
                    ساخت اشتراک سفارشی
                </Button>
            </DrawerTrigger>
            <DrawerContent className="font-vazir" dir="rtl">
                <div className="mx-auto w-full max-w-md p-6">
                    {/* <DrawerHeader>
                        <DrawerTitle className="text-right text-xl">اشتراک سفارشی</DrawerTitle>
                        <DrawerDescription className="text-right">
                            ترافیک و مدت زمان مورد نظر خود را انتخاب کنید
                        </DrawerDescription>
                    </DrawerHeader> */}

                    <div className="space-y-6 py-6">
                        {/* Traffic Slider */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <HardDrive className="w-4 h-4 text-primary" />
                                    ترافیک ماهانه
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="1000"
                                        value={traffic}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            setTraffic(Math.max(1, Math.min(1000, val)));
                                        }}
                                        className="w-20 text-center font-mono font-bold"
                                        dir="ltr"
                                    />
                                    <span className="text-sm text-muted-foreground">گیگابایت</span>
                                </div>
                            </div>
                            <Slider
                                value={[traffic]}
                                onValueChange={(value) => setTraffic(value[0])}
                                min={1}
                                max={1000}
                                step={1}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>1000 GB</span>
                                <span>1 GB</span>
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                                هزینه: <span className="font-bold text-foreground">${(traffic * trafficPrice).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Duration Slider */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" />
                                    مدت اعتبار
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={duration}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            setDuration(Math.max(1, Math.min(365, val)));
                                        }}
                                        className="w-20 text-center font-mono font-bold"
                                        dir="ltr"
                                    />
                                    <span className="text-sm text-muted-foreground">روز</span>
                                </div>
                            </div>
                            <Slider
                                value={[duration]}
                                onValueChange={(value) => setDuration(value[0])}
                                min={1}
                                max={365}
                                step={1}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>365 روز</span>
                                <span>1 روز</span>
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                                هزینه: <span className="font-bold text-foreground">${(duration * durationPrice).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Price Summary Card */}
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">ترافیک ({traffic} GB)</span>
                                    <span className="font-mono font-bold">${(traffic * trafficPrice).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">مدت ({duration} روز)</span>
                                    <span className="font-mono font-bold">${(duration * durationPrice).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-primary/10 pt-2 mt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-base font-bold flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            مجموع هزینه
                                        </span>
                                        <span className="font-mono text-xl font-black text-primary">${price.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-2 border-t border-primary/10">
                                    <span className="text-muted-foreground">موجودی فعلی</span>
                                    <span className="font-mono font-bold">${balance.toFixed(2)}</span>
                                </div>
                                {canAfford ? (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">موجودی پس از خرید</span>
                                        <span className="font-mono font-bold text-green-500">${remainingBalance.toFixed(2)}</span>
                                    </div>
                                ) : (
                                    <Badge variant="destructive" className="w-full justify-center mt-2">
                                        موجودی ناکافی
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>

                    </div>

                    <DrawerFooter className="px-0">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="w-full h-12 font-bold"
                                    disabled={isLoading || !canAfford}
                                    variant={canAfford ? "default" : "destructive"}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            در حال پردازش...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            خرید و فعال‌سازی
                                            <Zap className="w-4 h-4" />
                                        </span>
                                    )}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="font-vazir rounded-2xl" dir="rtl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-right">تایید نهایی</AlertDialogTitle>
                                    <AlertDialogDescription className="text-right">
                                        آیا از خرید اشتراک سفارشی با مشخصات زیر اطمینان دارید؟
                                        <div className="mt-4 p-3 rounded-lg bg-muted space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>ترافیک:</span>
                                                <span className="font-bold">{traffic} GB</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>مدت:</span>
                                                <span className="font-bold">{duration} روز</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2 mt-2">
                                                <span>هزینه:</span>
                                                <span className="font-bold text-primary">${price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-row gap-2">
                                    <AlertDialogAction
                                        onClick={handleSubmit}
                                        className="flex-1"
                                    >
                                        تایید و خرید
                                    </AlertDialogAction>
                                    <AlertDialogCancel className="flex-1 mt-0">
                                        انصراف
                                    </AlertDialogCancel>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full">بستن</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default CustomSubscriptionDrawer;
