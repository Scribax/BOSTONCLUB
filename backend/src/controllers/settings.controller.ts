import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
          superVipBenefits: "- 50% Off en toda la carta\n- Todo incluido en eventos seleccionados\n- Concierge privado"
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
        eventCheckinPoints: Number(req.body.eventCheckinPoints)
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
        eventCheckinPoints: Number(req.body.eventCheckinPoints)
      }
    });



    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
