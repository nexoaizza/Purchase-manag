import { Request, Response } from "express";
import StaffOrder from "../models/task.model";
import { pushNotification } from "../utils/PushNotification";

const generateOrderNumber = () => {
  const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000); // 4-digit
  return `ORD-${date}-${rand}`;
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { staffId, description, deadline } = req.body;

    if (!staffId) {
      res.status(400).json({ message: "Staff ID is required" });
      return;
    }

    const newOrder = await StaffOrder.create({
      orderNumber: generateOrderNumber(),
      staffId,
      description,
      deadline,
    });

    res
      .status(200)
      .json({ message: "Order created Successfully", order: newOrder });
  } catch (error: any) {
    console.error("Error : ", error);
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const {
      status,
      sortBy,
      order,
      orderNumber,
      page = 1,
      limit = 10,
    } = req.query;
    if (Number(page) < 1 || Number(limit) < 1) {
      res
        .status(400)
        .json({ message: "Page and limit must be greater than 0" });
      return;
    }

    const query: any = req.user?.isAdmin ? {} : { staffId: req.user?.userId };

    if (status) query.status = status;
    if (orderNumber) query.orderNumber = { $regex: orderNumber, $options: "i" };

    const sortField = sortBy?.toString() || "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await StaffOrder.find(query)
      .populate("staffId", "fullname avatar email")
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    const total = await StaffOrder.countDocuments(query);
    res.status(200).json({
      total,
      pages: Math.ceil(total / Number(limit)),
      orders,
    });
  } catch (error: any) {
    console.error("Error : ", error);
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await StaffOrder.findById(orderId).populate(
      "staffId",
      "fullname avatar email"
    );

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    if (
      (order.staffId as any)._id?.toString() !== req.user?.userId &&
      !req.user?.isAdmin
    ) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    res.status(200).json({ order });
  } catch (error: any) {
    console.error("Error : ", error);
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!["pending", "completed", "canceled"].includes(status)) {
      res.status(400).json({ message: "Invalid status value" });
      return;
    }

    const order = await StaffOrder.findById(orderId);

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    if (
      (order.staffId as any)._id?.toString() !== req.user?.userId &&
      !req.user?.isAdmin
    ) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    if (status === "canceled" && req.user?.isAdmin === false) {
      res.status(403).json({ message: "Only admins can cancel orders" });
      return;
    }
    if (
      status === "completed" &&
      (order.staffId as any)._id?.toString() === req.user?.userId
    ) {
      await pushNotification(
        ` Order Completed: ${order.orderNumber} `,
        `The order ${order.orderNumber} has been marked as completed.`,
        "completed_order",
        `${process.env}/api/staff-orders/${order._id}`
      );
    }
    order.status = status;
    await order.save();

    const populatedOrder = await StaffOrder.findById(order._id).populate(
      "staffId",
      "fullname avatar email"
    );

    res
      .status(200)
      .json({ message: "Order status updated", order: populatedOrder });
  } catch (error: any) {
    console.error("Error : ", error);
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

// ✅ Delete Order
export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await StaffOrder.findByIdAndDelete(orderId);

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting order: ", error);
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};
