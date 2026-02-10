import { TelegramUser } from "./telegram";
import { config } from "./config";

const API_URL = config.apiUrl || '';

export async function syncUser(user: TelegramUser): Promise<{
    success: boolean;
    isAdmin?: boolean;
    balance?: number;
    referralCode?: string;
    phoneNumber?: string;
    createdAt?: string;
    lastSeen?: string;
    languageCode?: string;
    walletAddress?: string;
    hasPasskey?: boolean;
}> {
    try {
        const response = await fetch(`${API_URL}/api/sync-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });

        if (!response.ok) {
            throw new Error(`Failed to sync user: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            success: data.success,
            isAdmin: data.isAdmin,
            balance: data.balance,
            referralCode: data.referralCode,
            phoneNumber: data.phoneNumber,
            createdAt: data.createdAt,
            lastSeen: data.lastSeen,
            languageCode: data.languageCode,
            walletAddress: data.walletAddress,
            hasPasskey: data.hasPasskey
        };
    } catch (error) {
        console.error('Error syncing user with backend:', error);
        return { success: false };
    }
}

export async function updateWalletAddress(userId: number, walletAddress: string): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch(`${API_URL}/api/user/wallet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: userId, wallet_address: walletAddress }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating wallet:', error);
        return { success: false };
    }
}

export async function updateWithdrawalPasskey(userId: number, passkey: string): Promise<{ success: boolean; message?: string }> {
    try {
        const response = await fetch(`${API_URL}/api/user/passkey`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: userId, passkey }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating passkey:', error);
        return { success: false };
    }
}

export async function createPayment(userId: number, amount: number): Promise<{ success: boolean; invoice_url?: string; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/api/payment/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, amount }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating payment:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function getTransactionHistory(userId: number): Promise<{ success: boolean; history?: any[] }> {
    try {
        const response = await fetch(`${API_URL}/api/transactions/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        return { success: false };
    }
}

export async function requestWithdrawal(userId: number, amount: number, currency: string, passkey: string): Promise<{ success: boolean; message?: string; error?: string; balance?: number }> {
    try {
        const response = await fetch(`${API_URL}/api/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, amount, currency, passkey }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error requesting withdrawal:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function cancelWithdrawal(userId: number, withdrawalId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/api/withdraw/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, withdrawalId }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error cancelling withdrawal:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function getUsers(): Promise<{ success: boolean; users?: any[] }> {
    try {
        const response = await fetch(`${API_URL}/api/admin/users`);
        if (!response.ok) {
            throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Fetched users from API:", data);
        return { success: true, users: data.users };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { success: false };
    }
}

export async function getUserDetail(userId: string): Promise<{ success: boolean; user?: any }> {
    try {
        const response = await fetch(`${API_URL}/api/admin/user/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        return await response.json();
    } catch (error) {
        console.error('Error fetching user detail:', error);
        return { success: false };
    }
}

export async function adminUpdateUserSecurity(userId: string, walletAddress: string, passkey: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/api/admin/user/${userId}/security`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ wallet_address: walletAddress, withdrawal_passkey: passkey }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating user security in admin:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function updateUserBalance(userId: string, amount: number, type: 'set' | 'add' | 'subtract' = 'set'): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/api/admin/user/${userId}/balance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount, type }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating user balance:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function updateWithdrawalStatus(withdrawalId: string, status: 'completed' | 'failed'): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/api/admin/withdraw/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: withdrawalId, status }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating withdrawal status:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function getAllWithdrawals(): Promise<{ success: boolean; withdrawals?: any[] }> {
    try {
        const response = await fetch(`${API_URL}/api/admin/withdrawals`);
        if (!response.ok) throw new Error('Failed to fetch withdrawals');
        return await response.json();
    } catch (error) {
        console.error('Error fetching all withdrawals:', error);
        return { success: false };
    }
}

export async function getTotalDeposits(): Promise<{ success: boolean; total: number }> {
    try {
        const response = await fetch(`${API_URL}/api/admin/stats/total-deposits`);
        if (!response.ok) throw new Error('Failed to fetch total deposits');
        return await response.json();
    } catch (error) {
        console.error('Error fetching total deposits:', error);
        return { success: false, total: 0 };
    }
}

export async function getUserFinanceSummary(userId: number): Promise<{ success: boolean; summary?: any; error?: string }> {
    try {
        const response = await fetch(`${API_URL}/api/admin/user/${userId}/finance-summary`);
        if (!response.ok) throw new Error('Failed to fetch finance summary');
        return await response.json();
    } catch (error) {
        console.error('Error fetching user finance summary:', error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function checkBackendHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/health`);
        return response.ok;
    } catch (error) {
        return false;
    }
}
