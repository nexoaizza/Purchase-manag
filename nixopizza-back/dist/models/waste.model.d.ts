import { Schema, Document } from "mongoose";
export interface IWaste extends Document {
    product: Schema.Types.ObjectId;
    quantity: number;
    reason: string;
    stock?: Schema.Types.ObjectId;
    staff?: Schema.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
declare const Waste: import("mongoose").Model<IWaste, {}, {}, {}, Document<unknown, {}, IWaste, {}, {}> & IWaste & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Waste;
//# sourceMappingURL=waste.model.d.ts.map