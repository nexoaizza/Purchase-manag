import { Router } from "express";
import { upload } from "../middlewares/Multer";
import { authenticate, requireAdmin } from "../middlewares/Auth";
import {
  getAllStaff,
  getCategoryAnalytics,
  getMonthlySpendingAnalytics,
  getPendingSummary,
  newStaffMember,
  updateStaff,
  deleteStaff,
} from "../controllers/admin.controller";

const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireAdmin);

adminRouter.get("/staffs", getAllStaff);
adminRouter.post("/staffs", upload().single("image"), newStaffMember);
adminRouter.put("/staffs/:staffId", upload().single("image"), updateStaff);
adminRouter.delete("/staffs/:staffId", deleteStaff);

adminRouter.get("/analytics/category", getCategoryAnalytics);
adminRouter.get("/analytics/monthly", getMonthlySpendingAnalytics);
adminRouter.get("/pending-summary", getPendingSummary);

export default adminRouter;