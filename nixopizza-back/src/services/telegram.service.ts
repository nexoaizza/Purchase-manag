import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const sendTelegramMessage = async (chatId: string, text: string) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("Telegram bot token is missing in .env");
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
    });
    console.log(`Telegram message sent to chat ${chatId}`);
  } catch (error: any) {
    console.error(
      "Failed to send Telegram message:",
      error?.response?.data || error?.message || error
    );
  }
};
