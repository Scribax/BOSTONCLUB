import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// User requests a redemption QR
export const generateRedemptionQR = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { rewardId, eventId } = req.body;

    if (!rewardId && !eventId) {
      res.status(400).json({ message: "rewardId or eventId is required" });
      return;
    }

    let expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 mins for promos too

    const qrToken = crypto.randomBytes(32).toString("hex");

    if (rewardId) {
      const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
      if (!reward) {
        res.status(404).json({ message: "Reward not found" });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.points < reward.pointsRequired) {
        res.status(400).json({ message: "Not enough points" });
        return;
      }

      const redemption = await prisma.redemption.create({
        data: { userId, rewardId, qrToken, expiresAt, status: "PENDING" }
      });

      res.json({ redemptionId: redemption.id, qrToken, expiresAt });
      return;
    }

    if (eventId) {
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event || !event.isRedeemable) {
        res.status(404).json({ message: "Promotion not redeemable or not found" });
        return;
      }

      // Check redemption policy
      if (event.redemptionPolicy === "ONCE_TOTAL") {
        const existing = await prisma.redemption.findFirst({
          where: { userId, eventId, status: { in: ["PENDING", "COMPLETED"] } }
        });
        if (existing) {
          res.status(400).json({ message: "Ya has canjeado esta promoción" });
          return;
        }
      } else if (event.redemptionPolicy === "ONCE_PER_NIGHT") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await prisma.redemption.findFirst({
          where: { 
            userId, 
            eventId, 
            createdAt: { gte: today },
            status: { in: ["PENDING", "COMPLETED"] } 
          }
        });
        if (existing) {
          res.status(400).json({ message: "Ya has canjeado esta promoción hoy" });
          return;
        }
      }

      const redemption = await prisma.redemption.create({
        data: { userId, eventId, qrToken, expiresAt, status: "PENDING" }
      });

      res.json({ redemptionId: redemption.id, qrToken, expiresAt });
      return;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Admin scans and confirms the redemption
export const confirmRedemption = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrToken } = req.body;

    const redemption = await prisma.redemption.findUnique({
      where: { qrToken },
      include: { user: true, reward: true, event: true }
    });

    if (!redemption) {
      res.status(404).json({ message: "Invalid QR or Redemption not found" });
      return;
    }

    if (redemption.status !== "PENDING") {
      res.status(400).json({ message: "QR already used" });
      return;
    }

    if (redemption.expiresAt && redemption.expiresAt < new Date()) {
      res.status(400).json({ message: "QR Token expired" });
      return;
    }

    // Reward-specific logic (Deduct points)
    if (redemption.rewardId && redemption.reward) {
      if (redemption.user.points < redemption.reward.pointsRequired) {
        res.status(400).json({ message: "Insufficient points" });
        return;
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: redemption.userId },
          data: { points: { decrement: redemption.reward.pointsRequired } }
        }),
        prisma.redemption.update({
          where: { id: redemption.id },
          data: { status: "COMPLETED" }
        }),
        prisma.pointHistory.create({
          data: {
            userId: redemption.userId,
            pointsGained: -redemption.reward.pointsRequired,
            source: "ADMIN",
            description: `Canje de premio: ${redemption.reward.name}`
          }
        })
      ]);
    } else if (redemption.eventId && redemption.event) {
      // Promo-specific logic (Just mark as completed)
      await prisma.redemption.update({
        where: { id: redemption.id },
        data: { status: "COMPLETED" }
      });
    }

    res.json({ 
      message: "Canje confirmado con éxito!",
      type: redemption.rewardId ? 'REWARD' : 'PROMO',
      details: redemption.reward?.name || redemption.event?.title
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getRedemptionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrToken } = req.params;
    
    if (!qrToken) {
      res.status(400).json({ message: "Token missing" });
      return;
    }

    const redemption = await prisma.redemption.findFirst({
      where: { qrToken: String(qrToken) },
      select: { status: true }
    });

    if (!redemption) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    res.json({ status: redemption.status });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
