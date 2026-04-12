import { Router } from "express";
import rateLimit from "express-rate-limit";
import { handleTelegramWebhook } from "../controllers/telegram.controller";

const telegramRouter = Router();
const telegramWebhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

telegramRouter.post("/webhook", telegramWebhookLimiter, handleTelegramWebhook);

export default telegramRouter;
