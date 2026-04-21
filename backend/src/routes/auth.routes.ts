import { Router } from "express";
import { register, login, getMe, updateMe, updatePushToken, verifyEmail, forgotPassword, resetPassword } from "../controllers/auth.controller";

import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", authenticate, verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);
router.patch("/push-token", authenticate, updatePushToken);

export default router;
