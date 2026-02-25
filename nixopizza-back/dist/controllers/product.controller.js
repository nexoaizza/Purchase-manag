"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.getProduct = exports.getAllProducts = exports.updateProduct = exports.createProduct = void 0;
const product_model_1 = __importDefault(require("../models/product.model"));
const Delete_1 = require("../utils/Delete");
const crypto_1 = __importDefault(require("crypto"));
const blob_1 = require("../utils/blob");
const mongoose_1 = require("mongoose");
// CREATE
const createProduct = async (req, res) => {
    try {
        const { name, barcode, unit, categoryId, description, minQty, recommendedQty, expectedLifeTime, } = req.body;
        console.log(req.body);
        if (!name || !unit || !categoryId || minQty === undefined) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        if (req.fileValidationError) {
            res.status(400).json({ message: req.fileValidationError });
            return;
        }
        let imageUrl;
        if (req.file) {
            const ext = (req.file.originalname.match(/\.[^/.]+$/) || [".bin"])[0];
            const unique = crypto_1.default.randomBytes(8).toString("hex");
            const key = `${Date.now()}-${unique}${ext}`;
            const uploaded = await (0, blob_1.uploadBufferToBlob)(key, req.file.buffer, req.file.mimetype);
            imageUrl = uploaded.url;
        }
        try {
            const newProduct = await product_model_1.default.create({
                name,
                barcode,
                unit,
                categoryId,
                description,
                minQty: Number(minQty),
                imageUrl,
                recommendedQty: recommendedQty ? Number(recommendedQty) : 0,
                expectedLifeTime: expectedLifeTime ? Number(expectedLifeTime) : undefined,
            });
            res.status(201).json({ message: "Product created successfully", product: newProduct });
        }
        catch (err) {
            if (err.code === 11000 && err.keyPattern?.name) {
                res.status(409).json({ message: "Product name must be unique" });
                return;
            }
            throw err;
        }
    }
    catch (error) {
        console.error("Product create error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.createProduct = createProduct;
// UPDATE
const updateProduct = async (req, res) => {
    try {
        const { name, barcode, unit, categoryId, description, minQty, recommendedQty, expectedLifeTime, } = req.body;
        const product = await product_model_1.default.findById(req.params.productId);
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        if (req.fileValidationError) {
            res.status(400).json({ message: req.fileValidationError });
            return;
        }
        if (name)
            product.name = name;
        if (barcode)
            product.barcode = barcode;
        if (unit)
            product.unit = unit;
        if (categoryId)
            product.categoryId = categoryId;
        if (description !== undefined)
            product.description = description;
        if (minQty !== undefined)
            product.minQty = Number(minQty);
        if (recommendedQty !== undefined)
            product.recommendedQty = Number(recommendedQty);
        if (expectedLifeTime !== undefined)
            product.expectedLifeTime = expectedLifeTime ? Number(expectedLifeTime) : undefined;
        // Handle image removal
        if (req.body.removeImage === "true") {
            if (product.imageUrl && product.imageUrl.startsWith("/uploads/")) {
                try {
                    (0, Delete_1.deleteImage)(product.imageUrl);
                }
                catch (e) {
                    console.warn("Failed to delete legacy product image:", e);
                }
            }
            product.imageUrl = undefined;
        }
        // Handle new image upload
        else if (req.file) {
            if (product.imageUrl && product.imageUrl.startsWith("/uploads/")) {
                try {
                    (0, Delete_1.deleteImage)(product.imageUrl);
                }
                catch (e) {
                    console.warn("Failed to delete legacy product image:", e);
                }
            }
            const ext = (req.file.originalname.match(/\.[^/.]+$/) || [".bin"])[0];
            const unique = crypto_1.default.randomBytes(8).toString("hex");
            const key = `${Date.now()}-${unique}${ext}`;
            const uploaded = await (0, blob_1.uploadBufferToBlob)(key, req.file.buffer, req.file.mimetype);
            product.imageUrl = uploaded.url;
        }
        else if (req.body.removeImage === "true") {
            if (product.imageUrl && product.imageUrl.startsWith("/uploads/")) {
                try {
                    (0, Delete_1.deleteImage)(product.imageUrl);
                }
                catch (e) {
                    console.warn("Failed to delete legacy product image:", e);
                }
            }
            product.imageUrl = undefined;
        }
        try {
            await product.save();
        }
        catch (err) {
            if (err.code === 11000 && err.keyPattern?.name) {
                res.status(409).json({ message: "Product name must be unique" });
                return;
            }
            throw err;
        }
        res.status(200).json({ message: "Product updated successfully", product });
    }
    catch (error) {
        console.error("Product update error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.updateProduct = updateProduct;
// GET ALL
const getAllProducts = async (req, res) => {
    try {
        const { name, categoryId, categoryIds, sortBy, order, page = 1, limit = 10 } = req.query;
        if (Number(page) < 1 || Number(limit) < 1) {
            res.status(400).json({ message: "Page and limit must be greater than 0" });
            return;
        }
        const query = {};
        if (name) {
            query.$or = [
                { name: { $regex: name, $options: "i" } },
                { description: { $regex: name, $options: "i" } },
                { barcode: { $regex: name, $options: "i" } },
            ];
        }
        // Filter by multiple category IDs
        if (categoryIds && typeof categoryIds === 'string') {
            const categoryIdArray = categoryIds
                .split(',')
                .map(id => id.trim())
                .filter(id => id && mongoose_1.Types.ObjectId.isValid(id));
            if (categoryIdArray.length > 0) {
                query.categoryId = { $in: categoryIdArray };
            }
        }
        // Filter by single category ID (backward compatibility)
        else if (categoryId && typeof categoryId === 'string' && mongoose_1.Types.ObjectId.isValid(categoryId)) {
            query.categoryId = categoryId;
        }
        const sortField = sortBy?.toString() || "createdAt";
        const sortOrder = order === "asc" ? 1 : -1;
        const skip = (Number(page) - 1) * Number(limit);
        const products = await product_model_1.default.find(query)
            .populate("categoryId")
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(Number(limit));
        const total = await product_model_1.default.countDocuments(query);
        res.status(200).json({
            total,
            pages: Math.ceil(total / Number(limit)),
            products,
        });
    }
    catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getAllProducts = getAllProducts;
// GET SINGLE
const getProduct = async (req, res) => {
    try {
        const product = await product_model_1.default.findById(req.params.productId).populate("categoryId");
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        res.status(200).json({ product });
    }
    catch (error) {
        console.error("Get product error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getProduct = getProduct;
// DELETE
const deleteProduct = async (req, res) => {
    try {
        const product = await product_model_1.default.findByIdAndDelete(req.params.productId);
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        if (product.imageUrl && product.imageUrl.startsWith("/uploads/")) {
            try {
                (0, Delete_1.deleteImage)(product.imageUrl);
            }
            catch (e) {
                console.warn("Failed to delete legacy product image:", e);
            }
        }
        res.status(200).json({ message: "Product deleted successfully" });
    }
    catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=product.controller.js.map