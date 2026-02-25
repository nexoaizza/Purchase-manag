"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const TaskSchema = new mongoose_1.Schema({
    taskNumber: { type: String, required: true, unique: true },
    staffId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
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
}, { timestamps: true });
const Task = (0, mongoose_1.model)("Task", TaskSchema);
exports.default = Task;
//# sourceMappingURL=task.model.js.map