import { Router } from "express";
import { checkExpiredProducts, checkExpiringSoonProducts } from "../controllers/cron.controller";

const router = Router();

router.get("/check-expired", checkExpiredProducts);
router.get("/check-expiring-soon", checkExpiringSoonProducts);

export default router;
