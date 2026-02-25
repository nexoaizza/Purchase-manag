"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transfer_controller_1 = require("../controllers/transfer.controller");
const Auth_1 = require("../middlewares/Auth");
const transferRouter = (0, express_1.Router)();
transferRouter.use(Auth_1.authenticate);
// CRUD operations
transferRouter.post("/", Auth_1.requireAdmin, transfer_controller_1.createTransfer);
transferRouter.get("/", transfer_controller_1.getAllTransfers);
transferRouter.get("/:transferId", transfer_controller_1.getTransferById);
transferRouter.put("/:transferId", Auth_1.requireAdmin, transfer_controller_1.updateTransfer);
transferRouter.delete("/:transferId", Auth_1.requireAdmin, transfer_controller_1.deleteTransfer);
// Get transfers by stock
transferRouter.get("/stock/:stockId", transfer_controller_1.getTransfersByStock);
exports.default = transferRouter;
//# sourceMappingURL=transfer.router.js.map