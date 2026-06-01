import { Schema, model, Document } from "mongoose";

export interface ITask extends Document {
  taskNumber: string;
  staffId: Schema.Types.ObjectId;
  type: "normal" | "periodic";
  periodicDays?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime?: string; // e.g. "14:30"
  description?: string;
  status: "pending" | "completed" | "canceled" | "paused";
  deadline?: Date;
  history: { date: Date; description?: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    taskNumber: { type: String, required: true, unique: true },
    staffId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["normal", "periodic"], default: "normal" },
    periodicDays: [{ type: Number }],
    startTime: { type: String },
    description: { type: String, required: false },
    deadline: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "canceled", "paused"],
      default: "pending",
    },
    history: [
      {
        date: { type: Date, default: Date.now },
        description: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const Task = model<ITask>("Task", TaskSchema);

export default Task;
