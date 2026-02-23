import { Schema, model, Document } from "mongoose";

export interface IStaffOrder extends Document {
  orderNumber: string;
  staffId: Schema.Types.ObjectId;
  description?: string;
  status: "pending" | "completed" | "canceled";
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StaffOrderSchema = new Schema<IStaffOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    staffId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: false },
    deadline: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "canceled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const StaffOrder = model<IStaffOrder>("StaffOrder", StaffOrderSchema);

export default StaffOrder;
