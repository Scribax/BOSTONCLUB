import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service";
import { calculateMembershipLevel } from "../services/user.service";

// Define a custom Request type that includes the user from JWT
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const prisma = new PrismaClient();

// Helper to generate 6-digit code
const generateSixDigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to generate a unique referral code like "BST-K3X9"
const generateReferralCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BST-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dni, firstName, lastName, password, whatsapp, birthDate, referralCode: incomingReferralCode } = req.body;
    const email = (req.body.email || "").toLowerCase().trim();

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

    // Generate unique referral code for this new user
    let referralCode: string | null = null;
    let attempts = 0;
    while (!referralCode && attempts < 10) {
      const candidate = generateReferralCode();
      const exists = await prisma.user.findUnique({ where: { referralCode: candidate } });
      if (!exists) referralCode = candidate;
      attempts++;
    }

    // Handle incoming referral code (flexible: with or without dash)
    let referredById: string | undefined = undefined;
    if (incomingReferralCode) {
      let normalized = incomingReferralCode.trim().toUpperCase().replace(/-/g, '');
      if (normalized.startsWith('BST') && normalized.length === 7) {
        normalized = `BST-${normalized.substring(3)}`;
      }
      
      const referrer = await prisma.user.findUnique({ 
        where: { referralCode: normalized } 
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }

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
        referralCode,
        referredById
      }
    });

    // Referral logic moved to verifyEmail for security

    // Send email in background
    sendVerificationEmail(user.email, verificationCode).catch(console.error);

    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    
    const settings = await prisma.clubSettings.findUnique({ where: { id: "singleton" } });

    res.status(201).json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        firstName: user.firstName,
        isEmailVerified: user.isEmailVerified,
        referralRewardReferrer: settings?.referralRewardReferrer || 500,
        referralRewardReferee: settings?.referralRewardReferee || 200
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const verifyEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    if (!req.user) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }
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

    // Reward both users if referred, NOW that email is verified
    if (user.referredById) {
      const settings = await prisma.clubSettings.findUnique({ where: { id: "singleton" } });
      const referrerReward = settings?.referralRewardReferrer || 500;
      const refereeReward = settings?.referralRewardReferee || 200;

      await prisma.$transaction(async (tx) => {
        // Check if referral was already paid (prevent double paying if somehow verifyEmail runs twice before updating isEmailVerified)
        const alreadyPaid = await tx.pointHistory.findFirst({
          where: { userId: user.id, source: 'REFERIDO' }
        });
        
        if (!alreadyPaid) {
          // Bonus for the referrer
          const updatedReferrer = await tx.user.update({
            where: { id: user.referredById! },
            data: { points: { increment: referrerReward } }
          });
          await tx.pointHistory.create({
            data: { userId: user.referredById!, pointsGained: referrerReward, source: 'REFERIDO', description: `Amigo ${user.firstName} verificó su cuenta con tu código` }
          });

          // Upgrade referrer level if needed
          if (settings) {
            const { calculateMembershipLevel } = await import("../services/user.service");
            const newLevel = calculateMembershipLevel(updatedReferrer.points, settings);
            if (updatedReferrer.membershipLevel !== newLevel) {
              await tx.user.update({ where: { id: user.referredById! }, data: { membershipLevel: newLevel } });
            }
          }

          // Bonus for the new user
          await tx.user.update({ where: { id: user.id }, data: { points: { increment: refereeReward } } });
          await tx.pointHistory.create({
            data: { userId: user.id, pointsGained: refereeReward, source: 'REFERIDO', description: 'Bono por unirte con código de amigo' }
          });
        }
      });
    }

    res.json({ message: "Email verificado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const resendVerificationCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({ message: "El email ya está verificado" });
      return;
    }

    const verificationCode = generateSixDigitCode();
    const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode, verificationCodeExpires }
    });

    sendVerificationEmail(user.email, verificationCode).catch(console.error);
    res.json({ message: "Nuevo código enviado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
   try {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase().trim();
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
      const payload = { id: user.id, role: user.role };
      const pendingToken = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '15m' });
      
      res.status(401).json({ 
        message: "Por favor verifica tu email para ingresar", 
        isEmailVerified: false,
        userId: user.id,
        token: pendingToken
      });
      return;
    }

    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    
    const settings = await prisma.clubSettings.findUnique({ where: { id: "singleton" } });

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        firstName: user.firstName, 
        points: user.points, 
        membershipLevel: user.membershipLevel, 
        isEmailVerified: user.isEmailVerified,
        referralCode: user.referralCode,
        referralRewardReferrer: settings?.referralRewardReferrer || 500,
        referralRewardReferee: settings?.referralRewardReferee || 200
      }
    });
   } catch (error) {
     console.error(error);
     res.status(500).json({ message: "Server Error" });
   }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = req.body.email?.toLowerCase().trim();
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
    const { code, newPassword } = req.body;
    const email = req.body.email?.toLowerCase().trim();
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

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }
    let user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { 
        id: true, dni: true, firstName: true, lastName: true, 
        email: true, whatsapp: true, points: true, membershipLevel: true, 
        role: true, isEmailVerified: true,
        streak: true, lastStreakDate: true,
        referralCode: true, referredById: true
      }
    });

    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    if (!user.isEmailVerified) {
       res.status(401).json({ message: "Email no verificado", isEmailVerified: false });
       return;
    }

    // Auto-generate referral code for existing users if missing
    if (!user.referralCode) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let newCode: string | null = null;
      let attempts = 0;
      while (!newCode && attempts < 10) {
        let candidate = 'BST-';
        for (let i = 0; i < 4; i++) candidate += chars[Math.floor(Math.random() * chars.length)];
        const exists = await prisma.user.findUnique({ where: { referralCode: candidate } });
        if (!exists) newCode = candidate;
        attempts++;
      }
      
      if (newCode) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { referralCode: newCode },
          select: { 
            id: true, dni: true, firstName: true, lastName: true, 
            email: true, whatsapp: true, points: true, membershipLevel: true, 
            role: true, isEmailVerified: true,
            streak: true, lastStreakDate: true,
            referralCode: true, referredById: true
          }
        });
      }
    }

    const settings = await prisma.clubSettings.findUnique({ where: { id: "singleton" } });
    if (settings) {
      const correctLevel = calculateMembershipLevel(user.points, settings);

      if (user.membershipLevel !== correctLevel) {
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { membershipLevel: correctLevel },
          select: { 
            id: true, dni: true, firstName: true, lastName: true, 
            email: true, whatsapp: true, points: true, membershipLevel: true, 
            role: true, isEmailVerified: true,
            streak: true, lastStreakDate: true,
            referralCode: true, referredById: true
          }
        });
        res.json({
          ...updatedUser,
          referralRewardReferrer: settings?.referralRewardReferrer || 500,
          referralRewardReferee: settings?.referralRewardReferee || 200
        });
        return;
      }
    }

    res.json({
      ...user,
      referralRewardReferrer: settings?.referralRewardReferrer || 500,
      referralRewardReferee: settings?.referralRewardReferee || 200
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }
    const { whatsapp, email: newEmail } = req.body;
    
    if (whatsapp && !/^\d+$/.test(whatsapp)) {
       res.status(400).json({ message: "El WhatsApp debe contener solo números." });
       return;
    }

    const current = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!current) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    const updateData: any = { whatsapp };

    // Security: If email changes, force re-verification
    if (newEmail && newEmail.toLowerCase().trim() !== current.email.toLowerCase().trim()) {
      const emailLower = newEmail.toLowerCase().trim();
      
      // Check if email already exists
      const existing = await prisma.user.findFirst({ where: { email: emailLower, id: { not: current.id } } });
      if (existing) {
        res.status(400).json({ message: "Este correo electrónico ya está en uso." });
        return;
      }

      const verificationCode = generateSixDigitCode();
      const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      updateData.email = emailLower;
      updateData.isEmailVerified = false;
      updateData.verificationCode = verificationCode;
      updateData.verificationCodeExpires = verificationCodeExpires;

      // Send new code in background
      sendVerificationEmail(emailLower, verificationCode).catch(console.error);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, firstName: true, lastName: true, whatsapp: true, email: true, isEmailVerified: true }
    });

    const settings = await prisma.clubSettings.findUnique({ where: { id: "singleton" } });

    res.json({
      ...user,
      referralRewardReferrer: settings?.referralRewardReferrer || 500,
      referralRewardReferee: settings?.referralRewardReferee || 200
    });
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
