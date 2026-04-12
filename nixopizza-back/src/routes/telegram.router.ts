import { Router } from "express";
import { handleTelegramWebhook } from "../controllers/telegram.controller";

const telegramRouter = Router();

telegramRouter.post("/webhook", handleTelegramWebhook);

export default telegramRouter;
