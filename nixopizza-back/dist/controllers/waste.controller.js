"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWasteStatsByReason = exports.getWasteStatsByProduct = exports.deleteWaste = exports.updateWaste = exports.getWasteById = exports.getAllWastes = exports.createWaste = void 0;
const waste_model_1 = __importDefault(require("../models/waste.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const stock_model_1 = __importDefault(require("../models/stock.model"));
// CREATE - Add a record when stock is discarded or expired
const createWaste = async (req, res) => {
    try {
        const { product, quantity, reason, stock, staff } = req.body;
        // Validation
        if (!product) {
            res.status(400).json({ message: "Product is required" });
            return;
        }
        if (!quantity || quantity < 1) {
            res.status(400).json({ message: "Quantity must be at least 1" });
            return;
        }
        if (!reason || !reason.trim()) {
            res.status(400).json({ message: "Reason is required" });
            return;
        }
        // Verify product exists
        const productExists = await product_model_1.default.findById(product);
        if (!productExists) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        // Verify stock exists if provided
        if (stock) {
            const stockExists = await stock_model_1.default.findById(stock);
            if (!stockExists) {
                res.status(404).json({ message: "Stock not found" });
                return;
            }
        }
        const newWaste = await waste_model_1.default.create({
            product,
            quantity,
            reason: reason.trim(),
            stock,
            staff,
        });
        const populatedWaste = await waste_model_1.default.findById(newWaste._id)
            .populate("product", "name description")
            .populate("stock", "name location")
            .populate("staff", "name email");
        res.status(201).json({
            message: "Waste record created successfully",
            waste: populatedWaste,
        });
    }
    catch (error) {
        console.error("Waste create error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.createWaste = createWaste;
// READ - Get all waste records with pagination, filtering, and sorting
const getAllWastes = async (req, res) => {
    try {
        const { product, productName, reason, stock, staff, dateFrom, dateTo, sortBy = "newest", page = 1, limit = 10, } = req.query;
        if (Number(page) < 1 || Number(limit) < 1) {
            res.status(400).json({ message: "Page and limit must be greater than 0" });
            return;
        }
        const query = {};
        // Filter by product ID
        if (product) {
            query.product = product;
        }
        // Filter by product name
        if (productName) {
            const products = await product_model_1.default.find({
                name: { $regex: productName, $options: "i" },
            }).select("_id");
            const productIds = products.map((p) => p._id);
            if (productIds.length > 0) {
                query.product = { $in: productIds };
            }
            else {
                // No matching products found, return empty result
                res.status(200).json({
                    wastes: [],
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
        // Filter by reason (case-insensitive partial match)
        if (reason) {
            query.reason = { $regex: reason, $options: "i" };
        }
        // Filter by stock location
        if (stock) {
            query.stock = stock;
        }
        // Filter by staff
        if (staff) {
            query.staff = staff;
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
        // Sorting
        let sortOption = {};
        switch (sortBy) {
            case "newest":
                sortOption = { createdAt: -1 };
                break;
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "product":
                sortOption = { product: 1, createdAt: -1 };
                break;
            case "reason":
                sortOption = { reason: 1, createdAt: -1 };
                break;
            case "quantity_desc":
                sortOption = { quantity: -1 };
                break;
            case "quantity_asc":
                sortOption = { quantity: 1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [wastes, totalItems] = await Promise.all([
            waste_model_1.default.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(Number(limit))
                .populate("product", "name description")
                .populate("stock", "name location")
                .populate("staff", "name email"),
            waste_model_1.default.countDocuments(query),
        ]);
        const totalPages = Math.ceil(totalItems / Number(limit));
        res.status(200).json({
            wastes,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalItems,
                itemsPerPage: Number(limit),
            },
        });
    }
    catch (error) {
        console.error("Waste getAll error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getAllWastes = getAllWastes;
// READ - Get single waste record by ID
const getWasteById = async (req, res) => {
    try {
        const { wasteId } = req.params;
        const waste = await waste_model_1.default.findById(wasteId)
            .populate("product", "name description")
            .populate("stock", "name location description")
            .populate("staff", "name email");
        if (!waste) {
            res.status(404).json({ message: "Waste record not found" });
            return;
        }
        res.status(200).json({ waste });
    }
    catch (error) {
        console.error("Waste getById error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getWasteById = getWasteById;
// UPDATE - Edit reason or quantity if mistake found
const updateWaste = async (req, res) => {
    try {
        const { wasteId } = req.params;
        const { quantity, reason, stock, staff } = req.body;
        const waste = await waste_model_1.default.findById(wasteId);
        if (!waste) {
            res.status(404).json({ message: "Waste record not found" });
            return;
        }
        // Update quantity if provided
        if (quantity !== undefined) {
            if (quantity < 1) {
                res.status(400).json({ message: "Quantity must be at least 1" });
                return;
            }
            waste.quantity = quantity;
        }
        // Update reason if provided
        if (reason !== undefined) {
            if (!reason.trim()) {
                res.status(400).json({ message: "Reason cannot be empty" });
                return;
            }
            waste.reason = reason.trim();
        }
        // Update stock if provided
        if (stock !== undefined) {
            if (stock) {
                const stockExists = await stock_model_1.default.findById(stock);
                if (!stockExists) {
                    res.status(404).json({ message: "Stock not found" });
                    return;
                }
            }
            waste.stock = stock;
        }
        // Update staff if provided
        if (staff !== undefined) {
            waste.staff = staff;
        }
        await waste.save();
        const updatedWaste = await waste_model_1.default.findById(wasteId)
            .populate("product", "name description")
            .populate("stock", "name location")
            .populate("staff", "name email");
        res.status(200).json({
            message: "Waste record updated successfully",
            waste: updatedWaste,
        });
    }
    catch (error) {
        console.error("Waste update error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.updateWaste = updateWaste;
// DELETE - Delete a waste record
const deleteWaste = async (req, res) => {
    try {
        const { wasteId } = req.params;
        const waste = await waste_model_1.default.findById(wasteId);
        if (!waste) {
            res.status(404).json({ message: "Waste record not found" });
            return;
        }
        await waste_model_1.default.findByIdAndDelete(wasteId);
        res.status(200).json({ message: "Waste record deleted successfully" });
    }
    catch (error) {
        console.error("Waste delete error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.deleteWaste = deleteWaste;
// Get waste statistics by product
const getWasteStatsByProduct = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        const matchQuery = {};
        // Filter by date range if provided
        if (dateFrom || dateTo) {
            matchQuery.createdAt = {};
            if (dateFrom) {
                matchQuery.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                matchQuery.createdAt.$lte = new Date(dateTo);
            }
        }
        const stats = await waste_model_1.default.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: "$product",
                    totalQuantity: { $sum: "$quantity" },
                    count: { $sum: 1 },
                    reasons: { $push: "$reason" },
                },
            },
            { $sort: { totalQuantity: -1 } },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            { $unwind: "$productDetails" },
            {
                $project: {
                    product: {
                        _id: "$productDetails._id",
                        name: "$productDetails.name",
                        description: "$productDetails.description",
                    },
                    totalQuantity: 1,
                    count: 1,
                    reasons: 1,
                },
            },
        ]);
        res.status(200).json({ stats });
    }
    catch (error) {
        console.error("Waste stats error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getWasteStatsByProduct = getWasteStatsByProduct;
// Get waste statistics by reason
const getWasteStatsByReason = async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        const matchQuery = {};
        // Filter by date range if provided
        if (dateFrom || dateTo) {
            matchQuery.createdAt = {};
            if (dateFrom) {
                matchQuery.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                matchQuery.createdAt.$lte = new Date(dateTo);
            }
        }
        const stats = await waste_model_1.default.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: "$reason",
                    totalQuantity: { $sum: "$quantity" },
                    count: { $sum: 1 },
                    products: { $addToSet: "$product" },
                },
            },
            { $sort: { totalQuantity: -1 } },
            {
                $project: {
                    reason: "$_id",
                    totalQuantity: 1,
                    count: 1,
                    productCount: { $size: "$products" },
                },
            },
        ]);
        res.status(200).json({ stats });
    }
    catch (error) {
        console.error("Waste stats by reason error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getWasteStatsByReason = getWasteStatsByReason;
//# sourceMappingURL=waste.controller.js.map