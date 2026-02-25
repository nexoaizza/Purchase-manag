import { Schema, Document } from "mongoose";
export interface ITemplateItem {
    productId: Schema.Types.ObjectId;
    quantity: number;
}
export interface IPurchaseTemplate extends Document {
    name: string;
    description?: string;
    items: ITemplateItem[];
    supplierId: Schema.Types.ObjectId;
    ownerId: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const PurchaseTemplate: any;
export default PurchaseTemplate;
//# sourceMappingURL=template.model.d.ts.map