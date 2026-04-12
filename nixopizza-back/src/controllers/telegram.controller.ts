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

    if (!text || !chatId || !text.startsWith("/start ")) {
      return;
    }

    const supplierId = text.slice(7).trim();
    if (!supplierId) {
      return;
    }

    const supplier = await Supplier.findByIdAndUpdate(
      supplierId,
      { telegramChatId: chatId },
      { new: true }
    );

    if (!supplier) {
      return;
    }

    await sendTelegramMessage(
      chatId,
      "✅ You are now successfully connected to Nexo Pizza orders!"
    );
  } catch (error: any) {
    console.error("Telegram webhook handling failed:", error?.message || error);
  } finally {
    res.sendStatus(200);
  }
};
