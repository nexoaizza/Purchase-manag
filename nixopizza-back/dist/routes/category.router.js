"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const Multer_1 = require("../middlewares/Multer");
// Using upload() for backward compatibility; we ignore the folder name now.
const categoryRouter = (0, express_1.Router)();
categoryRouter.get("/", category_controller_1.getCategoriesByFilter);
categoryRouter.post("/", (0, Multer_1.upload)().single("image"), category_controller_1.createCategory);
categoryRouter.put("/:categoryId", (0, Multer_1.upload)().single("image"), category_controller_1.updateCategory);
categoryRouter.delete("/:categoryId", category_controller_1.deleteCategory);
exports.default = categoryRouter;
//# sourceMappingURL=category.router.js.map