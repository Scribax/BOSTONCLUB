import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '../utils/prisma';

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
};

const connection = new Redis(redisOptions);

export const pushQueue = new Queue('push-notifications', { connection });

export const sendPushNotifications = async (messages: ExpoPushMessage[]) => {
  if (messages.length === 0) return;
  // Encolar los mensajes en vez de enviarlos sincrónicamente
  await pushQueue.add('send-chunk', { messages }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  });
  console.log(`[Push Service] ${messages.length} notificaciones encoladas en BullMQ.`);
};

export const sendEventPublishedNotification = async (title: string, description: string, type: string) => {
  try {
    const users = await prisma.user.findMany({
      where: { expoPushToken: { not: null } },
      select: { expoPushToken: true }
    });

    const messages: ExpoPushMessage[] = [];
    
    // Customize title based on type
    let noticePrefix = '🎟 Nuevo Evento: ';
    let dataType = 'NEW_EVENT';

    if (type === 'BANNER') {
      noticePrefix = '📢 Novedad: ';
      dataType = 'NEW_BANNER';
    } else if (type === 'PROMO') {
      noticePrefix = '🔥 Nueva Promo: ';
      dataType = 'NEW_PROMO';
    } else if (type === 'EVENTO' || type === 'EVENT') {
      noticePrefix = '🎟 Nuevo Evento: ';
      dataType = 'NEW_EVENT';
    }

    const uniqueTokens = new Set<string>();
    for (const user of users) {
      if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        uniqueTokens.add(user.expoPushToken);
      }
    }

    for (const token of uniqueTokens) {
      messages.push({
        to: token,
        sound: 'default',
        priority: 'high',
        title: `${noticePrefix}${title}`,
        body: description || 'Toca para ver los detalles en la app.',
        data: { 
          type: dataType 
        },
      });
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
    }
  } catch (err) {
    console.error('[Push Service Error]', err);
  }
};

export const sendPointsCreditedPush = async (expoPushToken: string, firstName: string, points: number) => {
  if (!Expo.isExpoPushToken(expoPushToken)) return;
  const messages: ExpoPushMessage[] = [{
    to: expoPushToken,
    sound: 'default',
    priority: 'high',
    title: `¡Puntos acreditados, ${firstName}! 🎉`,
    body: `El staff te acreditó ${points} puntos en caja. ¡Seguís sumando!`,
    data: { type: 'POINTS_CREDITED', points },
  }];
  await sendPushNotifications(messages);
};

export const sendLevelUpPush = async (expoPushToken: string, firstName: string, newLevel: string) => {
  if (!Expo.isExpoPushToken(expoPushToken)) return;
  const levelEmojis: Record<string, string> = {
    'ORO': '🥇', 'PLATINO': '🪙', 'DIAMANTE': '💎', 'SÚPER VIP': '👑'
  };
  const emoji = levelEmojis[newLevel] || '⭐';
  const messages: ExpoPushMessage[] = [{
    to: expoPushToken,
    sound: 'default',
    priority: 'high',
    title: `${emoji} ¡Subiste de nivel, ${firstName}!`,
    body: `¡Felicitaciones! Ahora sos Socio ${newLevel}. Nuevos beneficios exclusivos te esperan.`,
    data: { type: 'LEVEL_UP', newLevel },
  }];
  await sendPushNotifications(messages);
};

export const sendBirthdayPush = async (expoPushToken: string, firstName: string, points: number) => {
  if (!Expo.isExpoPushToken(expoPushToken)) return;
  const messages: ExpoPushMessage[] = [{
    to: expoPushToken,
    sound: 'default',
    priority: 'high',
    title: `¡Feliz Cumpleaños, ${firstName}! 🎂`,
    body: `Te regalamos ${points} puntos para celebrar. ¡Te esperamos esta noche!`,
    data: { type: 'BIRTHDAY_BONUS' },
  }];
  await sendPushNotifications(messages);
};

export const sendEventReminderNotification = async (eventId: string, title: string) => {
  try {
    const users = await prisma.user.findMany({
      where: { expoPushToken: { not: null } },
      select: { expoPushToken: true }
    });

    const messages: ExpoPushMessage[] = [];
    
    const uniqueTokens = new Set<string>();
    for (const user of users) {
      if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        uniqueTokens.add(user.expoPushToken);
      }
    }

    for (const token of uniqueTokens) {
      messages.push({
        to: token,
        sound: 'default',
        priority: 'high',
        title: `¡Falta poco para ${title}! 🔥`,
        body: 'Recordá preparar tu código o entrada digital desde la app.',
        data: { type: 'EVENT_REMINDER', eventId },
      });
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
    }
  } catch (err) {
    console.error('[Push Service Error]', err);
  }
};
