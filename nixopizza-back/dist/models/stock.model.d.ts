import { Schema, Document } from "mongoose";
export interface IStock extends Document {
    name: string;
    description: string;
    location: string;
    items: Schema.Types.ObjectId[];
    createdAt?: Date;
    updatedAt?: Date;
}
declare const Stock: any;
export default Stock;
//# sourceMappingURL=stock.model.d.ts.map