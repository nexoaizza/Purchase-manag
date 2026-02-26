"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsAppMessage = void 0;
// src/services/whatsapp.service.ts
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const WHATSAPP_API_URL = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
/**
 * Sends a text message via WhatsApp Cloud API
 * @param to - The recipient's phone number (international format, e.g., 15551234567)
 * @param body - The text message content
 */
const sendWhatsAppMessage = async (to, body) => {
    if (!TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
        console.warn("WhatsApp credentials missing in .env");
        return;
    }
    try {
        await axios_1.default.post(WHATSAPP_API_URL, {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "text",
            text: { preview_url: false, body: body },
        }, {
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                "Content-Type": "application/json",
            },
        });
        console.log(`WhatsApp message sent to ${to}`);
    }
    catch (error) {
        console.error("Failed to send WhatsApp message:", error.response ? error.response.data : error.message);
    }
};
exports.sendWhatsAppMessage = sendWhatsAppMessage;
//# sourceMappingURL=whatsapp.service.js.map