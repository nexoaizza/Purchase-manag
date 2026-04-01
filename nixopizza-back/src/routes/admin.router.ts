import { Router } from "express";
import { upload } from "../middlewares/Multer";
import { authenticate, requireAdmin } from "../middlewares/Auth";
import rateLimit from "express-rate-limit";
import {
  getAllStaff,
  getCategoryAnalytics,
  getMonthlySpendingAnalytics,
  newStaffMember,
  updateStaff,
  deleteStaff,
} from "../controllers/admin.controller";

const staffCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { message: "Too many requests, please try again later" },
});

const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireAdmin);

adminRouter.get("/staffs", getAllStaff);
adminRouter.post("/staffs", staffCreationLimiter, upload().single("image"), newStaffMember);
adminRouter.put("/staffs/:staffId", upload().single("image"), updateStaff);
adminRouter.delete("/staffs/:staffId", deleteStaff);

adminRouter.get("/analytics/category", getCategoryAnalytics);
adminRouter.get("/analytics/monthly", getMonthlySpendingAnalytics);

export default adminRouter;