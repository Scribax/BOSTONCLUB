import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth";
import { addPoints, getMyPointsHistory } from "../controllers/points.controller";
import { getAllRewards, createReward, deleteReward, updateReward } from "../controllers/rewards.controller";
import { generateRedemptionQR, confirmRedemption, getRedemptionStatus } from "../controllers/redemptions.controller";
import { getAllEvents, createEvent, deleteEvent, notifyEvent, updateEvent, reorderEvents } from "../controllers/events.controller";
import { getAllUsers, adjustPoints, toggleBlockUser, deleteUser, toggleVipRewardStatus, getUserHistory } from "../controllers/users.controller";
import { getAdminStats } from "../controllers/admin.controller";
import { generatePromoToken, claimPromoToken } from "../controllers/promo.controller";
import { getSettings, updateSettings, uploadVideo, upload } from "../controllers/settings.controller";
import { handleMediaUpload, uploadMedia } from "../controllers/media.controller";

const router = Router();


// Media Upload
router.post("/media/upload", authenticate, requireAdmin, uploadMedia.single("file"), handleMediaUpload);


// Points
router.get("/points/history", authenticate, getMyPointsHistory);
router.post("/points/add", authenticate, requireAdmin, addPoints);


// Rewards
router.get("/rewards", getAllRewards);
router.post("/rewards", authenticate, requireAdmin, createReward);
router.patch("/rewards/:id", authenticate, requireAdmin, updateReward);
router.delete("/rewards/:id", authenticate, requireAdmin, deleteReward);

// Redemptions
router.post("/redemptions/generate", authenticate, generateRedemptionQR);
router.post("/redemptions/confirm", authenticate, requireAdmin, confirmRedemption);
router.get("/redemptions/status/:qrToken", getRedemptionStatus);

// Events
router.get("/events", getAllEvents);
router.post("/events", authenticate, requireAdmin, createEvent);
router.patch("/events/reorder", authenticate, requireAdmin, reorderEvents);
router.patch("/events/:id", authenticate, requireAdmin, updateEvent);
router.post("/events/:id/notify", authenticate, requireAdmin, notifyEvent);
router.delete("/events/:id", authenticate, requireAdmin, deleteEvent);

// Users (Admin Only)
router.get("/users", authenticate, requireAdmin, getAllUsers);
router.patch("/users/:id/points", authenticate, requireAdmin, adjustPoints);
router.patch("/users/:id/block", authenticate, requireAdmin, toggleBlockUser);
router.patch("/users/:id/reward-status", authenticate, requireAdmin, toggleVipRewardStatus);
router.get("/users/:id/history", authenticate, requireAdmin, getUserHistory);
router.delete("/users/:id", authenticate, requireAdmin, deleteUser);


// Admin Stats
router.get("/admin/stats", authenticate, requireAdmin, getAdminStats);

// Promo Tokens
router.post("/promo/generate", authenticate, requireAdmin, generatePromoToken);
router.post("/promo/claim", authenticate, claimPromoToken);

// VIP Settings
router.get("/settings", getSettings);
router.post("/settings", authenticate, requireAdmin, updateSettings);
router.post("/settings/upload-video", authenticate, requireAdmin, upload.single("video"), uploadVideo);

export default router;
