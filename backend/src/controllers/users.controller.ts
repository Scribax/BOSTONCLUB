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
    const { id: userId } = req.params;
    const { points: delta, reason, mode } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: userId as string },
        select: { points: true, membershipLevel: true }
      });

      if (!currentUser) throw new Error("User not found");

      let finalPointsValue: number;
      if (mode === "set") {
        finalPointsValue = Math.max(0, delta);
      } else {
        finalPointsValue = Math.max(0, currentUser.points + delta);
      }

      const actualDelta = finalPointsValue - currentUser.points;

      let user = await tx.user.update({
        where: { id: userId as string },
        data: { points: finalPointsValue },
      });

      const settings = await tx.clubSettings.findUnique({ where: { id: "singleton" } });
      if (settings) {
        const newLevel = calculateMembershipLevel(user.points, settings);
        if (user.membershipLevel !== newLevel) {
          user = await tx.user.update({
            where: { id: userId as string },
            data: { membershipLevel: newLevel }
          });
        }
      }

      if (actualDelta !== 0) {
        await tx.pointHistory.create({
          data: {
            userId: userId as string,
            pointsGained: actualDelta,
            source: "ADMIN",
            description: reason || (actualDelta > 0 ? "Puntos agregados por Admin" : "Puntos deducidos por Admin"),
          },
        });
      }

      return user;
    });

    res.json({ message: "Points updated", points: result.points, level: result.membershipLevel });
  } catch (error: any) {
    console.error(error);
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
    // 1. Nullify referrals so they don't break on FK constraint
    await prisma.user.updateMany({
      where: { referredById: id as string },
      data: { referredById: null }
    });
    
    // 2. Delete related records
    await prisma.pointHistory.deleteMany({ where: { userId: id as string } });
    await prisma.redemption.deleteMany({ where: { userId: id as string } });
    await prisma.notification.deleteMany({ where: { userId: id as string } });
    await prisma.visit.deleteMany({ where: { userId: id as string } });
    await prisma.posTransaction.deleteMany({ where: { userId: id as string } }); 
    
    // 3. Delete the user
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
