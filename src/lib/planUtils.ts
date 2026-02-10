// Utility functions for plan management

export const getPlanInfo = (dataLimit: number, expire: number | undefined, availablePlans: any[] = []) => {
    // Convert bytes to GB
    const limitGB = dataLimit / (1024 * 1024 * 1024);
    
    // Check if it matches any plan
    const matchingPlan = availablePlans.find(plan => {
        const planLimitGB = plan.traffic;
        // Allow some tolerance (within 1GB)
        return Math.abs(planLimitGB - limitGB) < 1;
    });
    
    if (matchingPlan) {
        return { planName: matchingPlan.name, isBonus: false };
    }
    
    // Check if it's likely a welcome bonus (typically 5GB or less, short duration)
    // Welcome bonus is usually 5GB for 7 days
    if (limitGB <= 5 && expire) {
        const now = Math.floor(Date.now() / 1000);
        const daysRemaining = expire ? Math.ceil((expire - now) / 86400) : null;
        if (daysRemaining && daysRemaining <= 30) {
            return { planName: undefined, isBonus: true };
        }
    }
    
    return { planName: undefined, isBonus: false };
};
