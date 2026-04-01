import { Router } from "express";
import {
  login,
  logout,
  refreshTokens,
  updateUser,
  updateFcmToken,
} from "../controllers/auth.controller";
import { upload } from "../middlewares/Multer";
import { authenticate } from "../middlewares/Auth";
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many login attempts, please try again later" },
});

const authRouter = Router();
authRouter.post("/login", loginLimiter, login);
authRouter.post("/logout", logout);
authRouter.post("/refresh", refreshTokens);
authRouter.put("/profile", authenticate, updateUser);
authRouter.put("/fcm-token", authenticate, updateFcmToken);
export default authRouter;
