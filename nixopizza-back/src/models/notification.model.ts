import { model, Schema, Types } from "mongoose";


export type NotificationTypeEnum =
  "critical"
  | "success"
  | "warning"
  | "info"
  ;

export type NotificationCategoryEnum =
  "inventory"      // legacy
  | "orders"
  | "suppliers"
  | "system"
  | "low_stock"    // quantity fell below minQty
  | "expiring_soon" // product expiring within 30 days
  ;

export interface INotification {
  _id: string;
  type: NotificationTypeEnum;
  subject?: string;
  title: string;
  category: NotificationCategoryEnum;
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
      enum: ["critical", "success", "warning", "info"],
    },
    subject: String,
    title: String,
    message: String,
    category: {
      type: String,
      enum: ["inventory", "orders", "suppliers", "system", "low_stock", "expiring_soon"],
    },
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
