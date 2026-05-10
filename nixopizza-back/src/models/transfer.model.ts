import { Schema, model, Document, Types } from "mongoose";

export interface ITransferItem {
  stockItem: Types.ObjectId;
  quantity: number;
}

export interface ITransfer extends Document {
  items: ITransferItem[];
  takenFrom: Types.ObjectId;
  takenTo: Types.ObjectId;
  status: "pending" | "in_progress" | "arrived" | "canceled";
  assignedTo: Types.ObjectId;
  startTime: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const transferItemSchema = new Schema<ITransferItem>(
  {
    stockItem: {
      type: Schema.Types.ObjectId,
      ref: "StockItem",
      required: [true, "Stock item reference is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
  },
  { _id: false }
);

const transferSchema = new Schema<ITransfer>(
  {
    items: {
      type: [transferItemSchema],
      required: [true, "At least one item is required"],
      validate: {
        validator: (v: ITransferItem[]) => Array.isArray(v) && v.length > 0,
        message: "At least one stock item is required",
      },
    },
    takenFrom: {
      type: Schema.Types.ObjectId,
      ref: "Stock",
      required: [true, "Source stock is required"],
    },
    takenTo: {
      type: Schema.Types.ObjectId,
      ref: "Stock",
      required: [true, "Destination stock is required"],
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "arrived", "canceled"],
      default: "pending",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned staff is required"],
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
  },
  { timestamps: true }
);

// Add index for better query performance
transferSchema.index({ status: 1, createdAt: -1 });
transferSchema.index({ takenFrom: 1, takenTo: 1 });
transferSchema.index({ assignedTo: 1 });

const Transfer = model<ITransfer>("Transfer", transferSchema);

export default Transfer;
