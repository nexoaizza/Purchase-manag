import { Router } from "express";
import {
  createTransfer,
  getAllTransfers,
  getTransferById,
  updateTransfer,
  deleteTransfer,
  getTransfersByStock,
  getMyTransfers,
} from "../controllers/transfer.controller";
import { authenticate, requireAdmin, canUpdateTransfer } from "../middlewares/Auth";

const transferRouter = Router();

transferRouter.use(authenticate);

// Get transfers assigned to the logged-in staff member
transferRouter.get("/my", getMyTransfers);

// CRUD operations
transferRouter.post("/", requireAdmin, createTransfer);
transferRouter.get("/", getAllTransfers);
transferRouter.get("/:transferId", getTransferById);
transferRouter.put("/:transferId", canUpdateTransfer, updateTransfer);
transferRouter.delete("/:transferId", requireAdmin, deleteTransfer);

// Get transfers by stock
transferRouter.get("/stock/:stockId", getTransfersByStock);

export default transferRouter;
