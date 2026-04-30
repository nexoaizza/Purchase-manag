import { Schema, model, Document } from "mongoose";

export interface IStock extends Document {
  name: string;
  description: string;
  location: string;
  items: Schema.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const stockSchema = new Schema<IStock>(
  {
    name: {
      type: String,
      required: [true, "Stock name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Stock description is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Stock location is required"],
      trim: true,
    },
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: "StockItem",
      },
    ],
  },
  { timestamps: true }
);

const Stock = model<IStock>("Stock", stockSchema);

export default Stock;
