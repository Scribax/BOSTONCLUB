import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { sendPushNotifications } from '../services/push.service';

const prisma = new PrismaClient();

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Total Users
    const totalUsers = await prisma.user.count({
      where: { role: "CUSTOMER" }
    });

    // 2. Total Points Used (Only from COMPLETED redemptions)
    // We sum the PointHistory entries with negative points (which represent redemptions)
    const pointsHistoryStats = await prisma.pointHistory.aggregate({
      where: {
        pointsGained: { lt: 0 }
      },
      _sum: {
        pointsGained: true
      }
    });
    
    const totalPointsUsed = Math.abs(pointsHistoryStats._sum.pointsGained || 0);

    // 3. Latest Activity (All point movements: Redemptions, Promos, Admin additions)
    const latestActivity = await prisma.pointHistory.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // 4. Total Points in Circulation (Unredeemed)
    const pointsAggregation = await prisma.user.aggregate({
      _sum: {
        points: true
      },
      where: { role: "CUSTOMER" }
    });
    const totalPointsBalance = pointsAggregation._sum.points || 0;

    // 5. Chart Data (Last 7 Days: Points Given vs Redeemed)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const historySevenDays = await prisma.pointHistory.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { pointsGained: true, createdAt: true }
    });

    const chartMap = new Map();
    // Initialize map with last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit' });
      chartMap.set(key, { name: key, entregados: 0, canjeados: 0 });
    }

    historySevenDays.forEach(h => {
      const key = h.createdAt.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit' });
      if (chartMap.has(key)) {
        const item = chartMap.get(key);
        if (h.pointsGained > 0) {
          item.entregados += h.pointsGained;
        } else {
          item.canjeados += Math.abs(h.pointsGained);
        }
      }
    });

    const chartData = Array.from(chartMap.values());

    res.json({
      totalUsers,
      totalPointsUsed,
      totalPointsBalance,
      latestActivity: latestActivity.map(h => ({
        id: h.id,
        description: h.description,
        userName: `${h.user.firstName} ${h.user.lastName}`,
        points: h.pointsGained,
        createdAt: h.createdAt
      })),
      chartData
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const exportAudits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate))
      };
    } else {
      // Default to last 30 days if no range is specified
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: thirtyDaysAgo };
    }

    const history = await prisma.pointHistory.findMany({
      where: { createdAt: dateFilter },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    // We can also fetch redemptions to match staff names to these histories if needed,
    // but a quick way to generate CSV is just map PointHistory.
    
    // Create CSV content
    const header = "FECHA;HORA;TIPO DE OPERACIÓN;DESCRIPCIÓN;SOCIO;EMAIL;PUNTOS INVOLUCRADOS\n";
    const rows = history.map(h => {
      const date = new Date(h.createdAt);
      const fecha = date.toLocaleDateString('es-AR');
      const hora = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      const socio = `"${h.user.firstName} ${h.user.lastName}"`;
      const email = `"${h.user.email}"`;
      const descripcion = `"${h.description}"`;
      const tipo = h.pointsGained < 0 ? "CANJE" : (h.pointsGained > 0 ? "ACREDITACIÓN" : "VALIDACIÓN BENEFICIO");
      const puntos = h.pointsGained;

      return `${fecha};${hora};${tipo};${descripcion};${socio};${email};${puntos}`;
    }).join("\n");

    const csvData = "\uFEFF" + header + rows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="auditoria_movimientos.csv"');
    res.send(csvData);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Error generating export" });
  }
};

export const sendCustomPush = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, body, audience } = req.body;
    
    if (!title || !body) {
      res.status(400).json({ message: "Title and body are required" });
      return;
    }

    let users;
    if (audience === "VIP") {
      users = await prisma.user.findMany({
        where: { 
          expoPushToken: { not: null },
          membershipLevel: { in: ["ORO", "PLATINO", "DIAMANTE", "SÚPER VIP"] }
        },
        select: { expoPushToken: true }
      });
    } else {
      users = await prisma.user.findMany({
        where: { expoPushToken: { not: null } },
        select: { expoPushToken: true }
      });
    }

    const messages: ExpoPushMessage[] = [];
    const uniqueTokens = new Set<string>();
    
    for (const user of users) {
      if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        uniqueTokens.add(user.expoPushToken);
      }
    }

    for (const token of uniqueTokens) {
      messages.push({
        to: token,
        sound: 'default',
        priority: 'high',
        title: title,
        body: body,
        data: { type: 'CUSTOM_CAMPAIGN' },
      });
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
    }

    res.json({ message: `Campaña enviada a ${uniqueTokens.size} dispositivos.` });
  } catch (error) {
    console.error("Push campaign error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
