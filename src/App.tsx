import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import HomePage from "./pages/HomePage";
import WalletPage from "./pages/WalletPage";
import MissionsPage from "./pages/MissionsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import AdminUserDetailPage from "./pages/AdminUserDetailPage";
import AdminPendingWithdrawalsPage from "./pages/AdminPendingWithdrawalsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import NotFound from "./pages/NotFound";

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
    const user = getTelegramUser();
    if (user) {
      console.log("Syncing user data with backend...", user);
      syncUser(user).unwrap().then((result) => {
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
  }, [setIsAdmin, dispatch, syncUser]);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/missions" element={<MissionsPage />} />
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
