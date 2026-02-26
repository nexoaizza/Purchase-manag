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
declare const StockItem: import("mongoose").Model<IStockItem, {}, {}, {}, Document<unknown, {}, IStockItem, {}, {}> & IStockItem & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default StockItem;
//# sourceMappingURL=stock-item.model.d.ts.map