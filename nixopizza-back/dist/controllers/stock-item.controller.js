"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpiringSoonStockItems = exports.getExpiredStockItems = exports.deleteStockItem = exports.getStockItem = exports.getAllStockItems = exports.updateStockItem = exports.createMultipleStockItems = exports.createStockItem = void 0;
const stock_item_model_1 = __importDefault(require("../models/stock-item.model"));
const stock_model_1 = __importDefault(require("../models/stock.model"));
// CREATE
const createStockItem = async (req, res) => {
    try {
        const { stock, product, price, quantity, expireAt } = req.body;
        if (!stock || !product || price === undefined || quantity === undefined) {
            res.status(400).json({ message: "Missing required fields: stock, product, price, quantity" });
            return;
        }
        // Verify stock exists
        const stockDoc = await stock_model_1.default.findById(stock);
        if (!stockDoc) {
            res.status(404).json({ message: "Stock not found" });
            return;
        }
        const newStockItem = await stock_item_model_1.default.create({
            stock,
            product,
            price: Number(price),
            quantity: Number(quantity),
            expireAt: expireAt || undefined,
        });
        // Add item to stock's items array
        stockDoc.items.push(newStockItem._id);
        await stockDoc.save();
        const populatedItem = await stock_item_model_1.default.findById(newStockItem._id)
            .populate("product")
            .populate("stock");
        res.status(201).json({ message: "Stock item created successfully", stockItem: populatedItem });
    }
    catch (error) {
        console.error("Stock item create error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.createStockItem = createStockItem;
// CREATE MULTIPLE
const createMultipleStockItems = async (req, res) => {
    try {
        const { stockId, items } = req.body;
        if (!stockId) {
            res.status(400).json({ message: "Missing required field: stockId" });
            return;
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ message: "Missing required field: items (must be a non-empty array)" });
            return;
        }
        // Verify stock exists
        const stockDoc = await stock_model_1.default.findById(stockId);
        if (!stockDoc) {
            res.status(404).json({ message: "Stock not found" });
            return;
        }
        // Validate all items
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.product || item.price === undefined || item.quantity === undefined) {
                res.status(400).json({
                    message: `Item at index ${i} is missing required fields: product, price, quantity`
                });
                return;
            }
        }
        const createdItems = [];
        // Process each item
        for (const item of items) {
            const { product, price, quantity, expireAt } = item;
            const newStockItem = await stock_item_model_1.default.create({
                stock: stockId,
                product,
                price: Number(price),
                quantity: Number(quantity),
                expireAt: expireAt || undefined,
            });
            // Add item to stock's items array
            stockDoc.items.push(newStockItem._id);
            createdItems.push(newStockItem);
        }
        // Save stock with all new items
        await stockDoc.save();
        // Populate all created items
        const populatedItems = await stock_item_model_1.default.find({
            _id: { $in: createdItems.map(item => item._id) }
        })
            .populate("product")
            .populate("stock");
        res.status(201).json({
            message: `${createdItems.length} stock items created successfully`,
            stockItems: populatedItems,
            count: createdItems.length
        });
    }
    catch (error) {
        console.error("Create multiple stock items error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.createMultipleStockItems = createMultipleStockItems;
// UPDATE
const updateStockItem = async (req, res) => {
    try {
        const { price, quantity, expireAt } = req.body;
        const stockItem = await stock_item_model_1.default.findById(req.params.stockItemId);
        if (!stockItem) {
            res.status(404).json({ message: "Stock item not found" });
            return;
        }
        if (price !== undefined)
            stockItem.price = Number(price);
        if (quantity !== undefined)
            stockItem.quantity = Number(quantity);
        if (expireAt !== undefined)
            stockItem.expireAt = expireAt;
        await stockItem.save();
        const populatedItem = await stock_item_model_1.default.findById(stockItem._id)
            .populate("product")
            .populate("stock");
        res.status(200).json({ message: "Stock item updated successfully", stockItem: populatedItem });
    }
    catch (error) {
        console.error("Stock item update error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.updateStockItem = updateStockItem;
// GET ALL with pagination and filtering
const getAllStockItems = async (req, res) => {
    try {
        const { location, product, stock, minQuantity, maxQuantity, createdAtFrom, createdAtTo, expireAtFrom, expireAtTo, sortBy, order, page = 1, limit = 10 } = req.query;
        if (Number(page) < 1 || Number(limit) < 1) {
            res.status(400).json({ message: "Page and limit must be greater than 0" });
            return;
        }
        const query = {};
        // Filter by product
        if (product) {
            query.product = product;
        }
        // Filter by stock
        if (stock) {
            query.stock = stock;
        }
        // Filter by quantity range
        if (minQuantity !== undefined || maxQuantity !== undefined) {
            query.quantity = {};
            if (minQuantity !== undefined)
                query.quantity.$gte = Number(minQuantity);
            if (maxQuantity !== undefined)
                query.quantity.$lte = Number(maxQuantity);
        }
        // Filter by createdAt date range
        if (createdAtFrom !== undefined || createdAtTo !== undefined) {
            query.createdAt = {};
            if (createdAtFrom)
                query.createdAt.$gte = new Date(createdAtFrom);
            if (createdAtTo)
                query.createdAt.$lte = new Date(createdAtTo);
        }
        // Filter by expireAt date range
        if (expireAtFrom !== undefined || expireAtTo !== undefined) {
            query.expireAt = {};
            if (expireAtFrom)
                query.expireAt.$gte = new Date(expireAtFrom);
            if (expireAtTo)
                query.expireAt.$lte = new Date(expireAtTo);
        }
        const sortField = sortBy?.toString() || "createdAt";
        const sortOrder = order === "asc" ? 1 : -1;
        const skip = (Number(page) - 1) * Number(limit);
        let stockItems = await stock_item_model_1.default.find(query)
            .populate("product")
            .populate("stock")
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(Number(limit));
        // Filter by location (after populating stock)
        if (location) {
            stockItems = stockItems.filter((item) => {
                if (item.stock && item.stock.location) {
                    return item.stock.location.toLowerCase().includes(location.toLowerCase());
                }
                return false;
            });
        }
        const total = await stock_item_model_1.default.countDocuments(query);
        res.status(200).json({
            total: location ? stockItems.length : total,
            pages: Math.ceil((location ? stockItems.length : total) / Number(limit)),
            stockItems,
        });
    }
    catch (error) {
        console.error("Get stock items error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getAllStockItems = getAllStockItems;
// GET SINGLE
const getStockItem = async (req, res) => {
    try {
        const stockItem = await stock_item_model_1.default.findById(req.params.stockItemId)
            .populate("product")
            .populate("stock");
        if (!stockItem) {
            res.status(404).json({ message: "Stock item not found" });
            return;
        }
        res.status(200).json({ stockItem });
    }
    catch (error) {
        console.error("Get stock item error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getStockItem = getStockItem;
// DELETE
const deleteStockItem = async (req, res) => {
    try {
        const stockItem = await stock_item_model_1.default.findById(req.params.stockItemId);
        if (!stockItem) {
            res.status(404).json({ message: "Stock item not found" });
            return;
        }
        // Remove item reference from stock
        const stock = await stock_model_1.default.findById(stockItem.stock);
        if (stock) {
            stock.items = stock.items.filter(item => item.toString() !== req.params.stockItemId);
            await stock.save();
        }
        await stock_item_model_1.default.findByIdAndDelete(req.params.stockItemId);
        res.status(200).json({ message: "Stock item deleted successfully" });
    }
    catch (error) {
        console.error("Delete stock item error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.deleteStockItem = deleteStockItem;
// GET EXPIRED ITEMS
const getExpiredStockItems = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        if (Number(page) < 1 || Number(limit) < 1) {
            res.status(400).json({ message: "Page and limit must be greater than 0" });
            return;
        }
        const now = new Date();
        // Get all stock items with product populated
        const allStockItems = await stock_item_model_1.default.find()
            .populate("product")
            .populate("stock")
            .sort({ createdAt: 1 });
        // Filter items that are expired based on expectedLifeTime
        const expiredItems = allStockItems.filter((item) => {
            if (!item.product || !item.product.expectedLifeTime || item.product.expectedLifeTime <= 0) {
                return false; // Skip items without expectedLifeTime
            }
            const createdAt = new Date(item.createdAt);
            const expectedLifeTimeDays = item.product.expectedLifeTime;
            const expirationDate = new Date(createdAt);
            expirationDate.setDate(expirationDate.getDate() + expectedLifeTimeDays);
            return now > expirationDate; // Expired if current date is past expiration
        });
        // Apply pagination
        const skip = (Number(page) - 1) * Number(limit);
        const paginatedItems = expiredItems.slice(skip, skip + Number(limit));
        res.status(200).json({
            total: expiredItems.length,
            pages: Math.ceil(expiredItems.length / Number(limit)),
            stockItems: paginatedItems,
        });
    }
    catch (error) {
        console.error("Get expired stock items error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getExpiredStockItems = getExpiredStockItems;
// GET EXPIRING SOON ITEMS
const getExpiringSoonStockItems = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        if (Number(page) < 1 || Number(limit) < 1) {
            res.status(400).json({ message: "Page and limit must be greater than 0" });
            return;
        }
        const now = new Date();
        // Get all stock items with product populated
        const allStockItems = await stock_item_model_1.default.find()
            .populate("product")
            .populate("stock")
            .sort({ createdAt: 1 });
        // Filter items that are expiring soon (>70% of lifetime passed but not yet expired)
        const expiringSoonItems = allStockItems.filter((item) => {
            if (!item.product || !item.product.expectedLifeTime || item.product.expectedLifeTime <= 0) {
                return false; // Skip items without expectedLifeTime
            }
            const createdAt = new Date(item.createdAt);
            const expectedLifeTimeDays = item.product.expectedLifeTime;
            const expirationDate = new Date(createdAt);
            expirationDate.setDate(expirationDate.getDate() + expectedLifeTimeDays);
            // Calculate how much time has passed
            const timeElapsedMs = now.getTime() - createdAt.getTime();
            const totalLifetimeMs = expectedLifeTimeDays * 24 * 60 * 60 * 1000;
            const percentagePassed = timeElapsedMs / totalLifetimeMs;
            // Expiring soon if >70% passed and not yet expired
            return percentagePassed > 0.7 && now <= expirationDate;
        });
        // Apply pagination
        const skip = (Number(page) - 1) * Number(limit);
        const paginatedItems = expiringSoonItems.slice(skip, skip + Number(limit));
        res.status(200).json({
            total: expiringSoonItems.length,
            pages: Math.ceil(expiringSoonItems.length / Number(limit)),
            stockItems: paginatedItems,
        });
    }
    catch (error) {
        console.error("Get expiring soon stock items error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getExpiringSoonStockItems = getExpiringSoonStockItems;
//# sourceMappingURL=stock-item.controller.js.map