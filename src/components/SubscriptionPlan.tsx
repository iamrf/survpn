import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Zap, Clock, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';

interface Plan {
    id: string;
    name: string;
    traffic: number;
    duration: number;
    price: number;
}

interface SubscriptionPlanProps {
    plan: Plan;
    onPurchase: (plan: Plan) => void;
    isLoading?: boolean;
}

const SubscriptionPlan: React.FC<SubscriptionPlanProps> = ({ plan, onPurchase, isLoading }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
            <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            {plan.name}
                        </CardTitle>
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                            ${plan.price}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pb-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="p-2 rounded-full bg-secondary/50">
                            <HardDrive className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{plan.traffic} GB</span>
                        <span>Traffic Limit</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="p-2 rounded-full bg-secondary/50">
                            <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{plan.duration} Days</span>
                        <span>Validity</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        onClick={() => onPurchase(plan)}
                        className="w-full font-bold group"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Zap className="w-4 h-4 animate-pulse" />
                                Processing...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Purchase Plan
                                <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
                            </span>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

export default SubscriptionPlan;
