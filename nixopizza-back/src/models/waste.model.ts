import { Schema, model, Document } from "mongoose";

export interface IWaste extends Document {
  product: Schema.Types.ObjectId;
  quantity: number;
  reason: string;
  stock?: Schema.Types.ObjectId;
  staff?: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const wasteSchema = new Schema<IWaste>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
    },
    stock: {
      type: Schema.Types.ObjectId,
      ref: "Stock",
      required: false,
    },
    staff: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

// Add indexes for better query performance
wasteSchema.index({ product: 1, createdAt: -1 });
wasteSchema.index({ reason: 1 });
wasteSchema.index({ stock: 1 });
wasteSchema.index({ createdAt: -1 });

const Waste = model<IWaste>("Waste", wasteSchema);

export default Waste;
