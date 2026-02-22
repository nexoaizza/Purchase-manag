import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/Auth";
import {
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/task.controller";

const staffOrderRouter = Router();

staffOrderRouter.use(authenticate);

staffOrderRouter.post("/", requireAdmin, createOrder);
staffOrderRouter.get("/", getOrders);
staffOrderRouter.get("/:orderId", getOrderById);
staffOrderRouter.put("/:orderId", updateOrderStatus);
staffOrderRouter.delete("/:orderId", requireAdmin, deleteOrder);

export default staffOrderRouter;
