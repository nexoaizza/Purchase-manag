import { Router } from "express";
import {
  createTransfer,
  getAllTransfers,
  getMyTransfers,
  getTransferById,
  updateTransfer,
  deleteTransfer,
  getTransfersByStock,
} from "../controllers/transfer.controller";
import { authenticate, requireAdmin } from "../middlewares/Auth";

const transferRouter = Router();

transferRouter.use(authenticate);

// Get my transfers (for authenticated staff) - must be before /:transferId
transferRouter.get("/my", getMyTransfers);

// CRUD operations
transferRouter.post("/", requireAdmin, createTransfer);
transferRouter.get("/", getAllTransfers);
transferRouter.get("/:transferId", getTransferById);
transferRouter.put("/:transferId", updateTransfer);
transferRouter.delete("/:transferId", requireAdmin, deleteTransfer);

// Get transfers by stock
transferRouter.get("/stock/:stockId", getTransfersByStock);

export default transferRouter;
