export const config = {
    telegramBotToken: import.meta.env.BOT_TOKEN,
    apiUrl: import.meta.env.VITE_API_URL || "",
    isDev: import.meta.env.DEV,
};
