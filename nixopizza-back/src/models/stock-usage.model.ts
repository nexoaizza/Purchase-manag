import { Schema, model, Document } from "mongoose";

export interface IStockUsage extends Document {
  stockItem: Schema.Types.ObjectId;  // which stock item was consumed
  product: Schema.Types.ObjectId;    // denormalized for easier querying
  stock: Schema.Types.ObjectId;      // which stock location
  quantityUsed: number;
  staff: Schema.Types.ObjectId;      // who took/used it
  usedAt: Date;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const stockUsageSchema = new Schema<IStockUsage>(
  {
    stockItem: {
      type: Schema.Types.ObjectId,
      ref: "StockItem",
      required: [true, "StockItem is required"],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    stock: {
      type: Schema.Types.ObjectId,
      ref: "Stock",
      required: [true, "Stock is required"],
    },
    quantityUsed: {
      type: Number,
      required: [true, "Quantity used is required"],
      min: [1, "Quantity must be at least 1"],
    },
    staff: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Staff is required"],
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

stockUsageSchema.index({ product: 1, usedAt: -1 });
stockUsageSchema.index({ staff: 1, usedAt: -1 });
stockUsageSchema.index({ stock: 1, usedAt: -1 });
stockUsageSchema.index({ stockItem: 1 });
stockUsageSchema.index({ usedAt: -1 });

const StockUsage = model<IStockUsage>("StockUsage", stockUsageSchema);
export default StockUsage;
