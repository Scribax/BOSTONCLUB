import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Only admin
export const addPoints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, pointsGained, source, description } = req.body;
    
    if (!userId || !pointsGained || !source) {
       res.status(400).json({ message: "Missing required fields" });
       return;
    }

    const newHistory = await prisma.pointHistory.create({
      data: {
        userId,
        pointsGained,
        source, // "PURCHASE", "QR_CHECKIN", "ADMIN", "BIRTHDAY"
        description
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        points: { increment: pointsGained }
      }
    });

    res.json({ message: "Points added successfully", pointsGained, newTotal: updatedUser.points });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Authenticated user matching ID or Admin
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
