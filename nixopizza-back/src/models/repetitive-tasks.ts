import { Schema, model, Document } from "mongoose";

export interface ITask extends Document {
  description: string;
  selectedAt : Date;
  createdAt: Date;
  updatedAt: Date;
}

const RepetitiveTaskSchema = new Schema<ITask>(
  {
    description: { type: String, required: true },
    selectedAt: { type: Date, default: Date.now },  
  },
  { timestamps: true }
);

const RepetitiveTask = model<ITask>("RepetitiveTask", RepetitiveTaskSchema);

export default RepetitiveTask;
