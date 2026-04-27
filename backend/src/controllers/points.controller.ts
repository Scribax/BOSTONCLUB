import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { calculateMembershipLevel } from "../services/user.service";

const prisma = new PrismaClient();

// ─── Streak helpers ───────────────────────────────────────────────
const STREAK_WINDOW_DAYS = 14;  // If user hasn't scanned in 14 days, streak resets
const STREAK_INCREMENT_MIN_DAYS = 1; // Must wait at least 1 day between streak increments

function calcStreakMultiplier(streak: number): number {
  if (streak >= 7) return 2.0;
  if (streak >= 3) return 1.5;
  return 1.0;
}

// Only admin
export const addPoints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, pointsGained, source, description } = req.body;
    
    if (!userId || !pointsGained || !source) {
       res.status(400).json({ message: "Missing required fields" });
       return;
    }

    // Fetch current user streak info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, lastStreakDate: true }
    });

    let newStreak = user?.streak ?? 0;
    let multiplier = 1.0;
    const now = new Date();

    // Only apply streak logic for purchase/promo sources (not admin bonuses)
    const isStreakEligible = ['COMPRA_POSNET', 'PURCHASE', 'PROMO', 'QR_CHECKIN'].includes(source);

    if (isStreakEligible && user) {
      const lastDate = user.lastStreakDate;
      if (!lastDate) {
        // First ever visit
        newStreak = 1;
      } else {
        const daysSinceLast = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLast >= STREAK_INCREMENT_MIN_DAYS && daysSinceLast <= STREAK_WINDOW_DAYS) {
          newStreak = (user.streak || 0) + 1;
        } else if (daysSinceLast > STREAK_WINDOW_DAYS) {
          newStreak = 1; // reset
        }
        // If < 1 day, keep streak same (already counted today)
      }
      multiplier = calcStreakMultiplier(newStreak);
    }

    const finalPoints = Math.round(Number(pointsGained) * multiplier);
    const streakBonus = finalPoints - Number(pointsGained);

    await prisma.pointHistory.create({
      data: {
        userId,
        pointsGained: finalPoints,
        source,
        description: multiplier > 1
          ? `${description || source} (🔥 Racha x${multiplier} → +${streakBonus} bonus)`
          : (description || source)
      }
    });

    const updateData: any = { points: { increment: finalPoints } };
    if (isStreakEligible) {
      updateData.streak = newStreak;
      updateData.lastStreakDate = now;
    }

    let updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Check for level upgrade
    const settings = await prisma.clubSettings.findUnique({ where: { id: "singleton" } });
    if (settings) {
      const newLevel = calculateMembershipLevel(updatedUser.points, settings);
      if (updatedUser.membershipLevel !== newLevel) {
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { membershipLevel: newLevel }
        });
      }
    }

    res.json({ 
      message: "Points added successfully", 
      pointsGained: finalPoints,
      multiplier,
      streak: newStreak,
      newTotal: updatedUser.points 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Authenticated user
export const getMyPointsHistory = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const history = await prisma.pointHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

