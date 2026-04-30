import { Router } from "express";
import {
  createStock,
  updateStock,
  getAllStocks,
  getStock,
  deleteStock,
  addItemToStock,
  removeItemFromStock,
} from "../controllers/stock.controller";
import { authenticate, requireAdmin } from "../middlewares/Auth";

const stockRouter = Router();

stockRouter.use(authenticate);

stockRouter.post("/", requireAdmin, createStock);
stockRouter.put("/:stockId", requireAdmin, updateStock);
stockRouter.get("/", getAllStocks);
stockRouter.get("/:stockId", getStock);
stockRouter.delete("/:stockId", requireAdmin, deleteStock);

// Stock items management
stockRouter.post("/:stockId/items", requireAdmin, addItemToStock);
stockRouter.delete("/:stockId/items/:itemId", requireAdmin, removeItemFromStock);

export default stockRouter;
