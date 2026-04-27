/**
 * Centralized user service for points, streaks, and membership level logic.
 * All point-awarding actions MUST go through awardPointsToUser to ensure
 * consistent streak tracking, multipliers, history, and level upgrades.
 */

// ─── Constants ─────────────────────────────────────────────────────────────
const STREAK_WINDOW_DAYS = 14;
const STREAK_INCREMENT_MIN_DAYS = 1;

// Sources that are eligible for streak tracking
const STREAK_ELIGIBLE_SOURCES = ['COMPRA_POSNET', 'PURCHASE', 'PROMO', 'QR_CHECKIN', 'DAILY_CHECKIN'];

// ─── Helpers ───────────────────────────────────────────────────────────────
export function calcStreakMultiplier(streak: number): number {
  if (streak >= 7) return 2.0;
  if (streak >= 3) return 1.5;
  return 1.0;
}

/**
 * Calculates membership level based on points and current settings thresholds.
 */
export const calculateMembershipLevel = (points: number, settings: any): string => {
  if (points >= settings.superVipThreshold) return "SÚPER VIP";
  if (points >= settings.diamondThreshold) return "DIAMANTE";
  if (points >= settings.platinumThreshold) return "PLATINO";
  if (points >= settings.goldThreshold) return "ORO";
  return "BRONCE";
};

/**
 * Awards points to a user inside a Prisma transaction (tx).
 * Handles: streak calculation, multiplier, point history, and level upgrade.
 *
 * @param tx - Prisma transaction client (use prisma.$transaction(async (tx) => ...))
 * @param userId - Target user ID
 * @param basePoints - Base points to award (before multiplier)
 * @param source - Source string (e.g. "COMPRA_POSNET", "DAILY_CHECKIN")
 * @param description - Human-readable description for the history entry
 * @returns The updated user record
 */
export async function awardPointsToUser(
  tx: any,
  userId: string,
  basePoints: number,
  source: string,
  description: string
): Promise<any> {
  // 1. Fetch current user
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { streak: true, lastStreakDate: true, points: true, membershipLevel: true }
  });

  if (!user) throw new Error(`User ${userId} not found`);

  // 2. Calculate streak
  const isStreakEligible = STREAK_ELIGIBLE_SOURCES.includes(source);
  const now = new Date();
  let newStreak = user.streak ?? 0;

  if (isStreakEligible) {
    const lastDate = user.lastStreakDate as Date | null;
    if (!lastDate) {
      newStreak = 1;
    } else {
      const daysSinceLast = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLast >= STREAK_INCREMENT_MIN_DAYS && daysSinceLast <= STREAK_WINDOW_DAYS) {
        newStreak = (user.streak || 0) + 1;
      } else if (daysSinceLast > STREAK_WINDOW_DAYS) {
        newStreak = 1; // reset
      }
      // < 1 day: keep same (already counted today)
    }
  }

  // 3. Apply multiplier
  const multiplier = isStreakEligible ? calcStreakMultiplier(newStreak) : 1.0;
  const finalPoints = Math.round(basePoints * multiplier);
  const streakBonus = finalPoints - basePoints;

  // 4. Create point history
  const historyDescription = multiplier > 1
    ? `${description} (🔥 Racha x${multiplier} → +${streakBonus} bonus)`
    : description;

  await tx.pointHistory.create({
    data: {
      userId,
      pointsGained: finalPoints,
      source,
      description: historyDescription
    }
  });

  // 5. Update user points and streak
  const updateData: any = { points: { increment: finalPoints } };
  if (isStreakEligible) {
    updateData.streak = newStreak;
    updateData.lastStreakDate = now;
  }

  let updatedUser = await tx.user.update({
    where: { id: userId },
    data: updateData
  });

  // 6. Check for level upgrade
  const settings = await tx.clubSettings.findUnique({ where: { id: "singleton" } });
  if (settings) {
    const newLevel = calculateMembershipLevel(updatedUser.points, settings);
    if (updatedUser.membershipLevel !== newLevel) {
      updatedUser = await tx.user.update({
        where: { id: userId },
        data: { membershipLevel: newLevel }
      });
    }
  }

  return { updatedUser, finalPoints, multiplier, newStreak };
}
