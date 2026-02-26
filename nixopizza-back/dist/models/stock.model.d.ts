import { Schema, Document } from "mongoose";
export interface IStock extends Document {
    name: string;
    description: string;
    location: string;
    items: Schema.Types.ObjectId[];
    createdAt?: Date;
    updatedAt?: Date;
}
declare const Stock: import("mongoose").Model<IStock, {}, {}, {}, Document<unknown, {}, IStock, {}, {}> & IStock & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Stock;
//# sourceMappingURL=stock.model.d.ts.map