import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { clearFlagCache, setFlagCache } from '../services/featureFlag.service';

const prisma = new PrismaClient();

export const getPublicFlags = async (req: Request, res: Response) => {
  try {
    const flags = await prisma.featureFlag.findMany({
      select: { name: true, enabled: true },
    });
    
    const flagsMap = flags.reduce((acc, flag) => {
      acc[flag.name] = flag.enabled;
      return acc;
    }, {} as Record<string, boolean>);
    
    res.json(flagsMap);
  } catch (error) {
    console.error('Error fetching public feature flags:', error);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
};

export const getAllFlags = async (req: Request, res: Response) => {
  try {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(flags);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
};

export const createFlag = async (req: Request, res: Response) => {
  try {
    const { name, description, enabled } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const newFlag = await prisma.featureFlag.create({
      data: {
        name,
        description,
        enabled: enabled ?? false,
      },
    });

    res.status(201).json(newFlag);
  } catch (error: any) {
    console.error('Error creating feature flag:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A feature flag with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create feature flag' });
  }
};

export const updateFlag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled, description } = req.body;

    const flag = await prisma.featureFlag.update({
      where: { id: id as string },
      data: {
        enabled,
        description,
      },
    });

    // Update cache directly to avoid fetching on next request
    if (enabled !== undefined) {
      await setFlagCache(flag.name, enabled);
    }

    res.json(flag);
  } catch (error) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({ error: 'Failed to update feature flag' });
  }
};

export const deleteFlag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const flag = await prisma.featureFlag.findUnique({ where: { id: id as string } });
    if (!flag) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    await prisma.featureFlag.delete({
      where: { id: id as string },
    });

    await clearFlagCache(flag.name);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    res.status(500).json({ error: 'Failed to delete feature flag' });
  }
};
