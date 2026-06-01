import { Router } from "express";
import { checkExpiredProducts, checkExpiringSoonProducts, resetPeriodicTasks } from "../controllers/cron.controller";

const router = Router();

router.get("/check-expired", checkExpiredProducts);
router.get("/check-expiring-soon", checkExpiringSoonProducts);
router.get("/reset-periodic-tasks", resetPeriodicTasks);

export default router;
