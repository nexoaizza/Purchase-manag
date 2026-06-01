import { Request, Response } from "express";
import connectDB from "../config/database";
import StockItem from "../models/stock-item.model";
import Task from "../models/task.model";
import { createLocalNotification } from "./notification.controller";

// Checks for already-expired stock items and creates notifications
export const checkExpiredProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();

    const now = new Date();

    const expiredItems = await StockItem.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "stocks",
          localField: "stock",
          foreignField: "_id",
          as: "stock",
        },
      },
      {
        $unwind: {
          path: "$stock",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $expr: {
            $or: [
              {
                $and: [
                  { $ne: ["$expireAt", null] },
                  { $lt: ["$expireAt", now] }
                ]
              },
              {
                $and: [
                  { $in: [{ $type: "$expireAt" }, ["missing", "null"]] },
                  { $gt: ["$product.expectedLifeTime", 0] },
                  {
                    $lt: [
                      {
                        $add: [
                          "$createdAt",
                          { $multiply: ["$product.expectedLifeTime", 24 * 60 * 60 * 1000] }
                        ]
                      },
                      now
                    ]
                  }
                ]
              }
            ]
          }
        }
      }
    ]);

    // Create notifications for each expired item
    for (const item of expiredItems) {
      const prod: any = item.product;
      const stock: any = item.stock;
      const message = `Product ${prod?.name || "<unknown>"} in stock ${stock?.name || "<unknown>"} has expired`;
      await createLocalNotification(message, "warning", "Expired Product", "expiring_soon");
    }

    res.status(200).json({ created: expiredItems.length });
  } catch (error: any) {
    console.error("Cron check expired error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// Checks for stock items expiring within the next 30 days and creates notifications daily
export const checkExpiringSoonProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    // Find items where expireAt is set and falls within the next 30 days (from now onwards)
    const expiringSoonItems = await StockItem.find({
      expireAt: { $exists: true, $ne: null, $gte: now, $lte: in30Days },
    })
      .populate("product")
      .populate("stock");

    for (const item of expiringSoonItems) {
      const prod: any = item.product;
      const stock: any = item.stock;
      const daysLeft = Math.ceil((new Date(item.expireAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const message = `Product ${prod?.name || "<unknown>"} in stock ${stock?.name || "<unknown>"} will expire in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
      await createLocalNotification(message, "warning", "Expiring Soon", "expiring_soon");
    }

    res.status(200).json({ created: expiringSoonItems.length });
  } catch (error: any) {
    console.error("Cron check expiring soon error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// Checks periodic tasks daily at midnight and resets them to "pending" if today is their scheduled day
export const resetPeriodicTasks = async (_req: Request, res: Response): Promise<void> => {
  try {
    await connectDB();
    const todayDayOfWeek = new Date().getDay(); // 0-6

    // Find periodic tasks scheduled for today that are not paused
    // Note: status might be "completed" or "canceled" from the previous occurrence.
    const tasksToReset = await Task.find({
      type: "periodic",
      status: { $ne: "paused" },
      periodicDays: todayDayOfWeek
    });

    let resetCount = 0;
    for (const task of tasksToReset) {
      if (task.status !== "pending") {
        task.status = "pending";
        await task.save();
        resetCount++;
      }
    }

    res.status(200).json({ resetCount });
  } catch (error: any) {
    console.error("Cron reset periodic tasks error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};
