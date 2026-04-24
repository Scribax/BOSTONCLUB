import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Total Users
    const totalUsers = await prisma.user.count({
      where: { role: "CUSTOMER" }
    });

    // 2. Total Points Used (Only from COMPLETED redemptions)
    const allRedemptions = await prisma.redemption.findMany({
      where: { status: "COMPLETED" },
      include: {
        reward: true
      }
    });
    
    const totalPointsUsed = allRedemptions.reduce((sum, r) => sum + (r.reward?.pointsRequired || 0), 0);

    // 3. Latest Activity (All point movements: Redemptions, Promos, Admin additions)
    const latestActivity = await prisma.pointHistory.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      totalUsers,
      totalPointsUsed,
      latestRedemptions: latestActivity.map(h => ({
        id: h.id,
        rewardName: h.description,
        userName: `${h.user.firstName} ${h.user.lastName}`,
        points: h.pointsGained,
        createdAt: h.createdAt
      }))
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
