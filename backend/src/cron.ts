import cron from 'node-cron';
import { sendEventReminderNotification, sendBirthdayPush } from './services/push.service';
import { sendBirthdayEmail } from './services/email.service';
import { prisma } from './utils/prisma';

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

  // Cron de cumpleaños: se ejecuta todos los días a las 10:00 AM (hora Argentina, UTC-3 = 13:00 UTC)
  cron.schedule('0 13 * * *', async () => {
    console.log('[CRON] Revisando cumpleaños del día...');
    try {
      const settings = await prisma.clubSettings.findUnique({ where: { id: 'singleton' } });
      const birthdayPoints = settings ? Math.round(settings.checkinPoints * 2) : 200;

      const now = new Date();
      const todayMonth = now.getUTCMonth() + 1;
      const todayDay = now.getUTCDate();

      const usersWithBirthday = await prisma.user.findMany({
        where: {
          birthDate: { not: null },
          isEmailVerified: true,
          isBlocked: false,
        },
        select: { id: true, firstName: true, email: true, birthDate: true, expoPushToken: true }
      });

      const birthdayUsers = usersWithBirthday.filter(u => {
        if (!u.birthDate) return false;
        const bd = new Date(u.birthDate);
        return bd.getUTCMonth() + 1 === todayMonth && bd.getUTCDate() === todayDay;
      });

      console.log(`[CRON Birthday] ${birthdayUsers.length} cumpleaños hoy.`);

      for (const user of birthdayUsers) {
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: user.id },
            data: { points: { increment: birthdayPoints } }
          });
          await tx.pointHistory.create({
            data: {
              userId: user.id,
              pointsGained: birthdayPoints,
              source: 'BIRTHDAY',
              description: `🎂 Regalo de cumpleaños — +${birthdayPoints} puntos`
            }
          });
        });

        await sendBirthdayEmail(user.email, user.firstName, birthdayPoints);
        if (user.expoPushToken) {
          await sendBirthdayPush(user.expoPushToken, user.firstName, birthdayPoints);
        }

        console.log(`[CRON Birthday] Procesado: ${user.firstName} (${user.email})`);
      }
    } catch (err) {
      console.error('[CRON Birthday Error]', err);
    }
  });

  console.log('[CRON] Tareas programadas iniciadas.');
};
