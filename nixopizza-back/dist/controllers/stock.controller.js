"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeItemFromStock = exports.addItemToStock = exports.deleteStock = exports.getStock = exports.getAllStocks = exports.updateStock = exports.createStock = void 0;
const stock_model_1 = __importDefault(require("../models/stock.model"));
const stock_item_model_1 = __importDefault(require("../models/stock-item.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
// CREATE
const createStock = async (req, res) => {
    try {
        const { name, description, location } = req.body;
        if (!name || !description || !location) {
            res.status(400).json({ message: "Missing required fields: name, description, location" });
            return;
        }
        const newStock = await stock_model_1.default.create({
            name,
            description,
            location,
            items: [],
        });
        res.status(201).json({ message: "Stock created successfully", stock: newStock });
    }
    catch (error) {
        console.error("Stock create error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.createStock = createStock;
// UPDATE
const updateStock = async (req, res) => {
    try {
        const { name, description, location } = req.body;
        const stock = await stock_model_1.default.findById(req.params.stockId);
        if (!stock) {
            res.status(404).json({ message: "Stock not found" });
            return;
        }
        if (name !== undefined)
            stock.name = name;
        if (description !== undefined)
            stock.description = description;
        if (location !== undefined)
            stock.location = location;
        await stock.save();
        res.status(200).json({ message: "Stock updated successfully", stock });
    }
    catch (error) {
        console.error("Stock update error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.updateStock = updateStock;
// GET ALL with pagination and filtering
const getAllStocks = async (req, res) => {
    try {
        const { name, location, items, itemName, sortBy, order, page = 1, limit = 10 } = req.query;
        if (Number(page) < 1 || Number(limit) < 1) {
            res.status(400).json({ message: "Page and limit must be greater than 0" });
            return;
        }
        const query = {};
        // Filter by location
        if (location) {
            query.location = { $regex: location, $options: "i" };
        }
        // Filter by name
        if (name) {
            query.name = { $regex: name, $options: "i" };
        }
        // Filter by items (check if stock contains specific item IDs)
        if (items) {
            const itemIds = Array.isArray(items) ? items : [items];
            query.items = { $in: itemIds };
        }
        // Filter by item product name
        if (itemName) {
            // Find products matching the name
            const products = await product_model_1.default.find({
                name: { $regex: itemName, $options: "i" }
            }).select("_id");
            const productIds = products.map(p => p._id);
            // Find stock items with those products
            const stockItems = await stock_item_model_1.default.find({
                product: { $in: productIds }
            }).select("stock");
            const stockIds = [...new Set(stockItems.map(item => item.stock.toString()))];
            // Add to query to filter stocks by those IDs
            if (stockIds.length > 0) {
                query._id = { $in: stockIds };
            }
            else {
                // If no matching products found, return empty result
                res.status(200).json({
                    total: 0,
                    pages: 0,
                    stocks: [],
                });
                return;
            }
        }
        const sortField = sortBy?.toString() || "createdAt";
        const sortOrder = order === "asc" ? 1 : -1;
        const skip = (Number(page) - 1) * Number(limit);
        const stocks = await stock_model_1.default.find(query)
            .populate({
            path: "items",
            populate: {
                path: "product",
                model: "Product",
            },
        })
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(Number(limit));
        const total = await stock_model_1.default.countDocuments(query);
        res.status(200).json({
            total,
            pages: Math.ceil(total / Number(limit)),
            stocks,
        });
    }
    catch (error) {
        console.error("Get stocks error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getAllStocks = getAllStocks;
// GET SINGLE
const getStock = async (req, res) => {
    try {
        const stock = await stock_model_1.default.findById(req.params.stockId).populate({
            path: "items",
            populate: {
                path: "product",
                model: "Product",
            },
        });
        if (!stock) {
            res.status(404).json({ message: "Stock not found" });
            return;
        }
        res.status(200).json({ stock });
    }
    catch (error) {
        console.error("Get stock error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getStock = getStock;
// DELETE
const deleteStock = async (req, res) => {
    try {
        const stock = await stock_model_1.default.findById(req.params.stockId);
        if (!stock) {
            res.status(404).json({ message: "Stock not found" });
            return;
        }
        // Delete all associated stock items
        if (stock.items && stock.items.length > 0) {
            await stock_item_model_1.default.deleteMany({ _id: { $in: stock.items } });
        }
        await stock_model_1.default.findByIdAndDelete(req.params.stockId);
        res.status(200).json({ message: "Stock and associated items deleted successfully" });
    }
    catch (error) {
        console.error("Delete stock error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.deleteStock = deleteStock;
// ADD ITEM TO STOCK
const addItemToStock = async (req, res) => {
    try {
        const { stockId } = req.params;
        const { product, price, quantity, expireAt } = req.body;
        if (!product || price === undefined || quantity === undefined) {
            res.status(400).json({ message: "Missing required fields: product, price, quantity" });
            return;
        }
        const stock = await stock_model_1.default.findById(stockId);
        if (!stock) {
            res.status(404).json({ message: "Stock not found" });
            return;
        }
        const newStockItem = await stock_item_model_1.default.create({
            stock: stockId,
            product,
            price: Number(price),
            quantity: Number(quantity),
            expireAt: expireAt || undefined,
        });
        stock.items.push(newStockItem._id);
        await stock.save();
        const populatedItem = await stock_item_model_1.default.findById(newStockItem._id).populate("product");
        res.status(201).json({
            message: "Item added to stock successfully",
            stockItem: populatedItem
        });
    }
    catch (error) {
        console.error("Add item to stock error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.addItemToStock = addItemToStock;
// REMOVE ITEM FROM STOCK
const removeItemFromStock = async (req, res) => {
    try {
        const { stockId, itemId } = req.params;
        const stock = await stock_model_1.default.findById(stockId);
        if (!stock) {
            res.status(404).json({ message: "Stock not found" });
            return;
        }
        const stockItem = await stock_item_model_1.default.findById(itemId);
        if (!stockItem) {
            res.status(404).json({ message: "Stock item not found" });
            return;
        }
        // Remove item reference from stock
        stock.items = stock.items.filter(item => item.toString() !== itemId);
        await stock.save();
        // Delete the stock item
        await stock_item_model_1.default.findByIdAndDelete(itemId);
        res.status(200).json({ message: "Item removed from stock successfully" });
    }
    catch (error) {
        console.error("Remove item from stock error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.removeItemFromStock = removeItemFromStock;
//# sourceMappingURL=stock.controller.js.map