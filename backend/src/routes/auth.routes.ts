import { Router } from "express";
import { register, login, getMe, updateMe, updateAvatar, updatePushToken, verifyEmail, resendVerificationCode, forgotPassword, resetPassword, deleteMe } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth";
import { loginRateLimit, registerRateLimit, forgotPasswordRateLimit, resendVerificationRateLimit } from "../middlewares/rateLimit";

const router = Router();

router.post("/register", registerRateLimit, register);
router.post("/login", loginRateLimit, login);
router.post("/verify-email", authenticate, verifyEmail);
router.post("/resend-verification", authenticate, resendVerificationRateLimit, resendVerificationCode);
router.post("/forgot-password", forgotPasswordRateLimit, forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);
router.patch("/avatar", authenticate, updateAvatar);
router.patch("/push-token", authenticate, updatePushToken);
router.delete("/me", authenticate, deleteMe);

export default router;
