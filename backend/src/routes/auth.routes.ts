import { Router } from "express";
import { register, login, getMe, updateMe } from "../controllers/auth.controller";

import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);


export default router;
