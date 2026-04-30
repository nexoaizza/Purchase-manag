import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/Auth";
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../controllers/template.controller";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get("/", listTemplates);
router.get("/:id", getTemplate);
router.post("/", createTemplate);
router.put("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);

export default router;
