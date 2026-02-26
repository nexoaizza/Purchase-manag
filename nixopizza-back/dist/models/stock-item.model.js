"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const stockItemSchema = new mongoose_1.Schema({
    stock: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Stock",
        required: [true, "Stock is required"],
    },
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Product is required"],
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price must be positive"],
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [0, "Quantity must be positive"],
    },
    expireAt: {
        type: Date,
        required: false,
    },
}, { timestamps: true });
const StockItem = (0, mongoose_1.model)("StockItem", stockItemSchema);
exports.default = StockItem;
//# sourceMappingURL=stock-item.model.js.map