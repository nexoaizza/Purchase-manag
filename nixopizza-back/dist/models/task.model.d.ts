import { Schema, Document } from "mongoose";
export interface ITask extends Document {
    taskNumber: string;
    staffId: Schema.Types.ObjectId;
    description?: string;
    status: "pending" | "completed" | "canceled";
    deadline?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const Task: import("mongoose").Model<ITask, {}, {}, {}, Document<unknown, {}, ITask, {}, {}> & ITask & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Task;
//# sourceMappingURL=task.model.d.ts.map