"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTaskStatus = exports.getTaskById = exports.getTasks = exports.createTask = void 0;
const task_model_1 = __importDefault(require("../models/task.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const PushNotification_1 = require("../utils/PushNotification");
const firebase_service_1 = require("../services/firebase.service");
const generateTaskNumber = () => {
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000); // 4-digit
    return `TSK-${date}-${rand}`;
};
const createTask = async (req, res) => {
    try {
        const { staffId, description, deadline } = req.body;
        if (!staffId) {
            res.status(400).json({ message: "Staff ID is required" });
            return;
        }
        const newTask = await task_model_1.default.create({
            taskNumber: generateTaskNumber(),
            staffId,
            description,
            deadline,
        });
        // Send FCM push notification and in-app notification to assigned staff
        try {
            const staff = await user_model_1.default.findById(staffId);
            if (staff?.fcmToken) {
                const notifBody = deadline
                    ? `Task ${newTask.taskNumber} has been assigned to you. Deadline: ${new Date(deadline).toISOString()}`
                    : `Task ${newTask.taskNumber} has been assigned to you`;
                const data = {
                    type: "task_assigned",
                    taskId: String(newTask._id),
                    taskNumber: newTask.taskNumber,
                };
                if (deadline) {
                    data.deadline = new Date(deadline).toISOString();
                }
                await (0, firebase_service_1.sendPushNotification)(staff.fcmToken, "New Task Assigned", notifBody, data);
            }
            await (0, PushNotification_1.pushNotification)("New Task Assigned", `Task ${newTask.taskNumber} has been assigned.`, "task_assigned", `${process.env.BASE_URL}/api/tasks/${newTask._id}`);
        }
        catch (notifError) {
            console.error("Error sending task assignment notification:", notifError);
        }
        res
            .status(200)
            .json({ message: "Task created Successfully", task: newTask });
    }
    catch (error) {
        console.error("Error : ", error);
        res
            .status(500)
            .json({ message: "Internal server error", err: error.message });
    }
};
exports.createTask = createTask;
const getTasks = async (req, res) => {
    try {
        const { status, sortBy, order, taskNumber, page = 1, limit = 10, } = req.query;
        if (Number(page) < 1 || Number(limit) < 1) {
            res
                .status(400)
                .json({ message: "Page and limit must be greater than 0" });
            return;
        }
        const query = req.user?.isAdmin ? {} : { staffId: req.user?.userId };
        if (status)
            query.status = status;
        if (taskNumber)
            query.taskNumber = { $regex: taskNumber, $options: "i" };
        const sortField = sortBy?.toString() || "createdAt";
        const sortOrder = order === "asc" ? 1 : -1;
        const skip = (Number(page) - 1) * Number(limit);
        const tasks = await task_model_1.default.find(query)
            .populate("staffId", "fullname avatar email")
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(Number(limit));
        const total = await task_model_1.default.countDocuments(query);
        res.status(200).json({
            total,
            pages: Math.ceil(total / Number(limit)),
            tasks,
        });
    }
    catch (error) {
        console.error("Error : ", error);
        res
            .status(500)
            .json({ message: "Internal server error", err: error.message });
    }
};
exports.getTasks = getTasks;
const getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await task_model_1.default.findById(taskId).populate("staffId", "fullname avatar email");
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        if (task.staffId._id?.toString() !== req.user?.userId &&
            !req.user?.isAdmin) {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        res.status(200).json({ task });
    }
    catch (error) {
        console.error("Error : ", error);
        res
            .status(500)
            .json({ message: "Internal server error", err: error.message });
    }
};
exports.getTaskById = getTaskById;
const updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;
        if (!["pending", "completed", "canceled"].includes(status)) {
            res.status(400).json({ message: "Invalid status value" });
            return;
        }
        const task = await task_model_1.default.findById(taskId);
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        if (task.staffId._id?.toString() !== req.user?.userId &&
            !req.user?.isAdmin) {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        if (status === "canceled" && req.user?.isAdmin === false) {
            res.status(403).json({ message: "Only admins can cancel tasks" });
            return;
        }
        if (status === "completed" &&
            task.staffId._id?.toString() === req.user?.userId) {
            await (0, PushNotification_1.pushNotification)(` Task Completed: ${task.taskNumber} `, `The task ${task.taskNumber} has been marked as completed.`, "complited_task", `${process.env}/api/tasks/${task._id}`);
        }
        task.status = status;
        await task.save();
        const populatedTask = await task_model_1.default.findById(task._id).populate("staffId", "fullname avatar email");
        res
            .status(200)
            .json({ message: "Task status updated", task: populatedTask });
    }
    catch (error) {
        console.error("Error : ", error);
        res
            .status(500)
            .json({ message: "Internal server error", err: error.message });
    }
};
exports.updateTaskStatus = updateTaskStatus;
// ✅ Delete Task
const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await task_model_1.default.findByIdAndDelete(taskId);
        if (!task) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        res.status(200).json({ message: "Task deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting task: ", error);
        res
            .status(500)
            .json({ message: "Internal server error", err: error.message });
    }
};
exports.deleteTask = deleteTask;
//# sourceMappingURL=task.controller.js.map