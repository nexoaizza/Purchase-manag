import { Router } from "express";
import {
  createStockUsage,
  getAllStockUsages,
  getStockUsageById,
  updateStockUsage,
  deleteStockUsage,
  getStockUsageStatsByProduct,
  getStockUsageStatsByStaff,
} from "../controllers/stock-usage.controller";
import { authenticate, requireAdmin } from "../middlewares/Auth";

const stockUsageRouter = Router();

stockUsageRouter.use(authenticate);

// CRUD
stockUsageRouter.post("/", createStockUsage);
stockUsageRouter.get("/", getAllStockUsages);
stockUsageRouter.get("/stats/by-product", getStockUsageStatsByProduct);
stockUsageRouter.get("/stats/by-staff", getStockUsageStatsByStaff);
stockUsageRouter.get("/:usageId", getStockUsageById);
stockUsageRouter.put("/:usageId", requireAdmin, updateStockUsage);
stockUsageRouter.delete("/:usageId", requireAdmin, deleteStockUsage);

export default stockUsageRouter;
