import { Schema, model, Document, Types } from "mongoose";

export interface ITransfer extends Document {
  items: Types.ObjectId[];
  takenFrom: Types.ObjectId;
  takenTo: Types.ObjectId;
  quantity: number;
  status: "pending" | "in_progress" | "arrived" | "canceled";
  assignedTo: Types.ObjectId;
  startTime: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const transferSchema = new Schema<ITransfer>(
  {
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: "StockItem",
        required: [true, "At least one stock item is required"],
      },
    ],
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
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
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
