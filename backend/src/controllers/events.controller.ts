import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { sendEventPublishedNotification } from "../services/push.service";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  try {
     let isMinor = true; 

     const authHeader = req.headers.authorization;
     if (authHeader && authHeader.startsWith("Bearer ")) {
         const token = authHeader.split(" ")[1];
         try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
            if (decoded && decoded.id) {
               const user = await prisma.user.findUnique({
                  where: { id: decoded.id },
                  select: { birthDate: true, role: true }
               });
               
               if (user && user.role === "ADMIN") {
                  isMinor = false; 
               } else if (user && user.birthDate) {
                  const today = new Date();
                  const birthDate = new Date(user.birthDate);
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const m = today.getMonth() - birthDate.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                     age--;
                  }
                  if (age >= 18) {
                     isMinor = false;
                  }
               }
            }
         } catch(e) {
            // invalid token, just treat as minor
         }
     }

     const whereClause: any = { isActive: true }; // Always hide soft-deleted events
     if (isMinor) {
        whereClause.isAdultOnly = false;
     }

     const { type } = req.query;
     if (type) {
        whereClause.type = type;
     }

     const events = await prisma.event.findMany({
       where: whereClause,
       orderBy: [
         { order: "asc" },
         { eventDate: "asc" }
       ]
     });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      title, 
      description, 
      details,
      location,
      eventDate, 
      imageUrl, 
      videoUrl,
      mediaType,
      order,
      benefits, 
      type,
      buttonText,
      externalLink,
      isActive,
      isAdultOnly,
      content,
      gallery,
      isRedeemable,
      redemptionPolicy,
      benefitType,
      benefitValue,
      secondaryImageUrl,
      secondaryMediaType,
      linkedEventId
    } = req.body;
    
    const event = await prisma.event.create({
      data: {
        title,
        description,
        details,
        location: location || "Boston Club",
        eventDate: eventDate ? new Date(eventDate) : new Date(),
        imageUrl,
        videoUrl,
        mediaType: mediaType || "IMAGE",
        order: order ? parseInt(order.toString()) : 0,
        benefits,
        type: type || "EVENT",
        buttonText: buttonText || "RESERVAR MESA",
        externalLink,
        isActive: isActive !== undefined ? isActive : true,
        isAdultOnly: isAdultOnly || false,
        reminderSent: false,
        content,
        gallery: gallery ? (typeof gallery === 'string' ? gallery : JSON.stringify(gallery)) : null,
        isRedeemable: isRedeemable || false,
        redemptionPolicy: redemptionPolicy || "ONCE_TOTAL",
        benefitType: benefitType || null,
        benefitValue: benefitValue || null,
        secondaryImageUrl: secondaryImageUrl || null,
        secondaryMediaType: secondaryMediaType || "IMAGE",
        linkedEventId: linkedEventId || null
      }
    });

    // Enviar notificación Push solo si está activo
    if (event.isActive) {
      // Background execution so it doesn't block response
      sendEventPublishedNotification(event.title, event.description, event.type).catch(console.error);
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const notifyEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id: id as string }
    });

    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    if (!event.isActive) {
      res.status(400).json({ message: "Cannot notify inactive events" });
      return;
    }

    sendEventPublishedNotification(event.title, event.description, event.type).catch(console.error);

    res.json({ message: "Notification dispatched manually" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      details,
      location,
      eventDate, 
      imageUrl, 
      videoUrl,
      mediaType,
      order,
      benefits, 
      type,
      buttonText,
      externalLink,
      isActive,
      isAdultOnly,
      content,
      gallery,
      isRedeemable,
      redemptionPolicy,
      benefitType,
      benefitValue,
      secondaryImageUrl,
      secondaryMediaType,
      linkedEventId
    } = req.body;

    const oldEvent = await prisma.event.findUnique({ where: { id: id as string } });

    const event = await prisma.event.update({
      where: { id: id as string },
      data: {
        title,
        description,
        details,
        location,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        imageUrl,
        videoUrl,
        mediaType,
        order: order !== undefined ? parseInt(order.toString()) : undefined,
        benefits,
        type,
        buttonText,
        externalLink,
        isActive,
        isAdultOnly,
        content,
        gallery: gallery !== undefined ? (typeof gallery === 'string' ? gallery : JSON.stringify(gallery)) : undefined,
        isRedeemable,
        redemptionPolicy,
        benefitType,
        benefitValue,
        secondaryImageUrl,
        secondaryMediaType,
        linkedEventId
      }
    });

    // Notify if it just became active
    if (event.isActive && (!oldEvent || !oldEvent.isActive)) {
       sendEventPublishedNotification(event.title, event.description, event.type).catch(console.error);
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.event.update({
      where: { id: id as string },
      data: { isActive: false }
    });
    res.json({ message: "Event deactivated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const reorderEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orders } = req.body; // Array of { id, order }

    if (!Array.isArray(orders)) {
      res.status(400).json({ message: "Orders must be an array" });
      return;
    }

    console.log(`[Reorder] Procesando reordenamiento de ${orders.length} elementos...`);

    const updates = orders.map((item: { id: string; order: any }) =>
      prisma.event.update({
        where: { id: item.id },
        data: { order: parseInt(item.order.toString()) }
      })
    );

    await prisma.$transaction(updates);

    res.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("[Reorder Error]", error);
    res.status(500).json({ message: "Server Error" });
  }
};
