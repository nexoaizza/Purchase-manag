import Notification from "../models/notification.model";
import { Types } from "mongoose";

export const pushNotification = async (
  title: string,
  message: string,
  type: "low_stock" | "budget_alert" | "expiry_warning" | "complited_task" | "transfer",
  actionUrl?: string,
  extra?: {
    subject?: string;
    recipient?: Types.ObjectId | string;
    transfer?: Types.ObjectId | string;
    status?: string;
  }
) => {
  await Notification.create({ title, message, type, actionUrl, ...extra });
};
