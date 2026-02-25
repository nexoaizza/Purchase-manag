"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Auth_1 = require("../middlewares/Auth");
const template_controller_1 = require("../controllers/template.controller");
const router = (0, express_1.Router)();
router.use(Auth_1.authenticate);
router.use(Auth_1.requireAdmin);
router.get("/", template_controller_1.listTemplates);
router.get("/:id", template_controller_1.getTemplate);
router.post("/", template_controller_1.createTemplate);
router.put("/:id", template_controller_1.updateTemplate);
router.delete("/:id", template_controller_1.deleteTemplate);
exports.default = router;
//# sourceMappingURL=template.router.js.map