import Notification from "../models/notification.model";
import { Types } from "mongoose";

export const pushNotification = async (
  title: string,
  message: string,
  eventType: "low_stock" | "budget_alert" | "expiry_warning" | "complited_task" | "transfer",
  actionUrl?: string,
  extra?: {
    subject?: string;
    recipient?: Types.ObjectId | string;
    transfer?: Types.ObjectId | string;
    status?: string;
  }
) => {
  let type: "critical" | "success" | "warning" | "info" = "info";
  let category: "inventory" | "orders" | "suppliers" | "system" = "system";

  switch (eventType) {
    case "low_stock":
    case "expiry_warning":
      type = "warning";
      category = "inventory";
      break;
    case "budget_alert":
      type = "warning";
      category = "system";
      break;
    case "complited_task":
      type = "success";
      category = "inventory"; // or "system", inventory is a safe fallback
      break;
    case "transfer":
      type = "info";
      category = "inventory";
      break;
  }

  await Notification.create({ title, message, type, category, actionUrl, ...extra });
};
