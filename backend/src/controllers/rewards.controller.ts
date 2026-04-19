import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllRewards = async (req: Request, res: Response): Promise<void> => {
  try {
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { pointsRequired: "asc" }
    });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const createReward = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, pointsRequired, imageUrl, type } = req.body;
    
    const reward = await prisma.reward.create({
      data: {
        name,
        description,
        pointsRequired: Number(pointsRequired),
        imageUrl,
        type: type || "BEBIDA"
      }
    });

    res.status(201).json(reward);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteReward = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.reward.update({
      where: { id: id as string },
      data: { isActive: false }
    });
    res.json({ message: "Reward deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateReward = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, pointsRequired, type, isActive } = req.body;
    
    const reward = await prisma.reward.update({
      where: { id: id as string },
      data: {
        name,
        description,
        pointsRequired: pointsRequired ? Number(pointsRequired) : undefined,
        type,
        isActive
      }
    });
    res.json(reward);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
