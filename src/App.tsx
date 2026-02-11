import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Suspense, lazy } from "react";
import { LoadingFallback } from "./components/LoadingFallback";

// Lazy load pages
const HomePage = lazy(() => import("./pages/HomePage"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const ConfigsPage = lazy(() => import("./pages/ConfigsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminUserDetailPage = lazy(() => import("./pages/AdminUserDetailPage"));
const AdminPendingWithdrawalsPage = lazy(() => import("./pages/AdminPendingWithdrawalsPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { useEffect } from "react";
import { getTelegramUser } from "./lib/telegram";
import { AdminProvider, useAdmin } from "./components/AdminProvider";
import { store } from "./store";
import { useSyncUserMutation } from "./store/api";
import { setCurrentUser } from "./store/slices/userSlice";
import { useAppDispatch } from "./store/hooks";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAdmin, setIsAdmin } = useAdmin();
  const dispatch = useAppDispatch();
  const [syncUser] = useSyncUserMutation();

  useEffect(() => {
    const syncUserData = async () => {
      const user = getTelegramUser();
      if (user) {
        console.log("Syncing user data with backend...", user);
        
        // Check for referral code from Telegram start parameter (deep link)
        // Format: https://t.me/botname?start=referral_code
        const { getReferralCodeFromStartParam } = await import('@/lib/telegram');
        const referralCode = getReferralCodeFromStartParam();
        
        // Prepare user data with referral code if present
        const userData = {
          ...user,
          ...(referralCode && { referral_code: referralCode })
        };
      
      syncUser(userData).unwrap().then((result) => {
        if (result.success) {
          console.log("User synced successfully", result.isAdmin ? "(Admin)" : "");
          dispatch(setCurrentUser({
            id: user.id,
            isAdmin: result.isAdmin,
            balance: result.balance,
            referralCode: result.referralCode,
            phoneNumber: result.phoneNumber,
            createdAt: result.createdAt,
            lastSeen: result.lastSeen,
            languageCode: result.languageCode,
            walletAddress: result.walletAddress,
            hasPasskey: result.hasPasskey,
            subscriptionUrl: result.subscriptionUrl,
            dataLimit: result.dataLimit,
            dataUsed: result.dataUsed,
            expire: result.expire,
            status: result.status,
            username: result.username,
          }));
          if (result.isAdmin !== undefined) {
            setIsAdmin(result.isAdmin);
          }
        } else {
          console.error("Failed to sync user");
        }
        }).catch((error) => {
          console.error("Error syncing user:", error);
        });
      }
    };
    syncUserData();
  }, [setIsAdmin, dispatch, syncUser]);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/wallet" element={<WalletPage />} />
              <Route path="/missions" element={<ConfigsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {isAdmin &&
              <>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/user/:id" element={<AdminUserDetailPage />} />
                <Route path="/admin/withdrawals/pending" element={<AdminPendingWithdrawalsPage />} />
              </>
            }
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AnimatePresence>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <AppContent />
      </AdminProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
