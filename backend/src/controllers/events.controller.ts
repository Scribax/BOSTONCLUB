import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { eventDate: "asc" }
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
      benefits, 
      type,
      buttonText,
      externalLink,
      isActive
    } = req.body;
    
    const event = await prisma.event.create({
      data: {
        title,
        description,
        details,
        location: location || "Boston Club",
        eventDate: new Date(eventDate),
        imageUrl,
        benefits,
        type: type || "EVENT",
        buttonText: buttonText || "RESERVAR MESA",
        externalLink,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json(event);
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
