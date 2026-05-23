import { Request, Response } from "express";
import { awardPointsToUser } from "../services/user.service";
import { prisma } from "../utils/prisma";

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

// Public leaderboard — top 10 by points
export const getLeaderboard = async (req: any, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const top = await prisma.user.findMany({
      where: { isBlocked: false, role: 'CUSTOMER' },
      orderBy: { points: 'desc' },
      take: 10,
      select: { id: true, firstName: true, lastName: true, points: true, membershipLevel: true, avatarId: true }
    });

    const leaderboard = top.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      firstName: u.firstName,
      lastName: u.id === currentUserId ? u.lastName : `${u.lastName.charAt(0)}.`,
      points: u.points,
      membershipLevel: u.membershipLevel,
      avatarId: u.avatarId,
      isMe: u.id === currentUserId,
    }));

    // Si el usuario actual no está en top 10, agregarlo al final
    if (currentUserId && !leaderboard.find(u => u.isMe)) {
      const me = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, firstName: true, lastName: true, points: true, membershipLevel: true, avatarId: true }
      });
      if (me) {
        const myRank = await prisma.user.count({
          where: { points: { gt: me.points }, isBlocked: false, role: 'CUSTOMER' }
        });
        leaderboard.push({
          rank: myRank + 1,
          id: me.id,
          firstName: me.firstName,
          lastName: me.lastName,
          points: me.points,
          membershipLevel: me.membershipLevel,
          avatarId: me.avatarId,
          isMe: true,
        });
      }
    }

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Authenticated user
export const getMyPointsHistory = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 50;
    const history = await prisma.pointHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
