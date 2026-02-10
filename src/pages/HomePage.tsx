import { useEffect } from "react";
import ProfileCard from "@/components/ProfileCard";
import WelcomeSection from "@/components/WelcomeSection";
import BottomNav from "@/components/BottomNav";
import SubscriptionPlan from "@/components/SubscriptionPlan";
import CustomSubscriptionDialog from "@/components/CustomSubscriptionDialog";
import MinimalSubscriptionCard from "@/components/MinimalSubscriptionCard";
import SubscriptionDrawer from "@/components/SubscriptionDrawer";
import { getTelegramUser } from "@/lib/telegram";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useGetPlansQuery, usePurchasePlanMutation, useSyncUserMutation } from "@/store/api";
import { setSubscriptionData, setPurchasingPlanId, setSubscriptionDrawerOpen } from "@/store/slices/index";
import { getPlanInfo } from "@/lib/planUtils";

const HomePage = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  // Redux state
  const subscriptionData = useAppSelector((state) => state.user.subscriptionData);
  const purchasingPlanId = useAppSelector((state) => state.ui.purchasingPlanId);
  const isSubscriptionDrawerOpen = useAppSelector((state) => state.ui.isSubscriptionDrawerOpen);
  
  // RTK Query hooks
  const { data: plansData, isLoading } = useGetPlansQuery();
  const plans = plansData?.plans || [];
  const [purchasePlan] = usePurchasePlanMutation();
  const [syncUser] = useSyncUserMutation();

  useEffect(() => {
    const user = getTelegramUser();
    if (user) {
      syncUser(user).unwrap().then(result => {
        if (result.success && result.subscriptionUrl) {
          // Get plan info after plans are loaded
          const planInfo = getPlanInfo(result.dataLimit || 0, result.expire, plans);
          dispatch(setSubscriptionData({
            url: result.subscriptionUrl,
            limit: result.dataLimit || 0,
            used: result.dataUsed || 0,
            expire: result.expire,
            status: result.status,
            username: result.username,
            planName: planInfo.planName,
            isBonus: planInfo.isBonus
          }));
        }
      }).catch((error) => {
        console.error("Error syncing user:", error);
      });
    }
  }, [dispatch, syncUser, plans]);

  const handlePurchase = async (plan: any) => {
    const user = getTelegramUser();
    if (!user) return;

    dispatch(setPurchasingPlanId(plan.id));
    try {
      const result = await purchasePlan({ userId: user.id, planId: plan.id }).unwrap();
      if (result.success) {
        toast({
          title: "خرید موفق",
          description: result.message,
        });

        // Refresh subscription data
        const syncResult = await syncUser(user).unwrap();
        if (syncResult.success && syncResult.subscriptionUrl) {
          const planInfo = getPlanInfo(syncResult.dataLimit || 0, syncResult.expire, plans);
          dispatch(setSubscriptionData({
            url: syncResult.subscriptionUrl,
            limit: syncResult.dataLimit || 0,
            used: syncResult.dataUsed || 0,
            expire: syncResult.expire,
            status: syncResult.status,
            username: syncResult.username,
            planName: planInfo.planName,
            isBonus: planInfo.isBonus
          }));
        }
      } else {
        toast({
          variant: "destructive",
          title: "خطا در خرید",
          description: result.error || "مشکلی پیش آمد",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.data?.error || "Failed to process purchase",
      });
    } finally {
      dispatch(setPurchasingPlanId(null));
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
                  onClick={() => dispatch(setSubscriptionDrawerOpen(true))}
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
          onClose={() => dispatch(setSubscriptionDrawerOpen(false))}
          subscriptionData={subscriptionData}
        />
      )}
      
      <BottomNav />
    </div>
  );
};

export default HomePage;
