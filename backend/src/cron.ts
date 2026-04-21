import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendEventReminderNotification } from './services/push.service';

const prisma = new PrismaClient();

export const initCronJobs = () => {
  // Se ejecuta cada hora ('0 * * * *') para revisar eventos que ocurran en las próximas 24 horas.
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Revisando recordatorios de eventos...');
    
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const upcomingEvents = await prisma.event.findMany({
        where: {
          isActive: true,
          // type: 'EVENT', // OPCIONAL: Filtrar solo eventos o dejar los banners también si aplica
          reminderSent: false,
          eventDate: {
            gt: now,
            lte: in24Hours
          }
        }
      });

      for (const event of upcomingEvents) {
        await sendEventReminderNotification(event.id, event.title);
        
        // Marcar como enviado para no enviarlo doble la próxima hora
        await prisma.event.update({
          where: { id: event.id },
          data: { reminderSent: true }
        });
      }
    } catch (err) {
      console.error('[CRON Error]', err);
    }
  });

  console.log('[CRON] Tareas programadas iniciadas.');
};
