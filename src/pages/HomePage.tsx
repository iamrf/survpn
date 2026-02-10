import { useState, useEffect } from "react";
import ProfileCard from "@/components/ProfileCard";
import WelcomeSection from "@/components/WelcomeSection";
import BottomNav from "@/components/BottomNav";
import SubscriptionPlan from "@/components/SubscriptionPlan";
import CustomSubscriptionDialog from "@/components/CustomSubscriptionDialog";
import MinimalSubscriptionCard from "@/components/MinimalSubscriptionCard";
import SubscriptionDrawer from "@/components/SubscriptionDrawer";
import { getPlans, purchasePlan, syncUser } from "@/lib/api";
import { getTelegramUser } from "@/lib/telegram";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const HomePage = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [isSubscriptionDrawerOpen, setIsSubscriptionDrawerOpen] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<{
    url: string;
    limit: number;
    used: number;
    expire?: number;
    status?: string;
    username?: string;
    planName?: string;
    isBonus?: boolean;
  } | null>(null);
  const { toast } = useToast();
  
  // Helper function to determine plan name and if it's bonus
  const getPlanInfo = (dataLimit: number, expire?: number, availablePlans: any[] = []) => {
    // Convert bytes to GB
    const limitGB = dataLimit / (1024 * 1024 * 1024);
    
    // Check if it matches any plan
    const matchingPlan = availablePlans.find(plan => {
      const planLimitGB = plan.traffic;
      // Allow some tolerance (within 1GB)
      return Math.abs(planLimitGB - limitGB) < 1;
    });
    
    if (matchingPlan) {
      return { planName: matchingPlan.name, isBonus: false };
    }
    
    // Check if it's likely a welcome bonus (typically 5GB or less, short duration)
    // Welcome bonus is usually 5GB for 7 days
    if (limitGB <= 5 && expire) {
      const now = Math.floor(Date.now() / 1000);
      const daysRemaining = expire ? Math.ceil((expire - now) / 86400) : null;
      if (daysRemaining && daysRemaining <= 30) {
        return { planName: undefined, isBonus: true };
      }
    }
    
    return { planName: undefined, isBonus: false };
  };

  useEffect(() => {
    getPlans().then(result => {
      if (result.success) {
        setPlans(result.plans || []);
      }
      setIsLoading(false);
    });

    const user = getTelegramUser();
    if (user) {
      syncUser(user).then(result => {
        if (result.success && result.subscriptionUrl) {
          // Get plan info after plans are loaded
          getPlans().then(plansResult => {
            if (plansResult.success) {
              const planInfo = getPlanInfo(result.dataLimit || 0, result.expire, plansResult.plans || []);
              setSubscriptionData({
                url: result.subscriptionUrl,
                limit: result.dataLimit || 0,
                used: result.dataUsed || 0,
                expire: result.expire,
                status: result.status,
                username: result.username,
                planName: planInfo.planName,
                isBonus: planInfo.isBonus
              });
            } else {
              // Fallback if plans not loaded
              const planInfo = getPlanInfo(result.dataLimit || 0, result.expire, []);
              setSubscriptionData({
                url: result.subscriptionUrl,
                limit: result.dataLimit || 0,
                used: result.dataUsed || 0,
                expire: result.expire,
                status: result.status,
                username: result.username,
                planName: planInfo.planName,
                isBonus: planInfo.isBonus
              });
            }
          });
        }
      });
    }
  }, []);

  const handlePurchase = async (plan: any) => {
    const user = getTelegramUser();
    if (!user) return;

    setPurchasingPlanId(plan.id);
    try {
      const result = await purchasePlan(user.id, plan.id);
      if (result.success) {
        toast({
          title: "خرید موفق",
          description: result.message,
        });

        // Refresh subscription data
        const syncResult = await syncUser(user);
        if (syncResult.success && syncResult.subscriptionUrl) {
          const planInfo = getPlanInfo(syncResult.dataLimit || 0, syncResult.expire, plans);
          setSubscriptionData({
            url: syncResult.subscriptionUrl,
            limit: syncResult.dataLimit || 0,
            used: syncResult.dataUsed || 0,
            expire: syncResult.expire,
            status: syncResult.status,
            username: syncResult.username,
            planName: planInfo.planName,
            isBonus: planInfo.isBonus
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "خطا در خرید",
          description: result.error || "مشکلی پیش آمد",
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
    <div className="min-h-screen flex flex-col pb-24 bg-background selection:bg-primary/30">
      <ProfileCard />

      <div className="px-5 space-y-12 mt-6">

        <section className="relative space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -z-10" />

            {subscriptionData && (
              <div className="mb-6">
                <MinimalSubscriptionCard
                  url={subscriptionData.url}
                  dataLimit={subscriptionData.limit}
                  dataUsed={subscriptionData.used}
                  expire={subscriptionData.expire}
                  status={subscriptionData.status}
                  username={subscriptionData.username}
                  planName={subscriptionData.planName}
                  isBonus={subscriptionData.isBonus}
                  onClick={() => setIsSubscriptionDrawerOpen(true)}
                />
              </div>
            )}

            <div className="flex flex-col items-center text-center space-y-2">
              <h2 className="text-3xl font-black tracking-tight font-vazir bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
                انتخاب سرویس هوشمند
              </h2>
              <p className="text-muted-foreground text-sm font-vazir">
                بهترین پلن را متناسب با نیاز خود انتخاب کنید
              </p>
            </div>
          </motion.div>


          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-80 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
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

        <section className="relative overflow-hidden p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-white/5">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Star className="w-24 h-24 text-primary" />
          </div>
          <div className="relative space-y-4 max-w-sm">
            <h2 className="text-2xl font-black tracking-tight font-vazir">سرویس اختصاصی می‌خواهید؟</h2>
            <p className="text-sm text-muted-foreground font-vazir leading-relaxed">
              اگر نیاز به حجم یا زمان متفاوتی دارید، پلن سفارشی خود را بسازید. کارشناسان ما در سریع‌ترین زمان با شما ارتباط می‌گیرند.
            </p>
            <div className="pt-2">
              <CustomSubscriptionDialog />
            </div>
          </div>
        </section>
      </div>
      
      {subscriptionData && (
        <SubscriptionDrawer
          isOpen={isSubscriptionDrawerOpen}
          onClose={() => setIsSubscriptionDrawerOpen(false)}
          subscriptionData={subscriptionData}
        />
      )}
      
      <BottomNav />
    </div>
  );
};

export default HomePage;
