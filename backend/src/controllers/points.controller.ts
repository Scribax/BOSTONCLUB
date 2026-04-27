import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { awardPointsToUser } from "../services/user.service";

const prisma = new PrismaClient();

// Only admin
export const addPoints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, pointsGained, source, description } = req.body;
    
    if (!userId || !pointsGained || !source) {
       res.status(400).json({ message: "Missing required fields" });
       return;
    }

    const result = await prisma.$transaction(async (tx) => {
      return awardPointsToUser(tx, userId, Number(pointsGained), source, description || source);
    });

    res.json({ 
      message: "Points added successfully", 
      pointsGained: result.finalPoints,
      multiplier: result.multiplier,
      streak: result.newStreak,
      newTotal: result.updatedUser.points 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Authenticated user
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
