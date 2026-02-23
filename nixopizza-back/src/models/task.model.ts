import { Schema, model, Document } from "mongoose";

export interface ITask extends Document {
  taskNumber: string;
  staffId: Schema.Types.ObjectId;
  description?: string;
  status: "pending" | "completed" | "canceled";
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    taskNumber: { type: String, required: true, unique: true },
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

const Task = model<ITask>("Task", TaskSchema);

export default Task;
