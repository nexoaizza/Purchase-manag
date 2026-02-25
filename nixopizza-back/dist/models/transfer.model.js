"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const transferSchema = new mongoose_1.Schema({
    items: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "StockItem",
            required: [true, "At least one stock item is required"],
        },
    ],
    takenFrom: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Stock",
        required: [true, "Source stock is required"],
    },
    takenTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Stock",
        required: [true, "Destination stock is required"],
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity must be at least 1"],
    },
    status: {
        type: String,
        enum: ["pending", "arrived"],
        default: "pending",
        required: true,
    },
}, { timestamps: true });
// Add index for better query performance
transferSchema.index({ status: 1, createdAt: -1 });
transferSchema.index({ takenFrom: 1, takenTo: 1 });
const Transfer = (0, mongoose_1.model)("Transfer", transferSchema);
exports.default = Transfer;
//# sourceMappingURL=transfer.model.js.map