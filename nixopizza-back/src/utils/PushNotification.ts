import Notification from "../models/notification.model";

export const pushNotification = async (
  title: string,
  message: string,
  type: "low_stock" | "budget_alert" | "expiry_warning" | "complited_task" | "transfer",
  actionUrl?: string
) => {
  await Notification.create({ title, message, type, actionUrl });
};
