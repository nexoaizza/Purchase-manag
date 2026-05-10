import { Router } from "express";
import { checkExpiredProducts } from "../controllers/cron.controller";

const router = Router();

router.get("/check-expired", checkExpiredProducts);

export default router;
