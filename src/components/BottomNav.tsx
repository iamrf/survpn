import { motion } from "framer-motion";
import { Home, Wallet, Download, Settings, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAdmin } from "./AdminProvider";
import { useNavBadges } from "@/hooks/useNavBadges";
import { hapticSelection } from "@/lib/telegram";
import { useI18n } from "@/lib/i18n";

interface NavItem {
  icon: React.ElementType;
  path: string;
  adminOnly?: boolean;
}

const BottomNav = () => {
  const { t, isRTL } = useI18n();
  
  const navItems: NavItem[] = [
    { icon: Home, path: "/" },
    { icon: Wallet, path: "/wallet" },
    { icon: Download, path: "/missions" },
    { icon: Settings, path: "/settings" },
    { icon: ShieldCheck, path: "/admin", adminOnly: true },
  ];
  
  const getNavLabel = (path: string): string => {
    switch (path) {
      case '/': return t.nav.home;
      case '/wallet': return t.nav.wallet;
      case '/missions': return t.nav.subscription;
      case '/settings': return t.nav.settings;
      case '/admin': return t.nav.admin;
      default: return '';
    }
  };

  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const badges = useNavBadges();

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);
  
  // Get badge count for a nav item
  const getBadgeCount = (path: string): number => {
    if (path === '/admin') return badges.admin.count;
    return 0;
  };
  
  // Check if badge should be shown for a nav item
  const shouldShowBadge = (path: string): boolean => {
    if (path === '/admin') return badges.admin.show;
    return false;
  };

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 pb-safe z-50"
      dir={dir}
    >
      <div className={`flex items-center justify-around py-3 px-4 ${isRTL ? '' : ''}`}>
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.path}
              onClick={() => {
                hapticSelection();
                navigate(item.path);
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="flex flex-col items-center gap-1 min-w-[64px] py-1"
            >
              <motion.div
                className={`relative p-2 rounded-xl transition-colors duration-300 ${isActive
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Badge */}
                {shouldShowBadge(item.path) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute -top-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-background shadow-lg ${isRTL ? '-right-1' : '-left-1'}`}
                  >
                    {getBadgeCount(item.path) > 99 ? '99+' : getBadgeCount(item.path)}
                  </motion.div>
                )}
              </motion.div>
              <span
                className={`text-xs font-medium transition-colors duration-300 ${isActive ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                {getNavLabel(item.path)}
              </span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-0 h-1 w-12 bg-primary rounded-t-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNav;
