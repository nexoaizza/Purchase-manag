"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const supplierSchema = new mongoose_1.Schema({
    name: { type: String, required: [true, "Shop Name Is Required"], trim: true },
    contactPerson: { type: String, required: [true, "Contact Person Name Is Required"], trim: true },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        // NO uniqueness, NO index. Validation only if provided.
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
            "Please fill a valid email address",
        ],
        set: (v) => (v && v.trim() !== "" ? v.trim().toLowerCase() : undefined),
    },
    phone1: { type: String, required: [true, "Phone Number Is Required"], trim: true },
    phone2: { type: String, trim: true },
    phone3: { type: String, trim: true },
    address: { type: String, required: [true, "Address Is Required"], trim: true },
    city: { type: String, trim: true },
    image: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    categoryIds: { type: [mongoose_1.Schema.Types.ObjectId], ref: "Category", default: [] },
}, { timestamps: true });
const Supplier = (0, mongoose_1.model)("Supplier", supplierSchema);
exports.default = Supplier;
//# sourceMappingURL=supplier.model.js.map