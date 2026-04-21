import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaClient } from '@prisma/client';

const expo = new Expo();
const prisma = new PrismaClient();

export const sendPushNotifications = async (messages: ExpoPushMessage[]) => {
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error enviando chunk de notificaciones:', error);
    }
  }
};

export const sendEventPublishedNotification = async (title: string, description: string, type: string) => {
  try {
    const users = await prisma.user.findMany({
      where: { expoPushToken: { not: null } },
      select: { expoPushToken: true }
    });

    const messages: ExpoPushMessage[] = [];
    
    // Customize title based on type
    const noticePrefix = type === 'BANNER' ? '📢 Nueva Promoción: ' : '🎟 Nuevo Evento: ';

    for (const user of users) {
      if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        messages.push({
          to: user.expoPushToken,
          sound: 'default',
          priority: 'high',
          title: `${noticePrefix}${title}`,
          body: description || 'Toca para ver los detalles en la app.',
          data: { type: 'NEW_EVENT' },
        });
      }
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
      console.log(`[Push] Se enviaron ${messages.length} notificaciones de nuevo evento.`);
    }
  } catch (err) {
    console.error('[Push Service Error]', err);
  }
};

export const sendEventReminderNotification = async (eventId: string, title: string) => {
  try {
    const users = await prisma.user.findMany({
      where: { expoPushToken: { not: null } },
      select: { expoPushToken: true }
    });

    const messages: ExpoPushMessage[] = [];
    
    for (const user of users) {
      if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        messages.push({
          to: user.expoPushToken,
          sound: 'default',
          priority: 'high',
          title: `¡Falta poco para ${title}! 🔥`,
          body: 'Recordá preparar tu código o entrada digital desde la app.',
          data: { type: 'EVENT_REMINDER', eventId },
        });
      }
    }

    if (messages.length > 0) {
      await sendPushNotifications(messages);
      console.log(`[Push] Se enviaron ${messages.length} notificaciones de recordatorio.`);
    }
  } catch (err) {
    console.error('[Push Service Error]', err);
  }
};
