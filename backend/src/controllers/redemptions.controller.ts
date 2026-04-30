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

    // --- GLOBAL PENDING CHECK ---
    // 1. Auto-cleanup expired ones first
    await prisma.redemption.updateMany({
      where: {
        userId,
        status: "PENDING",
        expiresAt: { lte: new Date() }
      },
      data: { status: "CANCELLED" }
    });

    // 2. Check if user already has ONE active redemption (any type)
    const activeRedemption = await prisma.redemption.findFirst({
      where: {
        userId,
        status: "PENDING",
        expiresAt: { gt: new Date() }
      }
    });

    if (activeRedemption) {
      res.status(400).json({ 
        message: "Ya tienes un código QR pendiente. Úsalo o cancélalo antes de generar uno nuevo." 
      });
      return;
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

      if (user.points < reward.pointsRequired) {
        res.status(400).json({ message: "No tienes puntos suficientes." });
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
        const sixteenHoursAgo = new Date(Date.now() - 16 * 60 * 60 * 1000);
        const existing = await prisma.redemption.findFirst({
          where: {
            userId,
            vipBenefitId,
            createdAt: { gte: sixteenHoursAgo },
            status: { in: ["PENDING", "COMPLETED"] }
          }
        });
        if (existing) {
          res.status(400).json({ message: "Ya usaste este beneficio recientemente. Vuelve más tarde." });
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
    const { qrToken: rawToken } = req.body;
    const staffId = (req as any).user?.userId || (req as any).user?.id;

    // TOTP Dynamic QR Check (Format: token|timestamp)
    let qrToken = rawToken;
    if (rawToken && rawToken.includes('|')) {
      const parts = rawToken.split('|');
      qrToken = parts[0];
      const timestamp = parseInt(parts[1], 10);
      
      if (isNaN(timestamp) || Date.now() - timestamp > 60000) { // 60 seconds leeway for network latency
        res.status(400).json({ message: "El código QR ha expirado (Anti-Fraude). Por favor pídale al cliente que le muestre el QR actual de su pantalla." });
        return;
      }
    }

    const redemption = await prisma.redemption.findUnique({
      where: { qrToken },
      include: { user: true, reward: true, event: true, vipBenefit: true }
    });

    if (!redemption) {
      res.status(404).json({ message: "Invalid QR or Redemption not found" });
      return;
    }

    if (redemption.status !== "PENDING") {
      res.status(400).json({ message: "Este QR ya fue utilizado anteriormente." });
      return;
    }

    if (redemption.expiresAt && redemption.expiresAt < new Date()) {
      res.status(400).json({ message: "Este QR ha expirado. El usuario debe generar uno nuevo." });
      return;
    }

    // Security: Ensure user is still verified at the moment of scan
    if (!redemption.user.isEmailVerified) {
       res.status(403).json({ message: "El usuario debe verificar su email antes de realizar canjes." });
       return;
    }

    const staff = await prisma.user.findUnique({ where: { id: staffId }, select: { firstName: true, lastName: true } });
    const staffName = staff ? `${staff.firstName} ${staff.lastName}` : "Staff";

    // Reward-specific logic (Deduct points)
    if (redemption.rewardId) {
      if (!redemption.reward || !redemption.reward.isActive) {
        res.status(404).json({ message: "Este premio ya no está disponible o se quedó sin stock." });
        return;
      }
      await prisma.$transaction(async (tx) => {
        // 1. Mark as completed ONLY if it is still pending (Atomic update)
        const updateResult = await tx.redemption.updateMany({
          where: { id: redemption.id, status: "PENDING" },
          data: { status: "COMPLETED", scannedById: staffId }
        });

        if (updateResult.count === 0) {
          throw new Error("Este QR ya fue procesado o no es válido.");
        }

        // 2. Deduct points atomically
        const userUpdate = await tx.user.updateMany({
          where: { 
            id: redemption.userId,
            points: { gte: redemption.reward!.pointsRequired }
          },
          data: { points: { decrement: redemption.reward!.pointsRequired } }
        });

        if (userUpdate.count === 0) {
          throw new Error("El usuario no tiene puntos suficientes para completar este canje.");
        }

        // 3. Create history
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
      await prisma.$transaction(async (tx) => {
        const updateResult = await tx.redemption.updateMany({
          where: { id: redemption.id, status: "PENDING" },
          data: { status: "COMPLETED", scannedById: staffId }
        });

        if (updateResult.count === 0) {
          throw new Error("Este QR ya fue procesado.");
        }

        await tx.pointHistory.create({
          data: {
            userId: redemption.userId,
            pointsGained: 0,
            source: "CANJE_PROMO",
            description: `Beneficio canjeado: ${redemption.event!.title} (Staff: ${staffName})`
          }
        });
      });
    } else if (redemption.vipBenefitId) {
      if (!redemption.vipBenefit) {
        res.status(404).json({ message: "Este beneficio VIP ya no está disponible." });
        return;
      }
      await prisma.$transaction(async (tx) => {
        const updateResult = await tx.redemption.updateMany({
          where: { id: redemption.id, status: "PENDING" },
          data: { status: "COMPLETED", scannedById: staffId }
        });

        if (updateResult.count === 0) {
          throw new Error("Este QR ya fue procesado.");
        }

        await tx.pointHistory.create({
          data: {
            userId: redemption.userId,
            pointsGained: 0,
            source: "CANJE_VIP",
            description: `Beneficio VIP canjeado: ${redemption.vipBenefit!.title} (Staff: ${staffName})`
          }
        });
      });
    }

    // Smart ID check: Only alert if reward is adult-only AND user is younger than 25
    let requiresIdCheck = false;
    if (redemption.reward?.isAdultOnly) {
      const birthDate = redemption.user.birthDate ? new Date(redemption.user.birthDate) : null;
      if (birthDate) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        
        if (age < 25) {
          requiresIdCheck = true;
        }
      } else {
        // No birthdate on record? Better check ID just in case
        requiresIdCheck = true;
      }
    }

    res.json({ 
      message: "¡Canje confirmado con éxito!",
      type: redemption.rewardId ? 'REWARD' : (redemption.vipBenefitId ? 'VIP_BENEFIT' : 'PROMO'),
      details: redemption.reward?.name || redemption.vipBenefit?.title || redemption.event?.title,
      requiresIdCheck
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

// User: Get active (pending and not expired) redemption for the dashboard
export const getActiveRedemption = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const active = await prisma.redemption.findFirst({
      where: {
        userId,
        status: "PENDING",
        expiresAt: { gt: new Date() }
      },
      include: {
        reward: { select: { name: true } },
        event: { select: { title: true } },
        vipBenefit: { select: { title: true } }
      }
    });

    if (!active) {
      res.json(null);
      return;
    }

    res.json({
      id: active.id,
      qrToken: active.qrToken,
      expiresAt: active.expiresAt,
      title: active.reward?.name || active.vipBenefit?.title || active.event?.title || "Canje pendiente"
    });
  } catch (error) {
    console.error("[GetActiveRedemption Error]", error);
    res.status(500).json({ message: "Server Error" });
  }
};
