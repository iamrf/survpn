import React from 'react';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import SubscriptionLinkCard from '@/components/SubscriptionLinkCard';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
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
}

const SubscriptionDrawer: React.FC<SubscriptionDrawerProps> = ({ isOpen, onClose, subscriptionData }) => {
    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="max-h-[90vh] bg-card/95 backdrop-blur-xl border-white/10" dir="rtl">
                <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-white/10" />
                <DrawerHeader className="text-right px-6 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <DrawerTitle className="text-2xl font-black font-vazir">جزئیات اشتراک</DrawerTitle>
                            {/* <DrawerDescription className="font-vazir text-muted-foreground mt-2">
                                مشاهده و مدیریت اشتراک
                            </DrawerDescription> */}
                        </div>
                        <DrawerClose asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl">
                                <X size={20} />
                            </Button>
                        </DrawerClose>
                    </div>
                </DrawerHeader>
                <ScrollArea className="px-6 pb-6">
                    <div className="w-full pb-4">
                        <SubscriptionLinkCard
                            url={subscriptionData.url}
                            dataLimit={subscriptionData.limit}
                            dataUsed={subscriptionData.used}
                            expire={subscriptionData.expire}
                            status={subscriptionData.status}
                            username={subscriptionData.username}
                            planName={subscriptionData.planName}
                            isBonus={subscriptionData.isBonus}
                        />
                    </div>
                </ScrollArea>
            </DrawerContent>
        </Drawer>
    );
};

export default SubscriptionDrawer;
