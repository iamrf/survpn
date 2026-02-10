import { useState, useEffect } from "react";
import ProfileCard from "@/components/ProfileCard";
import WelcomeSection from "@/components/WelcomeSection";
import BottomNav from "@/components/BottomNav";
import SubscriptionPlan from "@/components/SubscriptionPlan";
import CustomSubscriptionDialog from "@/components/CustomSubscriptionDialog";
import { getPlans, purchasePlan } from "@/lib/api";
import { getTelegramUser } from "@/lib/telegram";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

const HomePage = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getPlans().then(result => {
      if (result.success) {
        setPlans(result.plans || []);
      }
      setIsLoading(false);
    });
  }, []);

  const handlePurchase = async (plan: any) => {
    const user = getTelegramUser();
    if (!user) return;

    setPurchasingPlanId(plan.id);
    try {
      const result = await purchasePlan(user.id, plan.id);
      if (result.success) {
        toast({
          title: "Purchase Successful",
          description: result.message,
        });
        // We might want to trigger a balance update in ProfileCard if we had a global state
        // For now, syncUser happens on mount/refresh
      } else {
        toast({
          variant: "destructive",
          title: "Purchase Failed",
          description: result.error || "Something went wrong",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process purchase",
      });
    } finally {
      setPurchasingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-gradient-to-b from-background to-secondary/20">
      <ProfileCard />
      <div className="px-4 space-y-8 mt-4">
        <WelcomeSection />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Subscription Plans</h2>
            <div className="h-px flex-1 bg-border mx-4 hidden sm:block" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
              ))
            ) : (
              plans.map((plan) => (
                <SubscriptionPlan
                  key={plan.id}
                  plan={plan}
                  onPurchase={handlePurchase}
                  isLoading={purchasingPlanId === plan.id}
                />
              ))
            )}
          </div>
        </section>

        <section className="space-y-4 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Need Something Special?</h2>
          </div>
          <CustomSubscriptionDialog />
        </section>
      </div>
      <BottomNav />
    </div>
  );
};

export default HomePage;
