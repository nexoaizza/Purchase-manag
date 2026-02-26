import { Schema, Document } from "mongoose";
export interface ITransfer extends Document {
    items: Schema.Types.ObjectId[];
    takenFrom: Schema.Types.ObjectId;
    takenTo: Schema.Types.ObjectId;
    quantity: number;
    status: "pending" | "arrived";
    createdAt?: Date;
    updatedAt?: Date;
}
declare const Transfer: import("mongoose").Model<ITransfer, {}, {}, {}, Document<unknown, {}, ITransfer, {}, {}> & ITransfer & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Transfer;
//# sourceMappingURL=transfer.model.d.ts.map