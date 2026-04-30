// src/services/whatsapp.service.ts
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const WHATSAPP_API_URL = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Sends a text message via WhatsApp Cloud API
 * @param to - The recipient's phone number (international format, e.g., 15551234567)
 * @param body - The text message content
 */
export const sendWhatsAppMessage = async (to: string, body: string) => {
  if (!TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.warn("WhatsApp credentials missing in .env");
    return;
  }

  try {
    await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: { preview_url: false, body: body },
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`WhatsApp message sent to ${to}`);
  } catch (error: any) {
    console.error(
      "Failed to send WhatsApp message:",
      error.response ? error.response.data : error.message
    );
  }
};
