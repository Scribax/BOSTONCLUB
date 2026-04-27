import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const getAllRewards = async (req: Request, res: Response): Promise<void> => {
  try {
     let isMinor = true; 

     const authHeader = req.headers.authorization;
     if (authHeader && authHeader.startsWith("Bearer ")) {
         const token = authHeader.split(" ")[1];
         try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            if (decoded && decoded.id) {
               const user = await prisma.user.findUnique({
                  where: { id: decoded.id },
                  select: { birthDate: true, role: true }
               });
               
               if (user && user.role === "ADMIN") {
                  isMinor = false; 
               } else if (user && user.birthDate) {
                  const today = new Date();
                  const birthDate = new Date(user.birthDate);
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const m = today.getMonth() - birthDate.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                     age--;
                  }
                  if (age >= 18) {
                     isMinor = false;
                  }
               }
            }
         } catch(e) {
            // invalid token, just treat as minor
         }
     }

     const whereClause: any = { isActive: true };
     if (isMinor) {
        whereClause.isAdultOnly = false;
     }

    const rewards = await prisma.reward.findMany({
      where: whereClause,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }]
    });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const createReward = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, pointsRequired, imageUrl, type, isAdultOnly } = req.body;
    
    const reward = await prisma.reward.create({
      data: {
        name,
        description,
        pointsRequired: Number(pointsRequired),
        imageUrl,
        type: type || "BEBIDA",
        isAdultOnly: isAdultOnly || false
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
    const { name, description, pointsRequired, type, isActive, imageUrl, isAdultOnly } = req.body;
    
    const reward = await prisma.reward.update({
      where: { id: id as string },
      data: {
        name,
        description,
        pointsRequired: pointsRequired ? Number(pointsRequired) : undefined,
        type,
        isActive,
        imageUrl,
        isAdultOnly
      }
    });
    res.json(reward);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const reorderRewards = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      res.status(400).json({ message: "Orders must be an array" });
      return;
    }
    const updates = orders.map((item: { id: string; order: any }) =>
      prisma.reward.update({
        where: { id: item.id },
        data: { order: parseInt(item.order.toString()) }
      })
    );
    await prisma.$transaction(updates);
    res.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("[Reorder Rewards Error]", error);
    res.status(500).json({ message: "Server Error" });
  }
};
