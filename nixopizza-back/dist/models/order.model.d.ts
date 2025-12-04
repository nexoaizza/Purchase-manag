import mongoose, { Schema, Document } from "mongoose";
export interface IStatusHistoryEntry {
    from: string | null;
    to: string;
    at: Date;
    by?: Schema.Types.ObjectId | null;
}
export interface IOrder extends Document {
    bon: string;
    orderNumber: string;
    supplierId: Schema.Types.ObjectId;
    staffId: Schema.Types.ObjectId;
    status: "not assigned" | "assigned" | "pending_review" | "verified" | "paid" | "canceled";
    totalAmount: number;
    items: Schema.Types.ObjectId[];
    notes: string;
    createdAt: Date;
    updatedAt: Date;
    assignedDate?: Date;
    pendingReviewDate?: Date;
    verifiedDate?: Date;
    paidDate?: Date;
    expectedDate?: Date;
    canceledDate?: Date;
    statusHistory: IStatusHistoryEntry[];
}
declare const Order: mongoose.Model<IOrder, {}, {}, {}, mongoose.Document<unknown, {}, IOrder, {}, {}> & IOrder & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Order;
//# sourceMappingURL=order.model.d.ts.map