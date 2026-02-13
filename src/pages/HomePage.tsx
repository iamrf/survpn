import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileCard from "@/components/ProfileCard";
import WelcomeSection from "@/components/WelcomeSection";
import BottomNav from "@/components/BottomNav";
import SubscriptionPlan from "@/components/SubscriptionPlan";
import CustomSubscriptionDrawer from "@/components/CustomSubscriptionDrawer";
import MinimalSubscriptionCard from "@/components/MinimalSubscriptionCard";
import { SubscriptionPlanSkeleton, SubscriptionCardSkeleton } from "@/components/skeletons";
import { getTelegramUser } from "@/lib/telegram";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { Star, Zap } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useGetPlansQuery, usePurchasePlanMutation, useGetCurrentUserQuery } from "@/store/api";
import { setSubscriptionData, setPurchasingPlanId } from "@/store/slices/index";
import { getPlanInfo } from "@/lib/planUtils";
import { useI18n } from "@/lib/i18n";

const HomePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  
  // Redux state
  const subscriptionData = useAppSelector((state) => state.user.subscriptionData);
  const purchasingPlanId = useAppSelector((state) => state.ui.purchasingPlanId);
  
  // RTK Query hooks
  const { data: plansData, isLoading } = useGetPlansQuery();
  const plans = plansData?.plans || [];
  const [purchasePlan] = usePurchasePlanMutation();

  // Subscribe to user data for automatic refresh via tag invalidation
  const tgUser = getTelegramUser();
  useGetCurrentUserQuery(tgUser, { skip: !tgUser });

  // Get current user from Redux
  const currentUser = useAppSelector((state) => state.user.currentUser);

  // Update subscription data when plans are loaded and user has subscription
  useEffect(() => {
    if (currentUser?.subscriptionUrl && plans.length > 0) {
      const planInfo = getPlanInfo(currentUser.dataLimit || 0, currentUser.expire, plans);
      dispatch(setSubscriptionData({
        url: currentUser.subscriptionUrl,
        limit: currentUser.dataLimit || 0,
        used: currentUser.dataUsed || 0,
        expire: currentUser.expire,
        status: currentUser.status,
        username: currentUser.username,
        planName: planInfo.planName,
        isBonus: planInfo.isBonus
      }));
    }
  }, [dispatch, currentUser?.subscriptionUrl, currentUser?.dataLimit, currentUser?.expire, plans.length]);

  const handlePurchase = async (plan: any) => {
    if (!tgUser) return;

    dispatch(setPurchasingPlanId(plan.id));
    try {
      const result = await purchasePlan({ userId: tgUser.id, planId: plan.id }).unwrap();
      if (result.success) {
        toast({
          title: t.home.purchaseSuccess,
          description: result.message,
        });
        // User data is auto-refreshed via RTK Query tag invalidation
        // purchasePlan invalidates 'User' tag → getCurrentUser refetches
      } else {
        toast({
          variant: "destructive",
          title: t.home.purchaseError,
          description: result.error || t.home.somethingWentWrong,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.common.error,
        description: error?.data?.error || t.home.failedToProcessPurchase,
      });
    } finally {
      dispatch(setPurchasingPlanId(null));
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-background selection:bg-primary/30">
      <ProfileCard />

      <div className="px-5 space-y-12 my-6">

        <section className="relative space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -z-10" />

            <div className="py-16 flex flex-col items-center text-center space-y-4">
              <h2 className="text-3xl font-black tracking-tight font-vazir bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
                {t.home.madeForFreedom}
              </h2>
              <p className="text-muted-foreground text-sm font-vazir">
              {t.home.alwaysWithYou}
              </p>
            </div>
          </motion.div>


          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <SubscriptionPlanSkeleton key={i} />
              ))
            ) : (
              plans.map((plan) => (
                <SubscriptionPlan
                  key={plan.id}
                  plan={plan}
                  onPurchase={handlePurchase}
                  isLoading={purchasingPlanId === plan.id}
                  currentUserDataLimit={currentUser?.dataLimit}
                />
              ))
            )}
          </div>
        </section>

        <section className="relative flex justify-center items-center overflow-hidden p-8 rounded-[2.5rem] text-center bg-gradient-to-br from-primary/10 to-transparent border border-white/5">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Star className="w-24 h-24 text-primary" />
          </div>
          <div className="relative space-y-4 max-w-sm">
            <h2 className="text-2xl font-black tracking-tight font-vazir">{t.home.wantCustomService}</h2>
            <p className="text-sm text-muted-foreground font-vazir leading-relaxed">
              {t.home.customServiceDescription}
            </p>
            {/* Quick Info */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-yellow-600 dark:text-yellow-500">
                    {t.home.subscriptionActivatedImmediately}
                </span>
            </div>
            <div className="pt-2">
              <CustomSubscriptionDrawer />
            </div>
          </div>
        </section>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default HomePage;
