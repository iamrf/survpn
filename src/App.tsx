import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import HomePage from "./pages/HomePage";
import WalletPage from "./pages/WalletPage";
import MissionsPage from "./pages/MissionsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import AdminUserDetailPage from "./pages/AdminUserDetailPage";
import AdminPendingWithdrawalsPage from "./pages/AdminPendingWithdrawalsPage";
import NotFound from "./pages/NotFound";

import { useEffect } from "react";
import { getTelegramUser } from "./lib/telegram";
import { syncUser } from "./lib/api";
import { AdminProvider, useAdmin } from "./components/AdminProvider";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAdmin, setIsAdmin } = useAdmin();

  useEffect(() => {
    const user = getTelegramUser();
    if (user) {
      console.log("Syncing user data with backend...", user);
      syncUser(user).then((result) => {
        if (result.success) {
          console.log("User synced successfully", result.isAdmin ? "(Admin)" : "");
          if (result.isAdmin !== undefined) {
            setIsAdmin(result.isAdmin);
          }
        } else {
          console.error("Failed to sync user");
        }
      });
    }
  }, [setIsAdmin]);

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
  <QueryClientProvider client={queryClient}>
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  </QueryClientProvider>
);

export default App;
