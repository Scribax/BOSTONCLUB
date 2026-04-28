import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// User requests a redemption QR
export const generateRedemptionQR = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { rewardId, eventId, vipBenefitId } = req.body;

    if (!rewardId && !eventId && !vipBenefitId) {
      res.status(400).json({ message: "rewardId, eventId or vipBenefitId is required" });
      return;
    }

    let expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 mins for promos too

    const qrToken = crypto.randomBytes(32).toString("hex");

    // Fetch user for age validation
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    let isAdult = false;
    if (user.birthDate) {
      const today = new Date();
      const birthDate = new Date(user.birthDate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age >= 18) isAdult = true;
    }

    if (rewardId) {
      const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
      if (!reward) {
        res.status(404).json({ message: "Reward not found" });
        return;
      }

      if (reward.isAdultOnly && !isAdult) {
        res.status(403).json({ message: "Esta recompensa es solo para mayores de 18 años" });
        return;
      }

      const pendingRedemptions = await prisma.redemption.findMany({
        where: {
          userId,
          status: "PENDING",
          expiresAt: { gt: new Date() },
          rewardId: { not: null }
        },
        include: { reward: true }
      });

      const pendingPoints = pendingRedemptions.reduce((sum, r) => sum + (r.reward?.pointsRequired || 0), 0);
      const totalPointsNeeded = pendingPoints + reward.pointsRequired;

      if (user.points < totalPointsNeeded) {
        if (pendingPoints > 0 && user.points >= reward.pointsRequired) {
          res.status(400).json({ message: "Ya tienes códigos QR pendientes. Cancélalos o úsalos antes de generar más." });
        } else {
          res.status(400).json({ message: "No tienes puntos suficientes." });
        }
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

      if (event.isAdultOnly && !isAdult) {
        res.status(403).json({ message: "Esta promoción es solo para mayores de 18 años" });
        return;
      }

      // Check redemption policy
      if (event.redemptionPolicy === "ONCE_TOTAL") {
        const existing = await prisma.redemption.findFirst({
          where: { 
            userId, 
            eventId, 
            OR: [
              { status: "COMPLETED" },
              { status: "PENDING", expiresAt: { gt: new Date() } }
            ]
          }
        });
        if (existing) {
          res.status(400).json({ message: "Ya has canjeado esta promoción o tienes un código activo" });
          return;
        }
      } else if (event.redemptionPolicy === "ONCE_PER_NIGHT") {
        // Nightly window: 12 hours ago (to cover a full nightclub session across midnight)
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        const existing = await prisma.redemption.findFirst({
          where: { 
            userId, 
            eventId, 
            createdAt: { gte: twelveHoursAgo },
            OR: [
              { status: "COMPLETED" },
              { status: "PENDING", expiresAt: { gt: new Date() } }
            ]
          }
        });
        if (existing) {
          res.status(400).json({ message: "Ya has reclamado esta promoción en las últimas 12hs o tienes un código activo" });
          return;
        }
      }

      const redemption = await prisma.redemption.create({
        data: { userId, eventId, qrToken, expiresAt, status: "PENDING" }
      });

      res.json({ redemptionId: redemption.id, qrToken, expiresAt });
      return;
    }

    // --- VIP BENEFIT REDEMPTION ---
    if (vipBenefitId) {
      const benefit = await prisma.vipBenefit.findUnique({ where: { id: vipBenefitId } });
      if (!benefit || !benefit.isActive) {
        res.status(404).json({ message: "Beneficio no encontrado" });
        return;
      }

      // Check policy
      if (benefit.redemptionPolicy === "ONCE_TOTAL") {
        const existing = await prisma.redemption.findFirst({
          where: { userId, vipBenefitId, status: { in: ["PENDING", "COMPLETED"] } }
        });
        if (existing) {
          res.status(400).json({ message: "Ya has canjeado este beneficio permanentemente." });
          return;
        }
      } else if (benefit.redemptionPolicy === "ONCE_PER_NIGHT") {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        const existing = await prisma.redemption.findFirst({
          where: {
            userId,
            vipBenefitId,
            createdAt: { gte: twelveHoursAgo },
            status: { in: ["PENDING", "COMPLETED"] }
          }
        });
        if (existing) {
          res.status(400).json({ message: "Ya usaste este beneficio esta noche. Vuelve mañana 🌙" });
          return;
        }
      }

      const redemption = await prisma.redemption.create({
        data: { userId, vipBenefitId, qrToken, expiresAt, status: "PENDING" }
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
    const staffId = (req as any).user?.userId || (req as any).user?.id;

    const redemption = await prisma.redemption.findUnique({
      where: { qrToken },
      include: { user: true, reward: true, event: true, vipBenefit: true }
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

    const staff = await prisma.user.findUnique({ where: { id: staffId }, select: { firstName: true, lastName: true } });
    const staffName = staff ? `${staff.firstName} ${staff.lastName}` : "Staff";

    // Reward-specific logic (Deduct points)
    if (redemption.rewardId) {
      if (!redemption.reward) {
        res.status(404).json({ message: "Este premio ya no está disponible en el sistema." });
        return;
      }
      await prisma.$transaction(async (tx) => {
        // 1 & 2. Atomic check and deduction
        const updated = await tx.user.updateMany({
          where: { 
            id: redemption.userId,
            points: { gte: redemption.reward!.pointsRequired }
          },
          data: { points: { decrement: redemption.reward!.pointsRequired } }
        });

        if (updated.count === 0) {
          throw new Error("Puntos insuficientes para este canje");
        }

        // 3. Mark as completed
        await tx.redemption.update({
          where: { id: redemption.id },
          data: { status: "COMPLETED", scannedById: staffId }
        });

        // 4. Create history
        await tx.pointHistory.create({
          data: {
            userId: redemption.userId,
            pointsGained: -redemption.reward!.pointsRequired,
            source: "ADMIN",
            description: `Canje de premio: ${redemption.reward!.name} (Staff: ${staffName})`
          }
        });
      });
    } else if (redemption.eventId) {
      if (!redemption.event) {
        res.status(404).json({ message: "Esta promoción ya no está disponible." });
        return;
      }
      // Promo-specific logic
      await prisma.$transaction([
        prisma.redemption.update({
          where: { id: redemption.id },
          data: { status: "COMPLETED", scannedById: staffId }
        }),
        prisma.pointHistory.create({
          data: {
            userId: redemption.userId,
            pointsGained: 0,
            source: "CANJE_PROMO",
            description: `Beneficio canjeado: ${redemption.event.title} (Staff: ${staffName})`
          }
        })
      ]);
    } else if (redemption.vipBenefitId) {
      if (!redemption.vipBenefit) {
        res.status(404).json({ message: "Este beneficio VIP ya no está disponible." });
        return;
      }
      // VIP Benefit - just mark as completed, log history
      await prisma.$transaction([
        prisma.redemption.update({
          where: { id: redemption.id },
          data: { status: "COMPLETED", scannedById: staffId }
        }),
        prisma.pointHistory.create({
          data: {
            userId: redemption.userId,
            pointsGained: 0,
            source: "CANJE_VIP",
            description: `Beneficio VIP canjeado: ${redemption.vipBenefit.title} (Staff: ${staffName})`
          }
        })
      ]);
    }

    res.json({ 
      message: "Canje confirmado con éxito!",
      type: redemption.rewardId ? 'REWARD' : (redemption.vipBenefitId ? 'VIP_BENEFIT' : 'PROMO'),
      details: redemption.reward?.name || redemption.vipBenefit?.title || redemption.event?.title
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

// User cancels their own pending redemption
export const cancelRedemption = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { qrToken } = req.body;

    if (!qrToken) {
      res.status(400).json({ message: "qrToken is required" });
      return;
    }

    const redemption = await prisma.redemption.findUnique({
      where: { qrToken }
    });

    if (!redemption) {
      res.status(404).json({ message: "Canje no encontrado" });
      return;
    }

    if (redemption.userId !== userId) {
      res.status(403).json({ message: "No tienes permiso para cancelar este canje" });
      return;
    }

    if (redemption.status !== "PENDING") {
      res.status(400).json({ message: "Solo se pueden cancelar canjes pendientes" });
      return;
    }

    await prisma.redemption.update({
      where: { id: redemption.id },
      data: { status: "CANCELLED" }
    });

    res.json({ message: "Canje cancelado exitosamente" });
  } catch (error) {
    console.error("Error cancelling redemption:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Admin: Get history of scanned redemptions (tonight or overall)
export const getScannerHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // Return all completed redemptions from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const history = await prisma.redemption.findMany({
      where: {
        status: "COMPLETED",
        updatedAt: { gte: twentyFourHoursAgo }
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        scannedBy: { select: { firstName: true, lastName: true } },
        reward: true,
        event: true,
        vipBenefit: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formattedHistory = history.map(h => ({
      id: h.id,
      time: h.updatedAt,
      scannedByName: h.scannedBy ? `${h.scannedBy.firstName} ${h.scannedBy.lastName}` : 'Sistema',
      userName: `${h.user.firstName} ${h.user.lastName}`,
      type: h.rewardId ? 'REWARD' : (h.vipBenefitId ? 'VIP_BENEFIT' : 'PROMO'),
      details: h.reward?.name || h.vipBenefit?.title || h.event?.title || 'Premio desconocido'
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error fetching scanner history" });
  }
};
