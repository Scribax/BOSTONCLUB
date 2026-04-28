import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

import { uploadToR2 } from "../services/storage.service";

// Multer Configuration for Memory Storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await prisma.clubSettings.findUnique({
      where: { id: "singleton" }
    });

    if (!settings) {
      settings = await prisma.clubSettings.create({
        data: {
          id: "singleton",
          vipThreshold: 1000,
          goldThreshold: 500000,
          platinumThreshold: 1500000,
          diamondThreshold: 5000000,
          superVipThreshold: 10000000,
          vipMessageTemplate: "¡Felicidades {name}! 🎉 Has llegado a los {points} puntos en Boston Club. ¡Eres un socio VIP! Canjea tus puntos por premios exclusivos.",
          rewardListText: "- 30% Off en Bebidas\n- Ingreso Free a Eventos\n- Regalo Sorpresa",
          bronceBenefits: "- Beneficios base de socio\n- Acceso a promociones",
          goldBenefits: "- 10% Off en toda la carta\n- Mesa reservada los findes",
          platinumBenefits: "- 20% Off en toda la carta\n- Acceso anticipado a eventos",
          diamondBenefits: "- 30% Off en toda la carta\n- Zona VIP sin cargo\n- Regalo de cumpleaños",
          superVipBenefits: "- 50% Off en toda la carta\n- Todo incluido en eventos seleccionados\n- Concierge privado",
          loginVideoUrl: null,
          referralRewardReferrer: 500,
          referralRewardReferee: 200
        }
      });
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      vipThreshold, 
      vipMessageTemplate, 
      rewardListText,
      goldThreshold,
      platinumThreshold,
      diamondThreshold,
      superVipThreshold,
      bronceBenefits,
      goldBenefits,
      platinumBenefits,
      diamondBenefits,
      superVipBenefits,
      checkinPoints,
      referralRewardReferrer,
      referralRewardReferee,
      pointsPerPeso
    } = req.body;

    // Validate pointsPerPeso
    const parsedRate = parseFloat(pointsPerPeso);
    if (pointsPerPeso !== undefined && (isNaN(parsedRate) || parsedRate <= 0)) {
      res.status(400).json({ message: "La tasa de puntos por peso debe ser un número positivo mayor a 0." });
      return;
    }

    const settings = await prisma.clubSettings.upsert({
      where: { id: "singleton" },
      update: {
        vipThreshold: Number(vipThreshold),
        vipMessageTemplate: vipMessageTemplate,
        rewardListText,
        goldThreshold: Number(goldThreshold),
        platinumThreshold: Number(platinumThreshold),
        diamondThreshold: Number(diamondThreshold),
        superVipThreshold: Number(superVipThreshold),
        bronceBenefits,
        goldBenefits,
        platinumBenefits,
        diamondBenefits,
        superVipBenefits,
        checkinPoints: Number(checkinPoints),
        isEventDay: Boolean(req.body.isEventDay),
        eventCheckinPoints: Number(req.body.eventCheckinPoints),
        loginVideoUrl: req.body.loginVideoUrl,
        referralRewardReferrer: Number(referralRewardReferrer),
        referralRewardReferee: Number(referralRewardReferee),
        pointsPerPeso: pointsPerPeso !== undefined ? parsedRate : undefined
      },
      create: {
        id: "singleton",
        vipThreshold: Number(vipThreshold),
        vipMessageTemplate: vipMessageTemplate,
        rewardListText,
        goldThreshold: Number(goldThreshold),
        platinumThreshold: Number(platinumThreshold),
        diamondThreshold: Number(diamondThreshold),
        superVipThreshold: Number(superVipThreshold),
        bronceBenefits,
        goldBenefits,
        platinumBenefits,
        diamondBenefits,
        superVipBenefits,
        checkinPoints: Number(checkinPoints),
        isEventDay: Boolean(req.body.isEventDay),
        eventCheckinPoints: Number(req.body.eventCheckinPoints),
        loginVideoUrl: req.body.loginVideoUrl,
        referralRewardReferrer: Number(referralRewardReferrer),
        referralRewardReferee: Number(referralRewardReferee),
        pointsPerPeso: pointsPerPeso !== undefined ? parsedRate : 1.0
      }
    });

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const uploadVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No video file provided" });
      return;
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = "login-bg-" + uniqueSuffix + path.extname(req.file.originalname);

    // Upload buffer to R2
    const videoUrl = await uploadToR2(
      req.file.buffer,
      filename,
      req.file.mimetype,
      "videos"
    );
    
    // Auto-update settings with the new video URL
    await prisma.clubSettings.upsert({
      where: { id: "singleton" },
      update: { loginVideoUrl: videoUrl },
      create: { 
        id: "singleton",
        loginVideoUrl: videoUrl
      }
    });

    res.json({ 
      message: "Video uploaded successfully", 
      url: videoUrl 
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};
