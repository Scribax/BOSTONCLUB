/**
 * Centralized user service for points, streaks, and membership level logic.
 * All point-awarding actions MUST go through awardPointsToUser to ensure
 * consistent streak tracking, multipliers, history, and level upgrades.
 */
import { isFeatureEnabled } from './featureFlag.service';
import { sendLevelUpPush } from './push.service';

// ─── Constants ─────────────────────────────────────────────────────────────
const STREAK_WINDOW_DAYS = 2; // Max gap between visits to keep streak
const STREAK_INCREMENT_MIN_DAYS = 1;

// Sources that are eligible for streak tracking (User scanning the code at the venue)
const STREAK_ELIGIBLE_SOURCES = ['DAILY_CHECKIN'];

// ─── Helpers ───────────────────────────────────────────────────────────────
/**
 * Returns YYYY-MM-DD for a date in Argentina timezone.
 */
function getArgentinaDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function calcStreakMultiplier(streak: number): number {
  if (streak >= 7) return 2.0;
  if (streak >= 4) return 1.5; // Adjusted slightly for weekly merit
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
    select: { streak: true, lastStreakDate: true, points: true, membershipLevel: true, expoPushToken: true, firstName: true }
  });

  if (!user) throw new Error(`User ${userId} not found`);

  // 2. Calculate streak (WEEKLY LOGIC)
  const isStreakEligible = STREAK_ELIGIBLE_SOURCES.includes(source);
  const now = new Date();
  let newStreak = user.streak ?? 0;

  if (isStreakEligible) {
    const lastDate = user.lastStreakDate as Date | null;
    if (!lastDate) {
      newStreak = 1;
    } else {
      const diffTime = now.getTime() - lastDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays < 4) {
        // Same week/weekend visit, maintain current streak but don't increment
        newStreak = user.streak || 1;
      } else if (diffDays <= 14) {
        // Came back the following week! Increment streak.
        newStreak = (user.streak || 0) + 1;
      } else {
        // Took too long to return (more than 2 weeks), reset to 1
        newStreak = 1;
      }
    }
  }

  // 3. Apply multiplier
  const isHappyHour = await isFeatureEnabled('enable_happy_hour');
  const isHappyHourEligible = isHappyHour && source === 'COMPRA_POSNET';

  let multiplier = isStreakEligible ? calcStreakMultiplier(newStreak) : 1.0;
  if (isHappyHourEligible) {
    multiplier *= 2;
  }

  const finalPoints = Math.round(basePoints * multiplier);
  const streakBonus = finalPoints - basePoints;

  // 4. Create point history
  let historyDescription = description;
  
  if (isHappyHourEligible && isStreakEligible && newStreak >= 4) {
    historyDescription = `${description} (✨ HAPPY HOUR x2 & 🔥 Racha → +${streakBonus} bonus)`;
  } else if (isHappyHourEligible) {
    historyDescription = `${description} (✨ HAPPY HOUR x2 → +${streakBonus} bonus)`;
  } else if (isStreakEligible && multiplier > 1) {
    historyDescription = `${description} (🔥 Racha x${multiplier} → +${streakBonus} bonus)`;
  }

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
  let levelChanged = false;
  let newLevelValue = updatedUser.membershipLevel;
  if (settings) {
    newLevelValue = calculateMembershipLevel(updatedUser.points, settings);
    if (updatedUser.membershipLevel !== newLevelValue) {
      levelChanged = true;
      updatedUser = await tx.user.update({
        where: { id: userId },
        data: { membershipLevel: newLevelValue }
      });
    }
  }

  // 7. Fire level-up push OUTSIDE transaction (non-blocking)
  if (levelChanged && user.expoPushToken) {
    sendLevelUpPush(user.expoPushToken, user.firstName, newLevelValue).catch(console.error);
  }

  return { updatedUser, finalPoints, multiplier, newStreak };
}
