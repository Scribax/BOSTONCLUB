import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { calculateMembershipLevel } from "../services/user.service";

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, sort } = req.query;
    
    const where = search
      ? {
          OR: [
            { dni: { contains: search as string } },
            { firstName: { contains: search as string } },
            { lastName: { contains: search as string } },
            { email: { contains: search as string } },
          ],
        }
      : {};

    let orderBy: any = { firstName: "asc" as const };

    if (sort === "dni") {
      orderBy = { dni: "asc" as const };
    } else if (sort === "points") {
      orderBy = { points: "desc" as const };
    }


    const users = await prisma.user.findMany({
      where,
      orderBy,
      select: {
        id: true,
        dni: true,
        firstName: true,
        lastName: true,
        email: true,
        whatsapp: true,
        points: true,
        membershipLevel: true,
        role: true,
        isBlocked: true,
        vipRewardSentAt: true,
        createdAt: true,
        birthDate: true,
        referralCode: true,
        _count: {
          select: { referrals: true }
        }
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const adjustPoints = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { points, reason, mode } = req.body;

    const updateData = mode === "set" 
      ? { points: points } // Set to absolute value
      : { points: { increment: points } }; // Increment/Decrement

    let user = await prisma.user.update({
      where: { id: id as string },
      data: updateData,
    });

    // Check for level upgrade
    const settings = await prisma.clubSettings.findUnique({ where: { id: "singleton" } });
    if (settings) {
      const newLevel = calculateMembershipLevel(user.points, settings);

      if (user.membershipLevel !== newLevel) {
        user = await prisma.user.update({
          where: { id: id as string },
          data: { membershipLevel: newLevel }
        });
      }
    }

    // Log in history
    if (points !== 0) {
      await prisma.pointHistory.create({
        data: {
          userId: id as string,
          pointsGained: points,
          source: "ADMIN",
          description: reason || (points > 0 ? "Puntos agregados por Admin" : "Puntos deducidos por Admin"),
        },
      });
    }

    res.json({ message: "Points updated", points: user.points, level: user.membershipLevel });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


export const toggleBlockUser = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    if (adminId === id) {
      res.status(400).json({ message: "No puedes bloquearte a ti mismo" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: id as string } });
    if (!user) { res.status(404).json({ message: "User not found" }); return; }

    const updated = await prisma.user.update({
      where: { id: id as string },
      data: { isBlocked: !user.isBlocked },
    });
    res.json({ message: updated.isBlocked ? "User blocked" : "User unblocked", isBlocked: updated.isBlocked });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const toggleVipRewardStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // true = sent, false = reset

    const user = await prisma.user.update({
      where: { id: id as string },
      data: {
        vipRewardSentAt: status ? new Date() : null
      }
    });

    res.json({ message: "Estado VIP actualizado", vipRewardSentAt: user.vipRewardSentAt });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // Delete related records first
    await prisma.pointHistory.deleteMany({ where: { userId: id as string } });
    await prisma.redemption.deleteMany({ where: { userId: id as string } });
    await prisma.notification.deleteMany({ where: { userId: id as string } });
    await prisma.visit.deleteMany({ where: { userId: id as string } });
    await prisma.posTransaction.deleteMany({ where: { userId: id as string } }); // FIX: Avoid FK constraint error
    await prisma.user.delete({ where: { id: id as string } });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
export const getUserHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const [history, redemptions] = await Promise.all([
      prisma.pointHistory.findMany({
        where: { userId: id as string },
        orderBy: { createdAt: "desc" }
      }),
      prisma.redemption.findMany({
        where: { userId: id as string },
        orderBy: { createdAt: "desc" },
        include: {
          reward: { select: { name: true } },
          event: { select: { title: true } }
        }
      })
    ]);

    res.json({ history, redemptions });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const getUserReferrals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const referrals = await prisma.user.findMany({
      where: { referredById: id as string },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true
      }
    });
    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
