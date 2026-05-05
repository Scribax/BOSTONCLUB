import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};
const redis = new Redis(redisOptions);

export const isFeatureEnabled = async (flagName: string): Promise<boolean> => {
  try {
    const cacheKey = `feature_flag:${flagName}`;
    const cached = await redis.get(cacheKey);

    if (cached !== null) {
      return cached === 'true';
    }

    const flag = await prisma.featureFlag.findUnique({
      where: { name: flagName },
    });

    const isEnabled = flag ? flag.enabled : false;

    // Cache the result for 60 seconds (or 5 minutes, etc.) to reduce DB load
    await redis.set(cacheKey, isEnabled ? 'true' : 'false', 'EX', 60);

    return isEnabled;
  } catch (error) {
    console.error(`Error checking feature flag ${flagName}:`, error);
    // Fail safe to false if there is an error
    return false;
  }
};
