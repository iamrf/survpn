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
const AdminTransactionsPage = lazy(() => import("./pages/AdminTransactionsPage"));
const AdminDepositsPage = lazy(() => import("./pages/AdminDepositsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { useEffect, useRef } from "react";
import { getTelegramUser } from "./lib/telegram";
import { AdminProvider, useAdmin } from "./components/AdminProvider";
import { TelegramAccessGuard } from "./components/TelegramAccessGuard";
import { store } from "./store";
import { useGetCurrentUserQuery, useSyncUserMutation } from "./store/api";
import { useAppSelector } from "./store/hooks";
import { useTelegramTheme } from "./hooks/useTelegramTheme";
import { useTelegramApp } from "./hooks/useTelegramApp";
import { useTelegramViewport } from "./hooks/useTelegramViewport";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAdmin, setIsAdmin } = useAdmin();
  const tgUser = getTelegramUser();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const initialSyncDone = useRef(false);

  // Initialize Telegram WebApp and viewport
  useTelegramApp();
  useTelegramViewport();
  
  // Apply Telegram theme colors
  useTelegramTheme();

  // Use getCurrentUser query - this provides the 'User' tag
  // When 'User' tag is invalidated (by payment verification, plan purchase, etc.),
  // this query automatically refetches and updates Redux via extraReducers
  const { data: userData } = useGetCurrentUserQuery(tgUser, {
    skip: !tgUser,
    // Refetch when window regains focus (user comes back to app)
    refetchOnFocus: true,
  });

  // Initial sync with referral code handling (only once)
  const [syncUser] = useSyncUserMutation();

  useEffect(() => {
    const doInitialSync = async () => {
      if (initialSyncDone.current || !tgUser) return;
      initialSyncDone.current = true;

      try {
        // Check for referral code from Telegram start parameter (deep link)
        const { getReferralCodeFromStartParam } = await import('@/lib/telegram');
        const referralCode = getReferralCodeFromStartParam();

        if (referralCode) {
          // If there's a referral code, use mutation to pass it along
          console.log('[REFERRAL] Referral code from start param:', referralCode);
          await syncUser({
            ...tgUser,
            referral_code: referralCode,
          }).unwrap();
        }
      } catch (error) {
        console.error("Error in initial sync:", error);
      }
    };
    doInitialSync();
  }, [tgUser, syncUser]);

  // Update admin status when user data changes
  useEffect(() => {
    if (currentUser?.isAdmin !== undefined) {
      setIsAdmin(currentUser.isAdmin);
    }
  }, [currentUser?.isAdmin, setIsAdmin]);

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
                <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
                <Route path="/admin/deposits" element={<AdminDepositsPage />} />
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
        <TelegramAccessGuard>
          <AppContent />
        </TelegramAccessGuard>
      </AdminProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
