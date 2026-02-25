"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const wasteSchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Product is required"],
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity must be at least 1"],
    },
    reason: {
        type: String,
        required: [true, "Reason is required"],
        trim: true,
    },
    stock: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Stock",
        required: false,
    },
    staff: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
}, { timestamps: true });
// Add indexes for better query performance
wasteSchema.index({ product: 1, createdAt: -1 });
wasteSchema.index({ reason: 1 });
wasteSchema.index({ stock: 1 });
wasteSchema.index({ createdAt: -1 });
const Waste = (0, mongoose_1.model)("Waste", wasteSchema);
exports.default = Waste;
//# sourceMappingURL=waste.model.js.map