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
const AdminTicketsPage = lazy(() => import("./pages/AdminTicketsPage"));
const TicketsPage = lazy(() => import("./pages/TicketsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

import { useEffect, useRef } from "react";
import { getTelegramUser, initTelegramWebApp } from "./lib/telegram";
import { AdminProvider, useAdmin } from "./components/AdminProvider";
import { TelegramAccessGuard } from "./components/TelegramAccessGuard";
import { store } from "./store";
import { useGetCurrentUserQuery } from "./store/api";
import { useAppSelector } from "./store/hooks";
import { useTelegramTheme } from "./hooks/useTelegramTheme";
import { I18nProvider } from "./lib/i18n";
import { useReferralRegistration } from "./hooks/useReferralRegistration";
import { useTelegramEvents } from "./hooks/useTelegramEvents";
import { useTelegramSwipeBehavior } from "./hooks/useTelegramSwipeBehavior";
import { useTransactionCallback } from "./hooks/useTransactionCallback";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAdmin, setIsAdmin } = useAdmin();
  const tgUser = getTelegramUser();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  
  // Initialize Telegram WebApp FIRST (before any other hooks that depend on it)
  useEffect(() => {
    // Delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          initTelegramWebApp();
        }
      } catch (e) {
        console.error('Error initializing Telegram WebApp:', e);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Apply Telegram theme colors (safe - has internal guards)
  useTelegramTheme();

  // Handle referral registration (safe - has internal guards)
  useReferralRegistration();

  // Enable swipe gestures (safe - has internal guards)
  useTelegramSwipeBehavior(true);

  // Use getCurrentUser query - this provides the 'User' tag
  // When 'User' tag is invalidated (by payment verification, plan purchase, etc.),
  // this query automatically refetches and updates Redux via extraReducers
  const { data: userData } = useGetCurrentUserQuery(tgUser || null, {
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

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TelegramRouterHooks />
        <StartParamNavigator />
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/missions" element={<ConfigsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            {isAdmin &&
              <>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/user/:id" element={<AdminUserDetailPage />} />
                <Route path="/admin/withdrawals/pending" element={<AdminPendingWithdrawalsPage />} />
                <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
                <Route path="/admin/deposits" element={<AdminDepositsPage />} />
                <Route path="/admin/tickets" element={<AdminTicketsPage />} />
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

// Component to handle Telegram hooks that require Router context
// Must be inside BrowserRouter
const TelegramRouterHooks = () => {
  // Handle Telegram Mini Apps events (requires Router context)
  useTelegramEvents();
  
  // Handle transaction callbacks (requires Router context)
  useTransactionCallback();
  
  return null;
};

// Component to handle navigation from Telegram Direct Links and ?start= parameters
const StartParamNavigator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigatedRef = useRef(false);

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
        
        // Referral codes are now handled by useReferralRegistration hook
        // No need to process them here
        
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
  }, [navigate, location.pathname, location.search]);

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
