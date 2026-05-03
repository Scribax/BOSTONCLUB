import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Almacén temporal de tokens
const tokenStore = new Map<string, { userId: string, expiresAt: number }>();

export const generateMemberToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const token = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = Date.now() + 60 * 1000;
    tokenStore.set(token, { userId, expiresAt });
    res.json({ token, expiresAt });
  } catch (error) {
    res.status(500).json({ message: "Error al generar token" });
  }
};

export const creditPointsByToken = async (req: Request, res: Response) => {
  try {
    const { token, points } = req.body;
    if (!token || !points) return res.status(400).json({ message: "Token y puntos requeridos" });
    const tokenData = tokenStore.get(token);
    if (!tokenData) return res.status(404).json({ message: "Token inválido o expirado" });
    if (tokenData.expiresAt < Date.now()) {
      tokenStore.delete(token);
      return res.status(400).json({ message: "El token ha expirado" });
    }
    const userId = tokenData.userId;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: Number(points) } }
    });
    // Registrar transacción
    await prisma.pointTransaction.create({
      data: {
        userId,
        amount: Number(points),
        type: "CREDIT",
        reason: "Escaneo de Carnet Digital (Caja)"
      }
    });
    tokenStore.delete(token);
    res.json({ 
      message: `¡Éxito! Se acreditaron ${points} puntos a ${user.firstName}`,
      userName: user.firstName,
      newPoints: user.points
    });
  } catch (error) {
    res.status(500).json({ message: "Error al procesar la acreditación" });
  }
};
