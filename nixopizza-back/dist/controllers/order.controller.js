"use strict";
// controllers/order.controller.ts
// Flow: not assigned -> assigned -> pending_review -> verified -> paid (canceled allowed before verified)
// Includes item editing in submitOrderForReview (assigned -> pending_review)
// Adds statusHistory tracking for every status transition
// Removes deprecated execPopulate usage (Mongoose >=6)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderAnalytics = exports.getOrder = exports.getOrderStats = exports.getOrdersByFilter = exports.updateOrder = exports.verifyOrder = exports.submitOrderForReview = exports.assignOrder = exports.createOrder = void 0;
const product_model_1 = __importDefault(require("../models/product.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const productOrder_model_1 = __importDefault(require("../models/productOrder.model"));
const Delete_1 = require("../utils/Delete");
const crypto_1 = __importDefault(require("crypto"));
const blob_1 = require("../utils/blob");
/**
 * Helper: generate order number like ORD-YYYYMMDD-RAND
 */
const generateOrderNumber = () => {
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${date}-${rand}`;
};
/**
 * Helper: build unique blob key for uploads
 */
const buildBlobKey = (originalName) => {
    const ext = (originalName.match(/\.[^/.]+$/) || [".bin"])[0];
    const unique = crypto_1.default.randomBytes(8).toString("hex");
    return `${Date.now()}-${unique}${ext}`;
};
/**
 * Push a status transition entry to history
 */
function pushStatusHistory(order, from, to, userId) {
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
        from,
        to,
        at: new Date(),
        by: userId || null,
    });
}
/**
 * Populate related docs
 */
async function populateOrder(orderDoc) {
    if (!orderDoc)
        return orderDoc;
    await orderDoc.populate([
        { path: "staffId", select: "avatar email fullname" },
        {
            path: "supplierId",
            select: "email name image contactPerson address phone1 phone2 phone3 city",
        },
        {
            path: "items",
            populate: {
                path: "productId",
                select: "name currentStock imageUrl barcode",
            },
        },
    ]);
    return orderDoc;
}
/* ------------------------- CREATE ORDER ------------------------- */
const createOrder = async (req, res) => {
    try {
        const { items, supplierId, notes, expectedDate, } = req.body;
        if (!supplierId || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ message: "supplierId and items are required" });
            return;
        }
        const productOrdersIds = [];
        for (const { productId, quantity, unitCost, expirationDate } of items) {
            const product = await product_model_1.default.findById(productId);
            if (!product) {
                res.status(404).json({ message: `Product not found: ${productId}` });
                return;
            }
            const productOrder = await productOrder_model_1.default.create({
                productId,
                quantity,
                unitCost,
                expirationDate,
                remainingQte: quantity,
            });
            productOrdersIds.push(productOrder._id.toString());
        }
        const totalAmount = items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
        const order = new order_model_1.default({
            items: productOrdersIds,
            supplierId,
            status: "not assigned",
            totalAmount,
            notes,
            expectedDate,
            orderNumber: generateOrderNumber(),
            statusHistory: [],
        });
        // Initial history entry
        pushStatusHistory(order, null, "not assigned", req.user?.userId);
        if (req.file) {
            const key = buildBlobKey(req.file.originalname);
            const uploaded = await (0, blob_1.uploadBufferToBlob)(key, req.file.buffer, req.file.mimetype);
            order.bon = uploaded.url;
        }
        await order.save();
        const populated = await populateOrder(order);
        res
            .status(201)
            .json({ message: "Order created successfully", order: populated });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
};
exports.createOrder = createOrder;
/* ------------------------- ASSIGN ORDER ------------------------- */
const assignOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { staffId } = req.body;
        if (!staffId) {
            res.status(400).json({ message: "Staff ID is required" });
            return;
        }
        const order = await order_model_1.default.findById(orderId);
        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        if (order.status !== "not assigned") {
            res
                .status(400)
                .json({ message: "Order is already assigned or progressed" });
            return;
        }
        const prevStatus = order.status;
        order.staffId = staffId;
        order.status = "assigned";
        order.assignedDate = new Date();
        pushStatusHistory(order, prevStatus, "assigned", req.user?.userId);
        await order.save();
        const populated = await populateOrder(order);
        res
            .status(200)
            .json({ message: "Order assigned successfully", order: populated });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};
exports.assignOrder = assignOrder;
/* ------------- SUBMIT FOR REVIEW (assigned -> pending_review) ------------- */
/* Supports item quantity/unitCost adjustments via itemsUpdates JSON */
const submitOrderForReview = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { totalAmount } = req.body;
        let itemsUpdates = [];
        if (req.body.itemsUpdates) {
            try {
                itemsUpdates = JSON.parse(req.body.itemsUpdates);
            }
            catch {
                res.status(400).json({ message: "Invalid itemsUpdates JSON format" });
                return;
            }
        }
        const order = await order_model_1.default.findById(orderId).populate({
            path: "items",
            populate: { path: "productId" },
        });
        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        if (order.status !== "assigned") {
            res
                .status(400)
                .json({ message: "Order must be assigned before submitting for review" });
            return;
        }
        if (!req.file) {
            res.status(400).json({ message: "Bill file is required" });
            return;
        }
        // Apply item updates
        if (itemsUpdates.length) {
            const validItemIds = new Set(order.items.map((it) => it._id.toString()));
            for (const upd of itemsUpdates) {
                if (!validItemIds.has(upd.itemId)) {
                    res
                        .status(400)
                        .json({ message: `Invalid productOrder itemId: ${upd.itemId}` });
                    return;
                }
                if (upd.quantity < 0 || upd.unitCost < 0) {
                    res.status(400).json({ message: "Quantity must be >= 0 and unitCost >= 0" });
                    return;
                }
            }
            for (const upd of itemsUpdates) {
                const po = await productOrder_model_1.default.findById(upd.itemId);
                if (!po)
                    continue;
                po.quantity = upd.quantity;
                po.unitCost = upd.unitCost;
                po.remainingQte = upd.quantity;
                await po.save();
            }
            // Refresh items
            const refreshed = await order_model_1.default.findById(orderId).populate({
                path: "items",
                populate: { path: "productId" },
            });
            if (refreshed) {
                order.items = refreshed.items;
            }
        }
        // Replace legacy bill
        if (order.bon && order.bon.startsWith("/uploads/orders/")) {
            try {
                (0, Delete_1.deleteImage)(order.bon);
            }
            catch { }
        }
        const key = buildBlobKey(req.file.originalname);
        const uploaded = await (0, blob_1.uploadBufferToBlob)(key, req.file.buffer, req.file.mimetype);
        order.bon = uploaded.url;
        // Recompute total
        let computedTotal = 0;
        for (const item of order.items) {
            const po = await productOrder_model_1.default.findById(item._id);
            if (po)
                computedTotal += po.quantity * po.unitCost;
        }
        order.totalAmount = totalAmount
            ? parseFloat(totalAmount)
            : parseFloat(computedTotal.toFixed(2));
        const prevStatus = order.status;
        order.status = "pending_review";
        order.pendingReviewDate = new Date();
        pushStatusHistory(order, prevStatus, "pending_review", req.user?.userId);
        await order.save();
        const populated = await populateOrder(order);
        res.status(200).json({
            message: "Order submitted for review",
            order: populated,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};
exports.submitOrderForReview = submitOrderForReview;
/* ------------- VERIFY ORDER (pending_review -> verified) ------------- */
const verifyOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await order_model_1.default.findById(orderId).populate({
            path: "items",
            populate: { path: "productId" },
        });
        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        if (order.status !== "pending_review") {
            res
                .status(400)
                .json({ message: "Order must be pending_review to verify" });
            return;
        }
        if (!order.bon) {
            res.status(400).json({ message: "Bill missing" });
            return;
        }
        // Inventory update
        for (const item of order.items) {
            const po = await productOrder_model_1.default.findById(item._id);
            if (po) {
                const product = await product_model_1.default.findById(po.productId);
                if (product) {
                    product.currentStock += po.quantity;
                    await product.save();
                }
            }
        }
        const prevStatus = order.status;
        order.status = "verified";
        order.verifiedDate = new Date();
        pushStatusHistory(order, prevStatus, "verified", req.user?.userId);
        await order.save();
        const populated = await populateOrder(order);
        res
            .status(200)
            .json({ message: "Order verified successfully", order: populated });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};
exports.verifyOrder = verifyOrder;
/* ------------------------- UPDATE ORDER ------------------------- */
const updateOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { status, expectedDate, canceledDate, totalAmount } = req.body;
        const validStatuses = [
            "not assigned",
            "assigned",
            "pending_review",
            "verified",
            "paid",
            "canceled",
        ];
        if (status && !validStatuses.includes(status)) {
            res
                .status(400)
                .json({
                message: `Invalid status. Use one of: ${validStatuses.join(", ")}`,
            });
            return;
        }
        const order = await order_model_1.default.findById(orderId).populate({
            path: "items",
            populate: { path: "productId" },
        });
        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        // Track previous status for history
        let prevStatus = null;
        if (status && status !== order.status) {
            prevStatus = order.status;
        }
        if (status === "paid") {
            if (order.status !== "verified") {
                res
                    .status(400)
                    .json({ message: "Order must be verified before paid" });
                return;
            }
            prevStatus = order.status;
            order.status = "paid";
            order.paidDate = new Date();
            pushStatusHistory(order, prevStatus, "paid", req.user?.userId);
        }
        else if (status === "canceled") {
            if (["verified", "paid"].includes(order.status)) {
                res
                    .status(400)
                    .json({ message: "Cannot cancel a verified or paid order" });
                return;
            }
            prevStatus = order.status;
            order.status = "canceled";
            order.canceledDate = canceledDate ? new Date(canceledDate) : new Date();
            pushStatusHistory(order, prevStatus, "canceled", req.user?.userId);
        }
        else if (status && status !== order.status) {
            order.status = status;
            if (status === "assigned")
                order.assignedDate = new Date();
            if (status === "pending_review")
                order.pendingReviewDate = new Date();
            if (status === "verified")
                order.verifiedDate = new Date(); // (prefer verify endpoint)
            pushStatusHistory(order, prevStatus, status, req.user?.userId);
        }
        if (expectedDate !== undefined) {
            order.expectedDate =
                expectedDate !== null ? new Date(expectedDate) : undefined;
        }
        if (req.file) {
            if (order.bon && order.bon.startsWith("/uploads/orders/")) {
                try {
                    (0, Delete_1.deleteImage)(order.bon);
                }
                catch { }
            }
            const key = buildBlobKey(req.file.originalname);
            const uploaded = await (0, blob_1.uploadBufferToBlob)(key, req.file.buffer, req.file.mimetype);
            order.bon = uploaded.url;
        }
        if (totalAmount) {
            order.totalAmount = parseFloat(totalAmount);
        }
        await order.save();
        const populated = await populateOrder(order);
        res
            .status(200)
            .json({ message: "Order updated successfully", order: populated });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};
exports.updateOrder = updateOrder;
/* ------------------------- FILTER ORDERS ------------------------- */
const getOrdersByFilter = async (req, res) => {
    try {
        const { orderNumber, staffId, status, supplierIds, sortBy, order, page = 1, limit = 10, } = req.query;
        if (Number(page) < 1 || Number(limit) < 1) {
            res
                .status(400)
                .json({ message: "Page and limit must be > 0" });
            return;
        }
        const query = req.user?.isAdmin ? {} : { staffId: req.user?.userId };
        if (status)
            query.status = status;
        if (staffId)
            query.staffId = staffId;
        if (orderNumber) {
            query.orderNumber = { $regex: orderNumber, $options: "i" };
        }
        if (supplierIds) {
            let supplierIdArray = [];
            if (Array.isArray(supplierIds))
                supplierIdArray = supplierIds;
            else if (typeof supplierIds === "string")
                supplierIdArray = supplierIds.split(",");
            else
                supplierIdArray = [String(supplierIds)];
            supplierIdArray = supplierIdArray
                .map((id) => id.trim())
                .filter((id) => id.length > 0);
            if (supplierIdArray.length > 0) {
                query.supplierId = { $in: supplierIdArray };
            }
        }
        const skip = (Number(page) - 1) * Number(limit);
        const sortField = sortBy?.toString() || "createdAt";
        const sortOrder = order === "asc" ? 1 : -1;
        const orders = await order_model_1.default.find(query)
            .populate([
            { path: "staffId", select: "avatar email fullname" },
            {
                path: "supplierId",
                select: "email name image contactPerson address phone1 phone2 phone3 city",
            },
            {
                path: "items",
                populate: {
                    path: "productId",
                    select: "name currentStock imageUrl barcode",
                },
            },
        ])
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(Number(limit));
        const total = await order_model_1.default.countDocuments(query);
        res.status(200).json({
            orders,
            total,
            pages: Math.ceil(total / Number(limit)),
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};
exports.getOrdersByFilter = getOrdersByFilter;
/* ------------------------- ORDER STATS ------------------------- */
const getOrderStats = async (req, res) => {
    try {
        const baseQuery = req.user?.isAdmin
            ? {}
            : { staffId: req.user?.userId };
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);
        const notAssignedOrders = await order_model_1.default.countDocuments({
            ...baseQuery,
            status: "not assigned",
        });
        const assignedOrders = await order_model_1.default.countDocuments({
            ...baseQuery,
            status: "assigned",
        });
        const pendingReviewOrders = await order_model_1.default.countDocuments({
            ...baseQuery,
            status: "pending_review",
        });
        const verifiedOrders = await order_model_1.default.countDocuments({
            ...baseQuery,
            status: "verified",
        });
        const paidOrders = await order_model_1.default.countDocuments({
            ...baseQuery,
            status: "paid",
            createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });
        const totalValueAgg = await order_model_1.default.aggregate([
            {
                $match: {
                    ...baseQuery,
                    status: "paid",
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            { $group: { _id: null, totalValue: { $sum: "$totalAmount" } } },
        ]);
        const totalValue = totalValueAgg.length > 0 ? totalValueAgg[0].totalValue : 0;
        res.status(200).json({
            notAssignedOrders,
            assignedOrders,
            pendingReviewOrders,
            verifiedOrders,
            paidOrders,
            totalValue: parseFloat(totalValue.toFixed(2)),
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch order statistics",
            error: error.message,
        });
    }
};
exports.getOrderStats = getOrderStats;
/* ------------------------- GET SINGLE ORDER ------------------------- */
const getOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await order_model_1.default.findById(orderId).populate([
            { path: "staffId", select: "avatar email fullname" },
            {
                path: "items",
                populate: {
                    path: "productId",
                    select: "name price quantity",
                },
            },
        ]);
        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        if (order.staffId?.toString() !== req.user?.userId && !req.user?.isAdmin) {
            res.status(404).json({ message: "You can't access this order" });
            return;
        }
        res.status(200).json({ order });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};
exports.getOrder = getOrder;
/* ------------------------- ORDER ANALYTICS ------------------------- */
const getOrderAnalytics = async (req, res) => {
    try {
        const { period = "month" } = req.query;
        const validPeriods = ["week", "month", "year"];
        if (!validPeriods.includes(period)) {
            res
                .status(400)
                .json({ message: "Invalid period. Use 'week','month','year'" });
            return;
        }
        const totalOrders = await order_model_1.default.countDocuments();
        const notAssignedOrders = await order_model_1.default.countDocuments({
            status: "not assigned",
        });
        const assignedOrders = await order_model_1.default.countDocuments({ status: "assigned" });
        const pendingReviewOrders = await order_model_1.default.countDocuments({
            status: "pending_review",
        });
        const verifiedOrders = await order_model_1.default.countDocuments({ status: "verified" });
        const paidOrders = await order_model_1.default.countDocuments({ status: "paid" });
        const totalSpendingAgg = await order_model_1.default.aggregate([
            { $match: { status: "paid" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);
        const totalSpent = totalSpendingAgg.length > 0 ? totalSpendingAgg[0].total : 0;
        let groupStage = {};
        let sortStage = {};
        let limitCount = 12;
        let periodLabel = {};
        if (period === "week") {
            groupStage._id = {
                year: { $year: "$createdAt" },
                week: { $week: "$createdAt" },
            };
            sortStage = { "_id.year": -1, "_id.week": -1 };
            limitCount = 8;
            periodLabel = {
                $concat: [{ $toString: "$_id.year" }, "-W", { $toString: "$_id.week" }],
            };
        }
        else if (period === "month") {
            groupStage._id = {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
            };
            sortStage = { "_id.year": -1, "_id.month": -1 };
            limitCount = 12;
            periodLabel = {
                $concat: [
                    { $toString: "$_id.year" },
                    "-",
                    {
                        $cond: [
                            { $lt: ["$_id.month", 10] },
                            { $concat: ["0", { $toString: "$_id.month" }] },
                            { $toString: "$_id.month" },
                        ],
                    },
                ],
            };
        }
        else {
            groupStage._id = { year: { $year: "$createdAt" } };
            sortStage = { "_id.year": -1 };
            limitCount = 5;
            periodLabel = { $toString: "$_id.year" };
        }
        groupStage.totalOrders = { $sum: 1 };
        groupStage.totalSpent = {
            $sum: {
                $cond: [{ $eq: ["$status", "paid"] }, "$totalAmount", 0],
            },
        };
        groupStage.notAssignedOrders = {
            $sum: { $cond: [{ $eq: ["$status", "not assigned"] }, 1, 0] },
        };
        groupStage.assignedOrders = {
            $sum: { $cond: [{ $eq: ["$status", "assigned"] }, 1, 0] },
        };
        groupStage.pendingReviewOrders = {
            $sum: { $cond: [{ $eq: ["$status", "pending_review"] }, 1, 0] },
        };
        groupStage.verifiedOrders = {
            $sum: { $cond: [{ $eq: ["$status", "verified"] }, 1, 0] },
        };
        groupStage.paidOrders = {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
        };
        const periodData = await order_model_1.default.aggregate([
            { $group: groupStage },
            { $sort: sortStage },
            { $limit: limitCount },
            { $addFields: { periodLabel } },
            {
                $project: {
                    _id: 0,
                    periodLabel: 1,
                    totalOrders: 1,
                    totalSpent: 1,
                    notAssignedOrders: 1,
                    assignedOrders: 1,
                    pendingReviewOrders: 1,
                    verifiedOrders: 1,
                    paidOrders: 1,
                },
            },
        ]);
        periodData.reverse();
        res.status(200).json({
            summary: {
                totalOrders,
                notAssignedOrders,
                assignedOrders,
                pendingReviewOrders,
                verifiedOrders,
                paidOrders,
                totalSpent,
            },
            period,
            data: periodData,
        });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};
exports.getOrderAnalytics = getOrderAnalytics;
//# sourceMappingURL=order.controller.js.map