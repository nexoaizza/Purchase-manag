"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_1 = require("../middlewares/Auth");
const Multer_1 = require("../middlewares/Multer");
const order_controller_1 = require("../controllers/order.controller");
const orderRouter = (0, express_1.Router)();
orderRouter.use(Auth_1.authenticate);
orderRouter.post("/", (0, Multer_1.upload)().single("image"), order_controller_1.createOrder);
orderRouter.post("/:orderId/assign", order_controller_1.assignOrder);
orderRouter.post("/:orderId/review", (0, Multer_1.upload)().single("image"), order_controller_1.submitOrderForReview);
orderRouter.post("/:orderId/verify", order_controller_1.verifyOrder);
orderRouter.put("/:orderId", (0, Multer_1.upload)().single("image"), order_controller_1.updateOrder);
orderRouter.get("/stats", order_controller_1.getOrderStats);
orderRouter.get("/analytics", order_controller_1.getOrderAnalytics);
orderRouter.get("/:orderId", order_controller_1.getOrder);
orderRouter.get("/", order_controller_1.getOrdersByFilter);
exports.default = orderRouter;
//# sourceMappingURL=order.router.js.map