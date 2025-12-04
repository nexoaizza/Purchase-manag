"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoriesByFilter = void 0;
const category_model_1 = __importDefault(require("../models/category.model"));
const Delete_1 = require("../utils/Delete");
const crypto_1 = __importDefault(require("crypto"));
const blob_1 = require("../utils/blob");
/**
 * GET /api/categories
 * Optional query: name (regex match)
 */
const getCategoriesByFilter = async (req, res) => {
    try {
        const { name } = req.query;
        const query = {};
        if (name)
            query.name = { $regex: name, $options: "i" };
        const categories = await category_model_1.default.find(query).sort({ createdAt: -1 });
        res.status(200).json({ categories });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.getCategoriesByFilter = getCategoriesByFilter;
/**
 * POST /api/categories
 * Fields: name (required), description (optional), image (optional)
 */
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            res.status(400).json({ message: "Name is required" });
            return;
        }
        if (req.fileValidationError) {
            res.status(400).json({ message: req.fileValidationError });
            return;
        }
        let imageUrl = "";
        if (req.file) {
            const ext = (req.file.originalname.match(/\.[^/.]+$/) || [".bin"])[0];
            const unique = crypto_1.default.randomBytes(8).toString("hex");
            const key = `${Date.now()}-${unique}${ext}`;
            const uploaded = await (0, blob_1.uploadBufferToBlob)(key, req.file.buffer, req.file.mimetype);
            imageUrl = uploaded.url;
        }
        try {
            const newCategory = await category_model_1.default.create({
                name,
                description,
                image: imageUrl,
            });
            res.status(201).json({
                message: "Category created successfully",
                category: newCategory,
            });
        }
        catch (err) {
            if (err.code === 11000 && err.keyPattern?.name) {
                res.status(409).json({ message: "Category name must be unique" });
                return;
            }
            throw err;
        }
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.createCategory = createCategory;
/**
 * PUT /api/categories/:categoryId
 */
const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const { categoryId } = req.params;
        const category = await category_model_1.default.findById(categoryId);
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        if (req.fileValidationError) {
            res.status(400).json({ message: req.fileValidationError });
            return;
        }
        if (name)
            category.name = name;
        if (description !== undefined)
            category.description = description;
        if (req.file) {
            if (category.image && category.image.startsWith("/uploads/")) {
                try {
                    (0, Delete_1.deleteImage)(category.image);
                }
                catch (e) {
                    console.warn("Failed to delete legacy image:", e);
                }
            }
            const ext = (req.file.originalname.match(/\.[^/.]+$/) || [".bin"])[0];
            const unique = crypto_1.default.randomBytes(8).toString("hex");
            const key = `${Date.now()}-${unique}${ext}`;
            const uploaded = await (0, blob_1.uploadBufferToBlob)(key, req.file.buffer, req.file.mimetype);
            category.image = uploaded.url;
        }
        try {
            await category.save();
        }
        catch (err) {
            if (err.code === 11000 && err.keyPattern?.name) {
                res.status(409).json({ message: "Category name must be unique" });
                return;
            }
            throw err;
        }
        res.status(200).json({
            message: "Category updated successfully",
            category,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.updateCategory = updateCategory;
/**
 * DELETE /api/categories/:categoryId
 */
const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await category_model_1.default.findByIdAndDelete(categoryId);
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        // Delete legacy disk file only (blob deletion not implemented yet)
        if (category.image && category.image.startsWith("/uploads/")) {
            try {
                (0, Delete_1.deleteImage)(category.image);
            }
            catch (e) {
                console.warn("Failed to delete legacy image:", e);
            }
        }
        res.status(200).json({
            message: "Category deleted successfully",
            category,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", err: error.message });
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=category.controller.js.map