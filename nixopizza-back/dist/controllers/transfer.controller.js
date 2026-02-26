"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransfersByStock = exports.deleteTransfer = exports.updateTransfer = exports.getTransferById = exports.getMyTransfers = exports.getAllTransfers = exports.createTransfer = void 0;
const transfer_model_1 = __importDefault(require("../models/transfer.model"));
const stock_item_model_1 = __importDefault(require("../models/stock-item.model"));
const stock_model_1 = __importDefault(require("../models/stock.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const PushNotification_1 = require("../utils/PushNotification");
// CREATE - Create a transfer request from one stock to another
const createTransfer = async (req, res) => {
    try {
        const { items, takenFrom, takenTo, quantity, status, assignedTo, startTime } = req.body;
        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ message: "Items array is required and must not be empty" });
            return;
        }
        if (!takenFrom || !takenTo) {
            res.status(400).json({ message: "Both source (takenFrom) and destination (takenTo) stocks are required" });
            return;
        }
        if (!quantity || quantity < 1) {
            res.status(400).json({ message: "Quantity must be at least 1" });
            return;
        }
        if (!assignedTo) {
            res.status(400).json({ message: "Assigned staff member is required" });
            return;
        }
        if (!startTime || isNaN(new Date(startTime).getTime())) {
            res.status(400).json({ message: "A valid transfer start time is required" });
            return;
        }
        // Verify stocks exist
        const sourceStock = await stock_model_1.default.findById(takenFrom);
        const destStock = await stock_model_1.default.findById(takenTo);
        if (!sourceStock) {
            res.status(404).json({ message: "Source stock not found" });
            return;
        }
        if (!destStock) {
            res.status(404).json({ message: "Destination stock not found" });
            return;
        }
        if (takenFrom === takenTo) {
            res.status(400).json({ message: "Source and destination stocks cannot be the same" });
            return;
        }
        // Verify assigned user exists
        const assignedUser = await user_model_1.default.findById(assignedTo);
        if (!assignedUser) {
            res.status(404).json({ message: "Assigned staff member not found" });
            return;
        }
        // Verify all items exist
        const stockItems = await stock_item_model_1.default.find({ _id: { $in: items } });
        if (stockItems.length !== items.length) {
            res.status(404).json({ message: "One or more stock items not found" });
            return;
        }
        const newTransfer = await transfer_model_1.default.create({
            items,
            takenFrom,
            takenTo,
            quantity,
            status: status || "pending",
            assignedTo,
            startTime: new Date(startTime),
        });
        const populatedTransfer = await transfer_model_1.default.findById(newTransfer._id)
            .populate("takenFrom", "name location")
            .populate("takenTo", "name location")
            .populate("assignedTo", "fullname email avatar")
            .populate({
            path: "items",
            populate: {
                path: "product",
                select: "name",
            },
        });
        // Notify assigned staff member
        await (0, PushNotification_1.pushNotification)("New Transfer Assigned", `You have been assigned a new transfer from ${sourceStock.name} to ${destStock.name}`, "transfer", `/transfers/${newTransfer._id}`);
        res.status(201).json({
            message: "Transfer created successfully",
            transfer: populatedTransfer
        });
    }
    catch (error) {
        console.error("Transfer create error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.createTransfer = createTransfer;
// READ - Get all transfers with pagination, filtering, and sorting
const getAllTransfers = async (req, res) => {
    try {
        const { status, takenFrom, takenTo, assignedTo, productName, dateFrom, dateTo, sortBy = "newest", page = 1, limit = 10, } = req.query;
        if (Number(page) < 1 || Number(limit) < 1) {
            res.status(400).json({ message: "Page and limit must be greater than 0" });
            return;
        }
        const query = {};
        // Filter by status
        const validStatuses = ["pending", "in_progress", "arrived", "canceled"];
        if (status && validStatuses.includes(status)) {
            query.status = status;
        }
        // Filter by source stock
        if (takenFrom) {
            query.takenFrom = takenFrom;
        }
        // Filter by destination stock
        if (takenTo) {
            query.takenTo = takenTo;
        }
        // Filter by assigned staff member
        if (assignedTo) {
            query.assignedTo = assignedTo;
        }
        // Filter by date range
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) {
                query.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                query.createdAt.$lte = new Date(dateTo);
            }
        }
        // Filter by product name inside items
        if (productName) {
            // Find products matching the name
            const products = await product_model_1.default.find({
                name: { $regex: productName, $options: "i" },
            }).select("_id");
            const productIds = products.map((p) => p._id);
            // Find stock items with those products
            const stockItems = await stock_item_model_1.default.find({
                product: { $in: productIds },
            }).select("_id");
            const stockItemIds = stockItems.map((item) => item._id);
            // Add to query to filter transfers by those item IDs
            if (stockItemIds.length > 0) {
                query.items = { $in: stockItemIds };
            }
            else {
                // No matching products found, return empty result
                res.status(200).json({
                    transfers: [],
                    pagination: {
                        currentPage: Number(page),
                        totalPages: 0,
                        totalItems: 0,
                        itemsPerPage: Number(limit),
                    },
                });
                return;
            }
        }
        // Sorting
        let sortOption = {};
        switch (sortBy) {
            case "newest":
                sortOption = { createdAt: -1 };
                break;
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "status":
                sortOption = { status: 1, createdAt: -1 };
                break;
            case "stock_asc":
                sortOption = { takenFrom: 1 };
                break;
            case "stock_desc":
                sortOption = { takenFrom: -1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [transfers, totalItems] = await Promise.all([
            transfer_model_1.default.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(Number(limit))
                .populate("takenFrom", "name location")
                .populate("takenTo", "name location")
                .populate("assignedTo", "fullname email avatar")
                .populate({
                path: "items",
                populate: {
                    path: "product",
                    select: "name",
                },
            }),
            transfer_model_1.default.countDocuments(query),
        ]);
        const totalPages = Math.ceil(totalItems / Number(limit));
        res.status(200).json({
            transfers,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalItems,
                itemsPerPage: Number(limit),
            },
        });
    }
    catch (error) {
        console.error("Transfer getAll error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getAllTransfers = getAllTransfers;
// READ - Get transfers assigned to the authenticated user
const getMyTransfers = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        if (Number(page) < 1 || Number(limit) < 1) {
            res.status(400).json({ message: "Page and limit must be greater than 0" });
            return;
        }
        const query = { assignedTo: req.user?.userId };
        const validStatuses = ["pending", "in_progress", "arrived", "canceled"];
        if (status && validStatuses.includes(status)) {
            query.status = status;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [transfers, total] = await Promise.all([
            transfer_model_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate("takenFrom", "name location")
                .populate("takenTo", "name location")
                .populate("assignedTo", "fullname email avatar")
                .populate({
                path: "items",
                populate: {
                    path: "product",
                    select: "name",
                },
            }),
            transfer_model_1.default.countDocuments(query),
        ]);
        const pages = Math.ceil(total / Number(limit));
        res.status(200).json({ transfers, total, pages });
    }
    catch (error) {
        console.error("Transfer getMyTransfers error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getMyTransfers = getMyTransfers;
// READ - Get single transfer by ID
const getTransferById = async (req, res) => {
    try {
        const { transferId } = req.params;
        const transfer = await transfer_model_1.default.findById(transferId)
            .populate("takenFrom", "name location description")
            .populate("takenTo", "name location description")
            .populate("assignedTo", "fullname email avatar")
            .populate({
            path: "items",
            populate: {
                path: "product",
                select: "name description",
            },
        });
        if (!transfer) {
            res.status(404).json({ message: "Transfer not found" });
            return;
        }
        res.status(200).json({ transfer });
    }
    catch (error) {
        console.error("Transfer getById error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getTransferById = getTransferById;
// UPDATE - Update arrival status and quantity (before approval)
const updateTransfer = async (req, res) => {
    try {
        const { transferId } = req.params;
        const { status, quantity, items, assignedTo, startTime } = req.body;
        const transfer = await transfer_model_1.default.findById(transferId)
            .populate("takenFrom", "name")
            .populate("takenTo", "name");
        if (!transfer) {
            res.status(404).json({ message: "Transfer not found" });
            return;
        }
        const validStatuses = ["pending", "in_progress", "arrived", "canceled"];
        // Update status if provided
        if (status !== undefined) {
            if (!validStatuses.includes(status)) {
                res.status(400).json({ message: "Status must be one of: pending, in_progress, arrived, canceled" });
                return;
            }
            const prevStatus = transfer.status;
            transfer.status = status;
            // Notify assigned staff if status changed
            if (prevStatus !== status) {
                const sourceName = transfer.takenFrom?.name || "";
                const destName = transfer.takenTo?.name || "";
                await (0, PushNotification_1.pushNotification)("Transfer Status Updated", `Transfer from ${sourceName} to ${destName} has been updated to ${status}`, "transfer", `/transfers/${transfer._id}`);
            }
        }
        // Update assignedTo if provided
        if (assignedTo !== undefined) {
            const newAssignee = await user_model_1.default.findById(assignedTo);
            if (!newAssignee) {
                res.status(404).json({ message: "Assigned staff member not found" });
                return;
            }
            transfer.assignedTo = assignedTo;
            // Notify newly assigned staff member
            const sourceName = transfer.takenFrom?.name || "";
            const destName = transfer.takenTo?.name || "";
            await (0, PushNotification_1.pushNotification)("New Transfer Assigned", `You have been assigned a new transfer from ${sourceName} to ${destName}`, "transfer", `/transfers/${transfer._id}`);
        }
        // Update startTime if provided
        if (startTime !== undefined) {
            if (isNaN(new Date(startTime).getTime())) {
                res.status(400).json({ message: "A valid transfer start time is required" });
                return;
            }
            transfer.startTime = new Date(startTime);
        }
        // Update quantity if provided (only if still pending or in_progress)
        if (quantity !== undefined) {
            if (transfer.status === "arrived") {
                res.status(400).json({ message: "Cannot update quantity after transfer has arrived" });
                return;
            }
            if (quantity < 1) {
                res.status(400).json({ message: "Quantity must be at least 1" });
                return;
            }
            transfer.quantity = quantity;
        }
        // Update items if provided (only if still pending or in_progress)
        if (items !== undefined) {
            if (transfer.status === "arrived") {
                res.status(400).json({ message: "Cannot update items after transfer has arrived" });
                return;
            }
            if (!Array.isArray(items) || items.length === 0) {
                res.status(400).json({ message: "Items must be a non-empty array" });
                return;
            }
            // Verify all items exist
            const stockItems = await stock_item_model_1.default.find({ _id: { $in: items } });
            if (stockItems.length !== items.length) {
                res.status(404).json({ message: "One or more stock items not found" });
                return;
            }
            transfer.items = items;
        }
        await transfer.save();
        const updatedTransfer = await transfer_model_1.default.findById(transferId)
            .populate("takenFrom", "name location")
            .populate("takenTo", "name location")
            .populate("assignedTo", "fullname email avatar")
            .populate({
            path: "items",
            populate: {
                path: "product",
                select: "name",
            },
        });
        res.status(200).json({
            message: "Transfer updated successfully",
            transfer: updatedTransfer
        });
    }
    catch (error) {
        console.error("Transfer update error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.updateTransfer = updateTransfer;
// DELETE - Delete a transfer
const deleteTransfer = async (req, res) => {
    try {
        const { transferId } = req.params;
        const transfer = await transfer_model_1.default.findById(transferId);
        if (!transfer) {
            res.status(404).json({ message: "Transfer not found" });
            return;
        }
        // Optional: Prevent deletion of arrived transfers
        // if (transfer.status === "arrived") {
        //   res.status(400).json({ message: "Cannot delete a transfer that has already arrived" });
        //   return;
        // }
        await transfer_model_1.default.findByIdAndDelete(transferId);
        res.status(200).json({ message: "Transfer deleted successfully" });
    }
    catch (error) {
        console.error("Transfer delete error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.deleteTransfer = deleteTransfer;
// Get transfers by stock (useful for stock-specific views)
const getTransfersByStock = async (req, res) => {
    try {
        const { stockId } = req.params;
        const { type = "all", page = 1, limit = 10 } = req.query;
        if (Number(page) < 1 || Number(limit) < 1) {
            res.status(400).json({ message: "Page and limit must be greater than 0" });
            return;
        }
        // Verify stock exists
        const stock = await stock_model_1.default.findById(stockId);
        if (!stock) {
            res.status(404).json({ message: "Stock not found" });
            return;
        }
        let query = {};
        // Filter by transfer type
        switch (type) {
            case "incoming":
                query.takenTo = stockId;
                break;
            case "outgoing":
                query.takenFrom = stockId;
                break;
            case "all":
            default:
                query.$or = [{ takenFrom: stockId }, { takenTo: stockId }];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [transfers, totalItems] = await Promise.all([
            transfer_model_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate("takenFrom", "name location")
                .populate("takenTo", "name location")
                .populate("assignedTo", "fullname email avatar")
                .populate({
                path: "items",
                populate: {
                    path: "product",
                    select: "name",
                },
            }),
            transfer_model_1.default.countDocuments(query),
        ]);
        const totalPages = Math.ceil(totalItems / Number(limit));
        res.status(200).json({
            transfers,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalItems,
                itemsPerPage: Number(limit),
            },
        });
    }
    catch (error) {
        console.error("Transfer getByStock error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getTransfersByStock = getTransfersByStock;
//# sourceMappingURL=transfer.controller.js.map