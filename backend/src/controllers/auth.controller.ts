import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service";

const prisma = new PrismaClient();

// Helper to generate 6-digit code
const generateSixDigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dni, firstName, lastName, email, password, whatsapp, birthDate } = req.body;

    if (!whatsapp || whatsapp.trim() === "") {
        res.status(400).json({ message: "El WhatsApp es obligatorio para el registro." });
        return;
    }

    if (!birthDate) {
        res.status(400).json({ message: "La fecha de nacimiento es obligatoria." });
        return;
    }

    if (!/^\d{1,8}$/.test(dni)) {
      res.status(400).json({ message: "DNI inválido. Debe contener solo números (máximo 8)." });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ dni }, { email }] }
    });
    
    if (existingUser) {
       res.status(400).json({ message: "El DNI o Email ya están registrados." });
       return;
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Generate verification code
    const verificationCode = generateSixDigitCode();
    const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        dni,
        firstName,
        lastName,
        email,
        passwordHash,
        whatsapp,
        birthDate: birthDate ? new Date(birthDate) : null,
        verificationCode,
        verificationCodeExpires,
        isEmailVerified: false,
      }
    });

    // Send email in background
    sendVerificationEmail(user.email, verificationCode).catch(console.error);

    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    
    res.status(201).json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        firstName: user.firstName,
        isEmailVerified: user.isEmailVerified 
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const verifyEmail = async (req: any, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({ message: "Email ya verificado" });
      return;
    }

    if (user.verificationCode !== code || (user.verificationCodeExpires && user.verificationCodeExpires < new Date())) {
      res.status(400).json({ message: "Código inválido o expirado" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpires: null
      }
    });

    res.json({ message: "Email verificado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
   try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: "Credenciales inválidas" });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: "Credenciales inválidas" });
      return;
    }

    // Check verification if strict mode is on
    if (!user.isEmailVerified) {
      res.status(401).json({ 
        message: "Por favor verifica tu email para ingresar", 
        isEmailVerified: false,
        userId: user.id 
      });
      return;
    }

    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, points: user.points, membershipLevel: user.membershipLevel, isEmailVerified: user.isEmailVerified }});
   } catch (error) {
     console.error(error);
     res.status(500).json({ message: "Server Error" });
   }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if user exists for security, but we'll show success
      res.json({ message: "Si el correo está registrado, recibirás un código" });
      return;
    }

    const resetCode = generateSixDigitCode();
    const resetCodeExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetCode, resetCodeExpires }
    });

    sendPasswordResetEmail(user.email, resetCode).catch(console.error);
    res.json({ message: "Código enviado" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.resetCode !== code || (user.resetCodeExpires && user.resetCodeExpires < new Date())) {
      res.status(400).json({ message: "Código inválido o expirado" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetCode: null,
        resetCodeExpires: null
      }
    });

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, dni: true, firstName: true, lastName: true, email: true, whatsapp: true, points: true, membershipLevel: true, role: true, isEmailVerified: true }
    });

    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    if (!user.isEmailVerified) {
       res.status(401).json({ message: "Email no verificado", isEmailVerified: false });
       return;
    }

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
          select: { id: true, dni: true, firstName: true, lastName: true, email: true, whatsapp: true, points: true, membershipLevel: true, role: true, isEmailVerified: true }
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

export const updatePushToken = async (req: any, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    await prisma.user.update({
      where: { id: req.user.id },
      data: { expoPushToken: token }
    });
    res.json({ message: "Push token updated" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
