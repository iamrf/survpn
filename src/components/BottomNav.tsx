import { motion } from "framer-motion";
import { Home, Wallet, Target, Settings, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAdmin } from "./AdminProvider";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: "خانه", path: "/" },
  { icon: Wallet, label: "کیف پول", path: "/wallet" },
  { icon: Target, label: "ماموریت‌ها", path: "/missions" },
  { icon: Settings, label: "تنظیمات", path: "/settings" },
  { icon: ShieldCheck, label: "مدیریت", path: "/admin", adminOnly: true },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 pb-safe"
    >
      <div className="flex items-center justify-around py-3 px-4">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="flex flex-col items-center gap-1 min-w-[64px] py-1"
            >
              <motion.div
                className={`p-2 rounded-xl transition-colors duration-300 ${isActive
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span
                className={`text-xs font-medium transition-colors duration-300 ${isActive ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                {item.label}
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
