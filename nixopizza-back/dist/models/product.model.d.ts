import { Schema, Document } from "mongoose";
export interface IProduct extends Document {
    name: string;
    barcode?: string;
    unit: "liter" | "kilogram" | "box" | "piece" | "meter" | "pack" | "bottle";
    categoryId: Schema.Types.ObjectId;
    imageUrl?: string;
    description?: string;
    minQty: number;
    recommendedQty: number;
    expectedLifeTime?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
declare const Product: import("mongoose").Model<IProduct, {}, {}, {}, Document<unknown, {}, IProduct, {}, {}> & IProduct & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Product;
//# sourceMappingURL=product.model.d.ts.map