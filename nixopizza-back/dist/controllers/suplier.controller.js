"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSupplier = exports.createSupplier = exports.getSupplierById = exports.getSuppliers = void 0;
const supplier_model_1 = __importDefault(require("../models/supplier.model"));
const crypto_1 = __importDefault(require("crypto"));
const blob_1 = require("../utils/blob");
const Delete_1 = require("../utils/Delete");
/**
 * Normalize email: empty -> undefined
 */
const normalizeEmail = (value) => {
    if (!value)
        return undefined;
    const t = String(value).trim();
    return t === "" ? undefined : t.toLowerCase();
};
/**
 * GET /api/suppliers
 */
const getSuppliers = async (_req, res) => {
    try {
        const suppliers = await supplier_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({ suppliers });
    }
    catch (e) {
        res.status(500).json({ message: "Internal server error", error: e.message });
    }
};
exports.getSuppliers = getSuppliers;
/**
 * GET /api/suppliers/:supplierId
 */
const getSupplierById = async (req, res) => {
    try {
        const supplier = await supplier_model_1.default.findById(req.params.supplierId);
        if (!supplier) {
            res.status(404).json({ message: "Supplier not found" });
            return;
        }
        res.status(200).json({ supplier });
    }
    catch (e) {
        res.status(500).json({ message: "Internal server error", error: e.message });
    }
};
exports.getSupplierById = getSupplierById;
/**
 * POST /api/suppliers
 * Email optional, duplicates allowed.
 */
const createSupplier = async (req, res) => {
    try {
        const { name, contactPerson, email, phone1, phone2, phone3, address, city, notes, isActive, categoryIds, } = req.body;
        if (!name || !contactPerson || !phone1 || !address) {
            res.status(400).json({ message: "Missing required fields: name, contactPerson, phone1, address" });
            return;
        }
        const normalizedEmail = normalizeEmail(email);
        let imageUrl;
        if (req.file) {
            const ext = (req.file.originalname.match(/\.[^/.]+$/) || [".bin"])[0];
            const key = `${Date.now()}-${crypto_1.default.randomBytes(6).toString("hex")}${ext}`;
            const uploaded = await (0, blob_1.uploadBufferToBlob)(key, req.file.buffer, req.file.mimetype);
            imageUrl = uploaded.url;
        }
        const supplier = await supplier_model_1.default.create({
            name,
            contactPerson,
            email: normalizedEmail,
            phone1,
            phone2: phone2 || undefined,
            phone3: phone3 || undefined,
            address,
            city: city || undefined,
            notes: notes || undefined,
            isActive: isActive !== undefined ? isActive : true,
            categoryIds: Array.isArray(categoryIds) ? categoryIds : [],
            image: imageUrl,
        });
        res.status(201).json({ message: "Supplier created successfully", supplier });
    }
    catch (e) {
        // No uniqueness conflict expected now
        res.status(500).json({ message: "Internal server error", error: e.message });
    }
};
exports.createSupplier = createSupplier;
/**
 * PUT /api/suppliers/:supplierId
 * Removing email (blank) sets it to undefined.
 */
const updateSupplier = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const { name, contactPerson, email, phone1, phone2, phone3, address, city, notes, isActive, categoryIds, removeEmail, } = req.body;
        const supplier = await supplier_model_1.default.findById(supplierId);
        if (!supplier) {
            res.status(404).json({ message: "Supplier not found" });
            return;
        }
        const normalizedEmail = normalizeEmail(email);
        if (removeEmail === "true" || (!normalizedEmail && supplier.email)) {
            supplier.email = undefined;
        }
        else if (normalizedEmail) {
            supplier.email = normalizedEmail;
        }
        if (name)
            supplier.name = name;
        if (contactPerson)
            supplier.contactPerson = contactPerson;
        if (phone1)
            supplier.phone1 = phone1;
        supplier.phone2 = phone2 ? phone2 : undefined;
        supplier.phone3 = phone3 ? phone3 : undefined;
        if (address)
            supplier.address = address;
        supplier.city = city ? city : undefined;
        supplier.notes = notes ? notes : undefined;
        if (isActive !== undefined)
            supplier.isActive = isActive === "true" || isActive === true;
        if (categoryIds !== undefined) {
            supplier.categoryIds = Array.isArray(categoryIds)
                ? categoryIds
                : [categoryIds].filter(Boolean);
        }
        if (req.file) {
            if (supplier.image && supplier.image.startsWith("/uploads/")) {
                try {
                    (0, Delete_1.deleteImage)(supplier.image);
                }
                catch (err) {
                    console.warn("Failed to delete legacy image:", err);
                }
            }
            const ext = (req.file.originalname.match(/\.[^/.]+$/) || [".bin"])[0];
            const key = `${Date.now()}-${crypto_1.default.randomBytes(6).toString("hex")}${ext}`;
            const uploaded = await (0, blob_1.uploadBufferToBlob)(key, req.file.buffer, req.file.mimetype);
            supplier.image = uploaded.url;
        }
        await supplier.save();
        res.status(200).json({ message: "Supplier updated successfully", supplier });
    }
    catch (e) {
        res.status(500).json({ message: "Internal server error", error: e.message });
    }
};
exports.updateSupplier = updateSupplier;
//# sourceMappingURL=suplier.controller.js.map