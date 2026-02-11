import { useGetAllWithdrawalsQuery } from "@/store/api";
import { useAdmin } from "@/components/AdminProvider";

export interface NavBadge {
  count: number;
  show: boolean;
}

export interface NavBadges {
  admin: NavBadge;
  // Future badges can be added here
  // wallet: NavBadge;
  // notifications: NavBadge;
}

/**
 * Hook to get badge counts for navigation items
 * Returns badge information for each nav item
 */
export const useNavBadges = (): NavBadges => {
  const { isAdmin } = useAdmin();
  
  // Fetch pending withdrawals for admin badge
  const { data: withdrawalsData } = useGetAllWithdrawalsQuery(undefined, {
    skip: !isAdmin, // Only fetch if user is admin
    pollingInterval: 30000, // Poll every 30 seconds to keep badge updated
  });
  
  const withdrawalsList = withdrawalsData?.withdrawals || [];
  const pendingWithdrawalsCount = withdrawalsList.filter((w: any) => w.status === 'pending').length;
  
  return {
    admin: {
      count: pendingWithdrawalsCount,
      show: isAdmin && pendingWithdrawalsCount > 0,
    },
  };
};
