import { Router } from "express";
import {
  createWaste,
  getAllWastes,
  getWasteById,
  updateWaste,
  deleteWaste,
  getWasteStatsByProduct,
  getWasteStatsByReason,
} from "../controllers/waste.controller";
import { authenticate, requireAdmin } from "../middlewares/Auth";

const wasteRouter = Router();

wasteRouter.use(authenticate);

// CRUD operations
wasteRouter.post("/", requireAdmin, createWaste);
wasteRouter.get("/", getAllWastes);
wasteRouter.get("/:wasteId", getWasteById);
wasteRouter.put("/:wasteId", requireAdmin, updateWaste);
wasteRouter.delete("/:wasteId", requireAdmin, deleteWaste);

// Statistics endpoints
wasteRouter.get("/stats/by-product", getWasteStatsByProduct);
wasteRouter.get("/stats/by-reason", getWasteStatsByReason);

export default wasteRouter;
