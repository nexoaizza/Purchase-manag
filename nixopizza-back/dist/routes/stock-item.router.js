"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stock_item_controller_1 = require("../controllers/stock-item.controller");
const Auth_1 = require("../middlewares/Auth");
const stockItemRouter = (0, express_1.Router)();
stockItemRouter.use(Auth_1.authenticate);
stockItemRouter.post("/", Auth_1.requireAdmin, stock_item_controller_1.createStockItem);
stockItemRouter.post("/bulk", Auth_1.requireAdmin, stock_item_controller_1.createMultipleStockItems);
stockItemRouter.put("/:stockItemId", Auth_1.requireAdmin, stock_item_controller_1.updateStockItem);
stockItemRouter.get("/", stock_item_controller_1.getAllStockItems);
stockItemRouter.get("/expired", stock_item_controller_1.getExpiredStockItems);
stockItemRouter.get("/expiring-soon", stock_item_controller_1.getExpiringSoonStockItems);
stockItemRouter.get("/:stockItemId", stock_item_controller_1.getStockItem);
stockItemRouter.delete("/:stockItemId", Auth_1.requireAdmin, stock_item_controller_1.deleteStockItem);
exports.default = stockItemRouter;
//# sourceMappingURL=stock-item.router.js.map