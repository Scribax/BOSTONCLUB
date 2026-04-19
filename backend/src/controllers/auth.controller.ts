import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dni, firstName, lastName, email, password, whatsapp, birthDate } = req.body;

    // Validación estricta de DNI
    if (!/^\d{1,8}$/.test(dni)) {
      res.status(400).json({ message: "DNI inválido. Debe contener solo números (máximo 8)." });
      return;
    }

    
    // Check if DNI or email exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ dni }, { email }] }
    });
    
    if (existingUser) {
       res.status(400).json({ message: "User with this DNI or email already exists" });
       return;
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const user = await prisma.user.create({
      data: {
        dni,
        firstName,
        lastName,
        email,
        passwordHash,
        whatsapp,
        birthDate: birthDate ? new Date(birthDate) : null,
      }
    });

    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName }});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
   try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }
    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, points: user.points, membershipLevel: user.membershipLevel }});
   } catch (error) {
     console.error(error);
     res.status(500).json({ message: "Server Error" });
   }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, dni: true, firstName: true, lastName: true, email: true, whatsapp: true, points: true, membershipLevel: true, role: true }
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // AUTO-LEVEL SYNC: Ensure existing users get upgraded if they have the points
    const settings = await prisma.clubSettings.findUnique({ where: { id: "singleton" } });
    if (settings) {
      let correctLevel = "BRONCE";
      if (user.points >= settings.superVipThreshold) correctLevel = "SÚPER VIP";
      else if (user.points >= settings.diamondThreshold) correctLevel = "DIAMANTE";
      else if (user.points >= settings.platinumThreshold) correctLevel = "PLATINO";
      else if (user.points >= settings.goldThreshold) correctLevel = "ORO";

      if (user.membershipLevel !== correctLevel) {
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { membershipLevel: correctLevel },
          select: { id: true, dni: true, firstName: true, lastName: true, email: true, whatsapp: true, points: true, membershipLevel: true, role: true }
        });
        res.json(updatedUser);
        return;
      }
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateMe = async (req: any, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, whatsapp } = req.body;
    
    // Validaciones básicas
    if (whatsapp && !/^\d+$/.test(whatsapp)) {
       res.status(400).json({ message: "El WhatsApp debe contener solo números." });
       return;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        whatsapp
      },
      select: { id: true, firstName: true, lastName: true, whatsapp: true, email: true }
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
};

