import { Request, Response } from "express";
import Supplier from "../models/supplier.model";
import { sendTelegramMessage } from "../services/telegram.service";

export const handleTelegramWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const message = req.body?.message;
    const text: string | undefined = message?.text;
    const chatId = message?.chat?.id ? String(message.chat.id) : undefined;

    // Ignore messages without text or chatId
    if (!text || !chatId) {
      return;
    }

    // Only process the deep-link /start command
    if (!text.startsWith("/start ")) {
      return;
    }

    // Extract the phone number from the deep link
    const phoneNumber = text.slice(7).trim();
    
    if (!phoneNumber) {
      await sendTelegramMessage(
        chatId,
        "❌ Connection failed. Please use the correct deep-link provided by Nexo Pizza."
      );
      return;
    }

    // Find the supplier by phone number instead of database ID
    const supplier = await Supplier.findOne({ phone1: phoneNumber });

    if (!supplier) {
      await sendTelegramMessage(
        chatId,
        `❌ Connection failed. We couldn't find a supplier with the phone number: ${phoneNumber}. Please check the number and try again.`
      );
      return;
    }

    // Save the new Telegram Chat ID to the supplier
    supplier.telegramChatId = chatId;
    await supplier.save();

    // Send a personalized success message
    await sendTelegramMessage(
      chatId,
      `✅ Welcome! You are now successfully connected to Nexo Pizza orders as **${supplier.name}**.`
    );

  } catch (error: any) {
    console.error("Telegram webhook handling failed:", error?.message || error);
  } finally {
    // Always return 200 OK so Telegram knows the webhook was received
    res.sendStatus(200);
  }
};
