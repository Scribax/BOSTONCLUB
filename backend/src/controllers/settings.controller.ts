import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/videos");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "login-bg-" + uniqueSuffix + path.extname(file.originalname));
  },
});

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
          loginVideoUrl: null
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
      checkinPoints
    } = req.body;

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
        loginVideoUrl: req.body.loginVideoUrl
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
        loginVideoUrl: req.body.loginVideoUrl
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

    const videoUrl = `/uploads/videos/${req.file.filename}`;
    
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
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
};
