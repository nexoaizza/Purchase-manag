"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const stockSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Stock name is required"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Stock description is required"],
        trim: true,
    },
    location: {
        type: String,
        required: [true, "Stock location is required"],
        trim: true,
    },
    items: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "StockItem",
        },
    ],
}, { timestamps: true });
const Stock = (0, mongoose_1.model)("Stock", stockSchema);
exports.default = Stock;
//# sourceMappingURL=stock.model.js.map