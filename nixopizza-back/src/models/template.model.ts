import mongoose, { Schema, Document } from "mongoose";

export interface ITemplateItem {
  productId: Schema.Types.ObjectId;
  quantity: number;
}

export interface IPurchaseTemplate extends Document {
  name: string;
  description?: string;
  items: ITemplateItem[];
  supplierId: Schema.Types.ObjectId;
  ownerId: Schema.Types.ObjectId; // creator/owner
  createdAt: Date;
  updatedAt: Date;
}

const templateItemSchema = new Schema<ITemplateItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseTemplateSchema = new Schema<IPurchaseTemplate>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    items: { type: [templateItemSchema], default: [] },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const PurchaseTemplate = mongoose.model<IPurchaseTemplate>(
  "PurchaseTemplate",
  purchaseTemplateSchema
);

export default PurchaseTemplate;
