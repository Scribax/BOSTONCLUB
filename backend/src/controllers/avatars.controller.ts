import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllAvatars = async (req: Request, res: Response) => {
  try {
    const avatars = await prisma.customAvatar.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(avatars);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener avatares" });
  }
};

export const createAvatar = async (req: Request, res: Response) => {
  try {
    const { url, name } = req.body;
    if (!url) {
      return res.status(400).json({ message: "URL requerida" });
    }
    const avatar = await prisma.customAvatar.create({
      data: { url, name }
    });
    res.status(201).json(avatar);
  } catch (error) {
    res.status(500).json({ message: "Error al crear avatar" });
  }
};

export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.customAvatar.delete({
      where: { id }
    });
    res.json({ message: "Avatar eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar avatar" });
  }
};
