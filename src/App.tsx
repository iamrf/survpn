import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
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
import { getTelegramUser, initTelegramWebApp } from "./lib/telegram";
import { AdminProvider, useAdmin } from "./components/AdminProvider";
import { TelegramAccessGuard } from "./components/TelegramAccessGuard";
import { store } from "./store";
import { useGetCurrentUserQuery, useSyncUserMutation } from "./store/api";
import { useAppSelector } from "./store/hooks";
import { useTelegramTheme } from "./hooks/useTelegramTheme";
import { I18nProvider } from "./lib/i18n";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAdmin, setIsAdmin } = useAdmin();
  const tgUser = getTelegramUser();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const initialSyncDone = useRef(false);
  const [syncUser] = useSyncUserMutation();

  // Initialize Telegram WebApp on mount
  useEffect(() => {
    initTelegramWebApp();
  }, []);

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

  // Update admin status when user data changes
  useEffect(() => {
    if (currentUser?.isAdmin !== undefined) {
      setIsAdmin(currentUser.isAdmin);
    }
  }, [currentUser?.isAdmin, setIsAdmin]);

  // Handle referral code from start parameter (must run BEFORE initial sync for new users)
  useEffect(() => {
    const handleReferralCode = async () => {
      if (initialSyncDone.current || !tgUser) return;

      try {
        // Check for start parameter from Telegram direct link mini app
        // Reference: https://core.telegram.org/bots/webapps#direct-link-mini-apps
        const { getReferralCodeFromStartParam } = await import('@/lib/telegram');
        const startParam = getReferralCodeFromStartParam();

        if (startParam) {
          // Only handle referral codes here (payment and wallet redirects handled by StartParamNavigator)
          if (!startParam.startsWith('payment_tx_') && startParam !== 'wallet') {
            console.log('[REFERRAL] Referral code detected from start param:', startParam);
            try {
              // Sync user with referral code - backend will only process for new users
              const result = await syncUser({
                ...tgUser,
                referral_code: startParam,
              }).unwrap();
              
              if (result.success) {
                console.log('[REFERRAL] User synced successfully with referral code:', startParam);
                // Redux state is automatically updated via extraReducers in userSlice
              }
            } catch (syncError: any) {
              console.error("[REFERRAL] Error syncing user with referral code:", syncError);
              // Don't block app initialization if referral sync fails
            }
          }
        }
      } catch (error) {
        console.error("Error in referral code handler:", error);
      }
    };
    
    // Process referral code immediately (before getCurrentUser query runs)
    // This ensures new users get their referral processed during initial registration
    handleReferralCode();
  }, [tgUser, syncUser]);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <StartParamNavigator />
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

// Component to handle navigation from Telegram Direct Links and ?start= parameters
const StartParamNavigator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigatedRef = useRef(false);
  const referralProcessedRef = useRef(false);
  const [syncUser] = useSyncUserMutation();

  useEffect(() => {
    const handleNavigation = async () => {
      if (navigatedRef.current) return;
      
      try {
        // Check URL query parameters (from BotFather Direct Links)
        const params = new URLSearchParams(location.search);
        
        // Handle payment callback from Direct Link: ?payment=callback&tx=ORDERID
        if (params.get('payment') === 'callback') {
          const txId = params.get('tx');
          const status = params.get('status');
          if (txId) {
            console.log('[PAYMENT] Payment callback from Direct Link, transaction ID:', txId);
            navigatedRef.current = true;
            setTimeout(() => {
              navigate(`/wallet?payment=${status === 'failed' ? 'failed' : 'pending'}&tx=${txId}`, { replace: true });
            }, 100);
            return;
          }
        }
        
        // Handle referral code from Direct Link: ?ref=CODE
        const refCode = params.get('ref');
        if (refCode && !referralProcessedRef.current) {
          console.log('[REFERRAL] Referral code detected from Direct Link query param:', refCode);
          referralProcessedRef.current = true;
          const { getTelegramUser } = await import('@/lib/telegram');
          const tgUser = getTelegramUser();
          if (tgUser) {
            try {
              // Sync user with referral code - backend will only process for new users
              const result = await syncUser({
                ...tgUser,
                referral_code: refCode,
              }).unwrap();
              
              if (result.success) {
                console.log('[REFERRAL] User synced successfully with referral code:', refCode);
                // Redux state is automatically updated via extraReducers in userSlice
              }
            } catch (error: any) {
              console.error("[REFERRAL] Error syncing user with referral code:", error);
              // Don't block navigation if referral sync fails
            }
          }
          // Don't return here - allow navigation to continue
        }
        
        // Handle start_param (fallback for ?start= links)
        const { getReferralCodeFromStartParam } = await import('@/lib/telegram');
        const startParam = getReferralCodeFromStartParam();

        if (startParam && location.pathname === '/') {
          // Small delay to ensure router is ready
          await new Promise(resolve => setTimeout(resolve, 200));

          // Handle payment redirect: payment_tx_ORDERID
          if (startParam.startsWith('payment_tx_')) {
            const orderId = startParam.replace('payment_tx_', '');
            console.log('[PAYMENT] Payment redirect from Telegram ?start= link, transaction ID:', orderId);
            navigatedRef.current = true;
            navigate(`/wallet?payment=pending&tx=${orderId}`, { replace: true });
            return;
          }
          
          // Handle wallet redirect: wallet
          if (startParam === 'wallet') {
            console.log('[NAVIGATION] Wallet redirect from Telegram ?start= link');
            navigatedRef.current = true;
            navigate('/wallet', { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error("Error in navigation handler:", error);
      }
    };
    
    handleNavigation();
  }, [navigate, location.pathname, location.search, syncUser]);

  return null;
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AdminProvider>
          <TelegramAccessGuard>
            <AppContent />
          </TelegramAccessGuard>
        </AdminProvider>
      </I18nProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
