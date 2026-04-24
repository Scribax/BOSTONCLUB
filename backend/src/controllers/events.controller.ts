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

     const whereClause: any = {};
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
      gallery
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
      gallery
    } = req.body;

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
        gallery: gallery !== undefined ? (typeof gallery === 'string' ? gallery : JSON.stringify(gallery)) : undefined
      }
    });

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.event.delete({
      where: { id: id as string }
    });
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
