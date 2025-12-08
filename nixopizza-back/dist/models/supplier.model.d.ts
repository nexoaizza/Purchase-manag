import { Types } from "mongoose";
export interface ISupplier {
    _id: Types.ObjectId;
    name: string;
    contactPerson: string;
    email?: string;
    phone1: string;
    phone2?: string;
    phone3?: string;
    address: string;
    city?: string;
    categoryIds: Types.ObjectId[];
    image?: string;
    notes?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const Supplier: import("mongoose").Model<ISupplier, {}, {}, {}, import("mongoose").Document<unknown, {}, ISupplier, {}, {}> & ISupplier & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Supplier;
//# sourceMappingURL=supplier.model.d.ts.map