import { Schema, model, Document } from "mongoose";

export interface IStockItem extends Document {
  stock: Schema.Types.ObjectId;
  product: Schema.Types.ObjectId;
  price: number;
  quantity: number;
  createdAt?: Date;
  expireAt?: Date;
  updatedAt?: Date;
}

const stockItemSchema = new Schema<IStockItem>(
  {
    stock: {
      type: Schema.Types.ObjectId,
      ref: "Stock",
      required: [true, "Stock is required"],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be positive"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity must be positive"],
    },
    expireAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

const StockItem = model<IStockItem>("StockItem", stockItemSchema);

export default StockItem;
