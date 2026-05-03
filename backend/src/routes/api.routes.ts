import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth";
import { addPoints, getMyPointsHistory } from "../controllers/points.controller";
import { getAllRewards, createReward, deleteReward, updateReward, reorderRewards } from "../controllers/rewards.controller";
import { generateRedemptionQR, confirmRedemption, getRedemptionStatus, cancelRedemption, getScannerHistory, getActiveRedemption } from "../controllers/redemptions.controller";
import { getAllEvents, createEvent, deleteEvent, notifyEvent, updateEvent, reorderEvents } from "../controllers/events.controller";
import { getAllUsers, adjustPoints, toggleBlockUser, deleteUser, toggleVipRewardStatus, getUserHistory, getUserReferrals } from "../controllers/users.controller";
import { getAdminStats, exportAudits, sendCustomPush } from "../controllers/admin.controller";
import { generatePromoToken, claimPromoToken } from "../controllers/promo.controller";
import { getSettings, updateSettings, uploadVideo, upload } from "../controllers/settings.controller";
import { handleMediaUpload, uploadMedia } from "../controllers/media.controller";
import { getAllVipBenefits, getMyVipBenefits, createVipBenefit, updateVipBenefit, deleteVipBenefit } from "../controllers/vip-benefits.controller";
import { getAllAvatars, createAvatar, deleteAvatar } from "../controllers/avatars.controller";
import { generateMemberToken, creditPointsByToken, verifyMemberToken } from "../controllers/member-qr.controller";

const router = Router();


// Media Upload
router.post("/media/upload", authenticate, requireAdmin, uploadMedia.single("file"), handleMediaUpload);


// Points
router.get("/points/history", authenticate, getMyPointsHistory);
router.post("/points/add", authenticate, requireAdmin, addPoints);


// Rewards
router.get("/rewards", getAllRewards);
router.post("/rewards", authenticate, requireAdmin, createReward);
router.patch("/rewards/reorder", authenticate, requireAdmin, reorderRewards);
router.patch("/rewards/:id", authenticate, requireAdmin, updateReward);
router.delete("/rewards/:id", authenticate, requireAdmin, deleteReward);

// Redemptions
router.post("/redemptions/generate", authenticate, generateRedemptionQR);
router.post("/redemptions/confirm", authenticate, requireAdmin, confirmRedemption);
router.post("/redemptions/cancel", authenticate, cancelRedemption);
router.get("/redemptions/active", authenticate, getActiveRedemption);
router.get("/redemptions/status/:qrToken", authenticate, getRedemptionStatus);
router.get("/redemptions/history", authenticate, requireAdmin, getScannerHistory);

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
router.get("/users/:id/referrals", authenticate, requireAdmin, getUserReferrals);
router.delete("/users/:id", authenticate, requireAdmin, deleteUser);


// Admin Stats
router.get("/admin/stats", authenticate, requireAdmin, getAdminStats);
router.get("/admin/export", authenticate, requireAdmin, exportAudits);
router.post("/admin/push", authenticate, requireAdmin, sendCustomPush);

// Promo Tokens
router.post("/promo/generate", authenticate, requireAdmin, generatePromoToken);
router.post("/promo/claim", authenticate, claimPromoToken);

// VIP Settings
router.get("/settings", getSettings);
router.post("/settings", authenticate, requireAdmin, updateSettings);
router.post("/settings/upload-video", authenticate, requireAdmin, upload.single("video"), uploadVideo);

// VIP Benefits
router.get("/vip-benefits", authenticate, requireAdmin, getAllVipBenefits);
router.get("/vip-benefits/me", authenticate, getMyVipBenefits);
router.post("/vip-benefits", authenticate, requireAdmin, createVipBenefit);
router.patch("/vip-benefits/:id", authenticate, requireAdmin, updateVipBenefit);
router.delete("/vip-benefits/:id", authenticate, requireAdmin, deleteVipBenefit);

// Dynamic Avatars
router.get("/avatars", getAllAvatars);
router.post("/avatars", authenticate, requireAdmin, createAvatar);
router.delete("/avatars/:id", authenticate, requireAdmin, deleteAvatar);

// Member QR System
router.get("/member-qr/token", authenticate, generateMemberToken);
router.get("/member-qr/verify/:token", authenticate, requireAdmin, verifyMemberToken);
router.post("/member-qr/credit", authenticate, requireAdmin, creditPointsByToken);

export default router;
