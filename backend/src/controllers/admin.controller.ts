import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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
      }))
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
