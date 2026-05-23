import { Request, Response } from "express";
import crypto from "crypto";
import Redis from "ioredis";
import { prisma } from "../utils/prisma";
import { awardPointsToUser } from "../services/user.service";

const TOKEN_TTL_SECONDS = 60;
const REDIS_PREFIX = "member_qr:";

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: Number(process.env.REDIS_PORT) || 6379,
});

export const generateMemberToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const token = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = Date.now() + TOKEN_TTL_SECONDS * 1000;
    await redis.set(`${REDIS_PREFIX}${token}`, userId, 'EX', TOKEN_TTL_SECONDS);
    res.json({ token, expiresAt });
  } catch (error) {
    res.status(500).json({ message: "Error al generar token" });
  }
};

export const verifyMemberToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const userId = await redis.get(`${REDIS_PREFIX}${token}`);

    if (!userId) {
      return res.status(404).json({ message: "Token inválido o expirado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        membershipLevel: true,
        points: true,
        avatarId: true
      }
    });

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error al verificar token" });
  }
};

export const creditPointsByToken = async (req: Request, res: Response) => {
  try {
    const { token, points } = req.body;
    if (!token || !points) return res.status(400).json({ message: "Token y puntos requeridos" });
    
    const userId = await redis.get(`${REDIS_PREFIX}${token}`);
    if (!userId) {
      return res.status(404).json({ message: "Token inválido o expirado" });
    }

    const result = await prisma.$transaction(async (tx) => {
      return awardPointsToUser(tx, userId, Number(points), "CARNET_DIGITAL", "Escaneo de Carnet Digital en Caja");
    });

    await redis.del(`${REDIS_PREFIX}${token}`);
    res.json({ 
      message: `¡Éxito! Se acreditaron ${result.finalPoints} puntos`,
      userName: result.updatedUser.firstName,
      newPoints: result.updatedUser.points
    });
  } catch (error) {
    res.status(500).json({ message: "Error al procesar la acreditación" });
  }
};
