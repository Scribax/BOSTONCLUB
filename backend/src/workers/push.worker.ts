import { Worker, Job } from 'bullmq';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import Redis from 'ioredis';

const expo = new Expo();

// Configuracion de Redis para BullMQ
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
};

const connection = new Redis(redisOptions);

export const pushWorker = new Worker(
  'push-notifications',
  async (job: Job) => {
    const { messages } = job.data as { messages: ExpoPushMessage[] };
    
    if (!messages || messages.length === 0) return;

    // Expo recomienda enviar en chunks para evitar límites
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error enviando chunk de notificaciones en worker:', error);
        throw error; // Lanzar error para que BullMQ intente de nuevo si está configurado
      }
    }
    
    console.log(`[Push Worker] Job ${job.id} procesó ${messages.length} notificaciones.`);
    return tickets;
  },
  { connection }
);

pushWorker.on('completed', (job) => {
  console.log(`[Push Worker] Job ${job.id} completado con éxito.`);
});

pushWorker.on('failed', (job, err) => {
  console.error(`[Push Worker] Job ${job?.id} falló con error: ${err.message}`);
});
