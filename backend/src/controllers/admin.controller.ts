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
    // We sum the PointHistory entries with negative points (which represent redemptions)
    const pointsHistoryStats = await prisma.pointHistory.aggregate({
      where: {
        pointsGained: { lt: 0 }
      },
      _sum: {
        pointsGained: true
      }
    });
    
    const totalPointsUsed = Math.abs(pointsHistoryStats._sum.pointsGained || 0);

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

    // 4. Total Points in Circulation (Unredeemed)
    const pointsAggregation = await prisma.user.aggregate({
      _sum: {
        points: true
      },
      where: { role: "CUSTOMER" }
    });
    const totalPointsBalance = pointsAggregation._sum.points || 0;

    res.json({
      totalUsers,
      totalPointsUsed,
      totalPointsBalance,
      latestActivity: latestActivity.map(h => ({
        id: h.id,
        description: h.description,
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
