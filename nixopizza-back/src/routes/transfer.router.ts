import { Router } from "express";
import {
  createTransfer,
  getAllTransfers,
  getTransferById,
  updateTransfer,
  deleteTransfer,
  getTransfersByStock,
} from "../controllers/transfer.controller";
import { authenticate, requireAdmin } from "../middlewares/Auth";

const transferRouter = Router();

transferRouter.use(authenticate);

// CRUD operations
transferRouter.post("/", requireAdmin, createTransfer);
transferRouter.get("/", getAllTransfers);
transferRouter.get("/:transferId", getTransferById);
transferRouter.put("/:transferId", requireAdmin, updateTransfer);
transferRouter.delete("/:transferId", requireAdmin, deleteTransfer);

// Get transfers by stock
transferRouter.get("/stock/:stockId", getTransfersByStock);

export default transferRouter;
