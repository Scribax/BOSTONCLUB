import { PrismaClient } from "@prisma/client";

/**
 * Shared logic to calculate membership level based on points and settings
 */
export const calculateMembershipLevel = (points: number, settings: any): string => {
  if (points >= settings.superVipThreshold) return "SÚPER VIP";
  if (points >= settings.diamondThreshold) return "DIAMANTE";
  if (points >= settings.platinumThreshold) return "PLATINO";
  if (points >= settings.goldThreshold) return "ORO";
  return "BRONCE";
};
