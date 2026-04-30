import { Schema, model, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  barcode?: string;
  unit: "liter" | "kilogram" | "box" | "piece" | "meter" | "pack" | "bottle";
  categoryId: Schema.Types.ObjectId;
  imageUrl?: string;              // optional blob/public URL
  description?: string;
  minQty: number;
  recommendedQty: number;
  expectedLifeTime?: number; // in days
  createdAt?: Date;
  updatedAt?: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product Name Is Required"],
      trim: true,
      unique: true,
    },
    barcode: {
      type: String,
      unique: false,
    },
    unit: {
      type: String,
      enum: ["liter", "kilogram", "box", "piece", "meter", "pack", "bottle"],
      required: [true, "Product Unit Is Required"],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product Category Is Required"],
    },
    imageUrl: {
      type: String,
      required: false, // was required true; now optional since we can allow creation first then image later
    },
    description: {
      type: String,
    },
    minQty: {
      type: Number,
      default: 0,
    },
    recommendedQty: {
      type: Number,
      default: 0,
    },
    expectedLifeTime: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Product = model<IProduct>("Product", productSchema);
export default Product;