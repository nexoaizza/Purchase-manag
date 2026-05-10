import { Request, Response } from "express";
import connectDB from "../config/database";
import StockItem from "../models/stock-item.model";
import { createLocalNotification } from "./notification.controller";

// Checks for expired stock items and creates local notifications
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
      const message = `Product ${prod?.name || "<unknown>"} in stock ${stock?.name || "<unknown>"} is expired`;
      // use string literals matching NotificationTypeEnum/Category
      await createLocalNotification(message, "warning", "Expired Product", "inventory");
    }

    res.status(200).json({ created: expiredItems.length });
  } catch (error: any) {
    console.error("Cron check expired error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};
