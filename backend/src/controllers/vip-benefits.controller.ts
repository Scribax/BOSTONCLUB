import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LEVEL_ORDER = ["BRONCE", "ORO", "PLATINO", "DIAMANTE", "SÚPER VIP"];

async function getUserLevel(userId: string): Promise<string> {
  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.clubSettings.findFirst()
  ]);
  if (!user || !settings) return "BRONCE";

  const pts = user.points;
  if (pts >= settings.superVipThreshold) return "SÚPER VIP";
  if (pts >= settings.diamondThreshold) return "DIAMANTE";
  if (pts >= settings.platinumThreshold) return "PLATINO";
  if (pts >= settings.goldThreshold) return "ORO";
  return "BRONCE";
}

// Admin: Get all benefits
export const getAllVipBenefits = async (req: Request, res: Response) => {
  try {
    const benefits = await prisma.vipBenefit.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(benefits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching vip benefits" });
  }
};

// User: Get their own unlocked benefits + lock status
export const getMyVipBenefits = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const userLevel = await getUserLevel(userId);
    const userLevelIdx = LEVEL_ORDER.indexOf(userLevel);
    // User can see benefits from their level and all lower levels
    const unlockedLevels = LEVEL_ORDER.slice(0, userLevelIdx + 1);

    const benefits = await prisma.vipBenefit.findMany({
      where: { isActive: true, level: { in: unlockedLevels } },
      orderBy: { createdAt: "desc" }
    });

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const finalBenefits = await Promise.all(benefits.map(async (benefit) => {
      let isLocked = false;
      let lockReason: string | null = null;

      if (benefit.redemptionPolicy === "ONCE_TOTAL") {
        const hasUsed = await prisma.redemption.findFirst({
          where: {
            userId,
            vipBenefitId: benefit.id,
            status: { in: ["PENDING", "COMPLETED"] }
          }
        });
        if (hasUsed) {
          isLocked = true;
          lockReason = "Ya canjeaste este beneficio";
        }
      } else if (benefit.redemptionPolicy === "ONCE_PER_NIGHT") {
        const usedTonight = await prisma.redemption.findFirst({
          where: {
            userId,
            vipBenefitId: benefit.id,
            createdAt: { gte: twelveHoursAgo },
            status: { in: ["PENDING", "COMPLETED"] }
          }
        });
        if (usedTonight) {
          isLocked = true;
          lockReason = "Canjeado · Disponible mañana";
        }
      }

      return { ...benefit, isLocked, lockReason };
    }));

    res.json(finalBenefits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching your benefits" });
  }
};

// Admin: Create
export const createVipBenefit = async (req: Request, res: Response) => {
  try {
    const { level, title, description, redemptionPolicy, isActive } = req.body;
    const newBenefit = await prisma.vipBenefit.create({
      data: {
        level,
        title,
        description: description || "",
        redemptionPolicy: redemptionPolicy || "ONCE_PER_NIGHT",
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.status(201).json(newBenefit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating benefit" });
  }
};

// Admin: Update
export const updateVipBenefit = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { level, title, description, redemptionPolicy, isActive } = req.body;
    const updated = await prisma.vipBenefit.update({
      where: { id },
      data: { level, title, description, redemptionPolicy, isActive }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating benefit" });
  }
};

// Admin: Delete
export const deleteVipBenefit = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.vipBenefit.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting benefit" });
  }
};
