import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MARZBAN_URL = process.env.MARZBAN_URL || 'https://sur.divanesaz.icu';
const MARZBAN_USERNAME = process.env.MARZBAN_USERNAME;
const MARZBAN_PASSWORD = process.env.MARZBAN_PASSWORD;

let cachedToken = null;
let tokenExpiry = null;

async function getToken() {
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    try {
        const params = new URLSearchParams();
        params.append('username', MARZBAN_USERNAME);
        params.append('password', MARZBAN_PASSWORD);

        const response = await axios.post(`${MARZBAN_URL}/api/admin/token`, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        cachedToken = response.data.access_token;
        // Token usually valid for 24h, let's refresh every 23h
        tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
        return cachedToken;
    } catch (error) {
        console.error('Marzban Auth Error:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Marzban');
    }
}

export const marzban = {
    async getUser(username) {
        try {
            const token = await getToken();
            const response = await axios.get(`${MARZBAN_URL}/api/user/${encodeURIComponent(username)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error(`Marzban GetUser Error (${username}):`, error.response?.data || error.message);
            throw error;
        }
    },

    async createUser(username, dataLimit = 0, expire = 0) {
        try {
            const token = await getToken();
            // Default settings for new users
            const userData = {
                username,
                status: 'active',
                data_limit: dataLimit,
                expire: expire,
                proxies: { vless: {} }, // VLESS is usually enabled; avoids disabled VMess errors
                inbounds: {} // Empty means all inbounds
            };

            const response = await axios.post(`${MARZBAN_URL}/api/user`, userData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error(`Marzban CreateUser Error (${username}):`, error.response?.data || error.message);
            throw error;
        }
    },

    async updateUser(username, data, retryIfMissing = true) {
        try {
            const token = await getToken();
            const response = await axios.put(`${MARZBAN_URL}/api/user/${encodeURIComponent(username)}`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            if (retryIfMissing && error.response?.status === 404) {
                console.log(`User ${username} missing in Marzban during update. Attempting to create...`);
                await this.createUser(username);
                return this.updateUser(username, data, false);
            }
            console.error(`Marzban UpdateUser Error (${username}):`, error.response?.data || error.message);
            throw error;
        }
    }
};
