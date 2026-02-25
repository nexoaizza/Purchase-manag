"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const waste_controller_1 = require("../controllers/waste.controller");
const Auth_1 = require("../middlewares/Auth");
const wasteRouter = (0, express_1.Router)();
wasteRouter.use(Auth_1.authenticate);
// CRUD operations
wasteRouter.post("/", Auth_1.requireAdmin, waste_controller_1.createWaste);
wasteRouter.get("/", waste_controller_1.getAllWastes);
wasteRouter.get("/:wasteId", waste_controller_1.getWasteById);
wasteRouter.put("/:wasteId", Auth_1.requireAdmin, waste_controller_1.updateWaste);
wasteRouter.delete("/:wasteId", Auth_1.requireAdmin, waste_controller_1.deleteWaste);
// Statistics endpoints
wasteRouter.get("/stats/by-product", waste_controller_1.getWasteStatsByProduct);
wasteRouter.get("/stats/by-reason", waste_controller_1.getWasteStatsByReason);
exports.default = wasteRouter;
//# sourceMappingURL=waste.router.js.map