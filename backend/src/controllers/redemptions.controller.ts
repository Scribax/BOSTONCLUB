import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// User requests a redemption QR
export const generateRedemptionQR = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { rewardId } = req.body;

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

    // Generate secure token
    const qrToken = crypto.randomBytes(32).toString("hex");

    // Expiration time: 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const redemption = await prisma.redemption.create({
      data: {
        userId,
        rewardId,
        qrToken,
        expiresAt,
        status: "PENDING"
      }
    });

    // The QR data will just be the token, or a URL pointing to the admin confirmation endpoint
    const qrData = JSON.stringify({ token: qrToken });

    res.json({ redemptionId: redemption.id, qrToken, qrData, expiresAt });
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
      include: { user: true, reward: true }
    });

    if (!redemption) {
      res.status(404).json({ message: "Invalid QR or Redemption not found" });
      return;
    }

    if (redemption.status !== "PENDING") {
      res.status(400).json({ message: "Redemption already processed or cancelled" });
      return;
    }

    if (redemption.expiresAt && redemption.expiresAt < new Date()) {
      res.status(400).json({ message: "QR Token expired" });
      return;
    }

    // Deduct points
    if (redemption.user.points < redemption.reward.pointsRequired) {
      res.status(400).json({ message: "User doesn't have enough points anymore" });
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
          description: `Redeemed ${redemption.reward.name}`
        }
      })
    ]);

    res.json({ message: "Redemption confirmed successfully!" });
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
