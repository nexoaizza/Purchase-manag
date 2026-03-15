import { model, Schema, Types } from "mongoose";

export interface INotification {
  _id: string;
  type: "low_stock" | "budget_alert" | "expiry_warning" | "complited_task" | "transfer";
  subject?: string;
  title: string;
  message: string;
  isRead: boolean;
  recipientRole?: string;
  recipient?: Types.ObjectId;
  transfer?: Types.ObjectId;
  status?: string;
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ["low_stock", "budget_alert", "expiry_warning", "complited_task", "transfer"],
    },
    subject: String,
    title: String,
    message: String,
    isRead: {
      type: Boolean,
      default: false,
    },
    recipientRole: String,
    recipient: { type: Schema.Types.ObjectId, ref: "User" },
    transfer: { type: Schema.Types.ObjectId, ref: "Transfer" },
    status: String,
    actionUrl: String,
  },
  { timestamps: true }
);

const Notification = model<INotification>("Notification", notificationSchema);

export default Notification;
