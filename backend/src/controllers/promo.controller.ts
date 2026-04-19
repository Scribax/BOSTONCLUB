import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Admin generates a token
export const generatePromoToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { points, type, expiresMinutes } = req.body;
    
    const token = uuidv4();
    let expiresAt = null;
    
    if (expiresMinutes) {
      expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiresMinutes);
    }

    const promo = await prisma.promoToken.create({
      data: {
        token,
        points: Number(points),
        type, // "SINGLE_USE" or "DAILY_CHECKIN"
        expiresAt
      }
    });

    res.json(promo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// User claims a token
export const claimPromoToken = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    const promo = await prisma.promoToken.findUnique({
      where: { token }
    });

    if (!promo) {
      res.status(404).json({ message: "Código no válido o inexistente" });
      return;
    }

    // Validation: Expiration
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      res.status(400).json({ message: "El código ha expirado" });
      return;
    }

    // Validation: Single Use
    if (promo.type === "SINGLE_USE" && promo.isUsed) {
      res.status(400).json({ message: "Este código ya ha sido reclamado" });
      return;
    }

    // Validation: Daily Check-in (24h cooldown)
    if (promo.type === "DAILY_CHECKIN") {
      const lastCheckin = await prisma.pointHistory.findFirst({
        where: {
          userId,
          source: "DAILY_CHECKIN",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      if (lastCheckin) {
        res.status(400).json({ message: "Ya reclamaste tus puntos de mesa hoy. ¡Vuelve mañana!" });
        return;
      }
    }

    // Grant points with ATOMIC transaction
    await prisma.$transaction(async (tx) => {
      // RE-VERIFY inside transaction to prevent race conditions
      if (promo.type === "SINGLE_USE") {
        const freshPromo = await tx.promoToken.findUnique({ where: { id: promo.id } });
        if (!freshPromo || freshPromo.isUsed) {
          throw new Error("Este código ya fue reclamado por otra persona.");
        }
        
        // Mark as used IMMEDIATELY
        await tx.promoToken.update({
          where: { id: promo.id },
          data: { isUsed: true }
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { points: { increment: promo.points } }
      });

      // Fetch settings to check for Event Mode reason
      const settings = await tx.clubSettings.findUnique({ where: { id: "singleton" } });
      const isEvent = settings?.isEventDay && promo.type === "DAILY_CHECKIN";

      await tx.pointHistory.create({
        data: {
          userId,
          pointsGained: promo.points,
          source: promo.type === "DAILY_CHECKIN" ? "DAILY_CHECKIN" : "PROMO",
          description: isEvent 
            ? `Bono de Evento Especial: ${promo.points} PTS` 
            : (promo.type === "DAILY_CHECKIN" ? "Check-in diario en mesa" : `Regalo de puntos: ${promo.points}`)
        }
      });
    });

    res.json({ message: `¡Felicidades! Ganaste ${promo.points} puntos`, pointsGained: promo.points });

  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message || "Error al reclamar los puntos" });
  }
};

