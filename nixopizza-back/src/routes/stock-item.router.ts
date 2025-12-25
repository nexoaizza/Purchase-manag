import { Router } from "express";
import {
  createStockItem,
  createMultipleStockItems,
  updateStockItem,
  getAllStockItems,
  getStockItem,
  deleteStockItem,
  getExpiredStockItems,
  getExpiringSoonStockItems,
} from "../controllers/stock-item.controller";
import { authenticate, requireAdmin } from "../middlewares/Auth";

const stockItemRouter = Router();

stockItemRouter.use(authenticate);

stockItemRouter.post("/", requireAdmin, createStockItem);
stockItemRouter.post("/bulk", requireAdmin, createMultipleStockItems);
stockItemRouter.put("/:stockItemId", requireAdmin, updateStockItem);
stockItemRouter.get("/", getAllStockItems);
stockItemRouter.get("/expired", getExpiredStockItems);
stockItemRouter.get("/expiring-soon", getExpiringSoonStockItems);
stockItemRouter.get("/:stockItemId", getStockItem);
stockItemRouter.delete("/:stockItemId", requireAdmin, deleteStockItem);

export default stockItemRouter;
