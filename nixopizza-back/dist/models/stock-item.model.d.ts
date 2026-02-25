import { Schema, Document } from "mongoose";
export interface IStockItem extends Document {
    stock: Schema.Types.ObjectId;
    product: Schema.Types.ObjectId;
    price: number;
    quantity: number;
    createdAt?: Date;
    expireAt?: Date;
    updatedAt?: Date;
}
declare const StockItem: any;
export default StockItem;
//# sourceMappingURL=stock-item.model.d.ts.map