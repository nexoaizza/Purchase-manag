"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.updateTemplate = exports.createTemplate = exports.getTemplate = exports.listTemplates = void 0;
const template_model_1 = __importDefault(require("../models/template.model"));
const supplier_model_1 = __importDefault(require("../models/supplier.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const listTemplates = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const query = { ownerId: req.user?.userId };
        if (req.query.search) {
            const s = String(req.query.search).trim();
            if (s)
                query.name = { $regex: s, $options: "i" };
        }
        const [items, total] = await Promise.all([
            template_model_1.default.find(query)
                .populate({ path: "items.productId", select: "name imageUrl barcode categoryId" })
                .populate({ path: "supplierId", select: "name image" })
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit),
            template_model_1.default.countDocuments(query),
        ]);
        res.json({ templates: items, total, pages: Math.ceil(total / limit) });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to list templates", error: err.message });
    }
};
exports.listTemplates = listTemplates;
const getTemplate = async (req, res) => {
    try {
        const tpl = await template_model_1.default.findOne({ _id: req.params.id, ownerId: req.user?.userId })
            .populate({ path: "items.productId", select: "name imageUrl barcode categoryId" })
            .populate({ path: "supplierId", select: "name image" });
        if (!tpl)
            return res.status(404).json({ message: "Template not found" });
        res.json({ template: tpl });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch template", error: err.message });
    }
};
exports.getTemplate = getTemplate;
const createTemplate = async (req, res) => {
    try {
        const { name, description, items, supplierId } = req.body;
        if (!name || !Array.isArray(items) || !supplierId) {
            return res.status(400).json({ message: "Name, supplierId and items are required" });
        }
        const supplier = await supplier_model_1.default.findById(supplierId);
        if (!supplier)
            return res.status(404).json({ message: "Supplier not found" });
        for (const it of items) {
            if (!it.productId || it.quantity == null || it.quantity < 0) {
                return res.status(400).json({ message: "Invalid item values" });
            }
            const product = await product_model_1.default.findById(it.productId).select("categoryId");
            if (!product)
                return res.status(404).json({ message: `Product not found: ${it.productId}` });
            const allowed = supplier.categoryIds.map(String);
            if (!allowed.includes(String(product.categoryId))) {
                return res.status(400).json({ message: "Product does not belong to supplier categories" });
            }
        }
        const tpl = await template_model_1.default.create({
            name,
            description,
            items,
            supplierId,
            ownerId: req.user?.userId,
        });
        res.status(201).json({ message: "Template created", template: tpl });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to create template", error: err.message });
    }
};
exports.createTemplate = createTemplate;
const updateTemplate = async (req, res) => {
    try {
        const { name, description, items, supplierId } = req.body;
        const tpl = await template_model_1.default.findOne({ _id: req.params.id, ownerId: req.user?.userId });
        if (!tpl)
            return res.status(404).json({ message: "Template not found" });
        if (name !== undefined)
            tpl.name = name;
        if (description !== undefined)
            tpl.description = description;
        if (supplierId !== undefined) {
            const supplier = await supplier_model_1.default.findById(supplierId);
            if (!supplier)
                return res.status(404).json({ message: "Supplier not found" });
            tpl.supplierId = supplier._id;
            if (items === undefined) {
                // still validate existing items against new supplier
                for (const it of tpl.items) {
                    const product = await product_model_1.default.findById(it.productId).select("categoryId");
                    if (!product)
                        return res.status(404).json({ message: "Product not found in existing items" });
                    const allowed = supplier.categoryIds.map(String);
                    if (!allowed.includes(String(product.categoryId))) {
                        return res.status(400).json({ message: "Existing item not allowed for new supplier" });
                    }
                }
            }
        }
        if (items !== undefined) {
            for (const it of items) {
                if (!it.productId || it.quantity == null || it.quantity < 0) {
                    return res.status(400).json({ message: "Invalid item values" });
                }
                const supplier = await supplier_model_1.default.findById(supplierId ?? tpl.supplierId);
                if (!supplier)
                    return res.status(404).json({ message: "Supplier not found" });
                const product = await product_model_1.default.findById(it.productId).select("categoryId");
                if (!product)
                    return res.status(404).json({ message: `Product not found: ${it.productId}` });
                const allowed = supplier.categoryIds.map(String);
                if (!allowed.includes(String(product.categoryId))) {
                    return res.status(400).json({ message: "Product does not belong to supplier categories" });
                }
            }
            tpl.items = items;
        }
        await tpl.save();
        const populated = await template_model_1.default.findById(tpl._id)
            .populate({ path: "items.productId", select: "name imageUrl barcode" });
        res.json({ message: "Template updated", template: populated });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update template", error: err.message });
    }
};
exports.updateTemplate = updateTemplate;
const deleteTemplate = async (req, res) => {
    try {
        const tpl = await template_model_1.default.findOneAndDelete({ _id: req.params.id, ownerId: req.user?.userId });
        if (!tpl)
            return res.status(404).json({ message: "Template not found" });
        res.json({ message: "Template deleted" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete template", error: err.message });
    }
};
exports.deleteTemplate = deleteTemplate;
//# sourceMappingURL=template.controller.js.map