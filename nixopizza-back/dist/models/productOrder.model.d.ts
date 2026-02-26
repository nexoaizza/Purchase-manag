import { Types, HydratedDocument } from "mongoose";
export interface IProductOrder {
    _id: Types.ObjectId;
    productId: Types.ObjectId;
    quantity: number;
    expirationDate: Date;
    unitCost: number;
    remainingQte: number;
    isExpired: boolean;
    expiredQuantity: number;
    createdAt: Date;
    updatedAt: Date;
}
export type ProductOrderDocument = HydratedDocument<IProductOrder>;
declare const ProductOrder: any;
export default ProductOrder;
//# sourceMappingURL=productOrder.model.d.ts.map