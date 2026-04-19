import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.header("Authorization")?.split(" ")[1];
  
  if (!token) {
    res.status(401).json({ message: "No token, authorization denied" });
    return;
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    
    // VERIFICACIÓN DE SEGURIDAD EN TIEMPO REAL
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { isBlocked: true, role: true }
    });

    if (!user) {
      res.status(401).json({ message: "Usuario no existe" });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ message: "ACCOUNT_BLOCKED" });
      return;
    }

    req.user = { ...decoded, role: user.role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};


export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === "ADMIN") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin only." });
  }
};
