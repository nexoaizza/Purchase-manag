"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stock_controller_1 = require("../controllers/stock.controller");
const Auth_1 = require("../middlewares/Auth");
const stockRouter = (0, express_1.Router)();
stockRouter.use(Auth_1.authenticate);
stockRouter.post("/", Auth_1.requireAdmin, stock_controller_1.createStock);
stockRouter.put("/:stockId", Auth_1.requireAdmin, stock_controller_1.updateStock);
stockRouter.get("/", stock_controller_1.getAllStocks);
stockRouter.get("/:stockId", stock_controller_1.getStock);
stockRouter.delete("/:stockId", Auth_1.requireAdmin, stock_controller_1.deleteStock);
// Stock items management
stockRouter.post("/:stockId/items", Auth_1.requireAdmin, stock_controller_1.addItemToStock);
stockRouter.delete("/:stockId/items/:itemId", Auth_1.requireAdmin, stock_controller_1.removeItemFromStock);
exports.default = stockRouter;
//# sourceMappingURL=stock.router.js.map