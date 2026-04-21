import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { MercadoPagoConfig, Payment } from "mercadopago";

const prisma = new PrismaClient();

// Mercado Pago Configuration
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || "TEST-TOKEN-MISSING" 
});

export const trackPosOrder = async (req: any, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    if (!orderId) {
      res.status(400).json({ message: "Order ID is required" });
      return;
    }

    // Vinculamos al usuario con esta orden de MP
    await prisma.posTransaction.upsert({
      where: { orderId },
      update: { userId },
      create: { 
        orderId, 
        userId,
        status: "PENDING"
      }
    });

    res.json({ success: true, message: "Order tracked successfully" });
  } catch (error) {
    console.error("Error tracking POS order:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, data } = req.body;

    // Solo procesamos pagos aprobados
    if (action === "payment.created" || action === "payment.updated") {
      const paymentId = data.id;
      const payment = new Payment(client);
      
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status === "approved" && paymentData.transaction_amount) {
        // Buscamos la transacción vinculada (usando el order_id o external_reference)
        // Nota: El QR del POSNET suele generar un Merchant Order, pero el pago tiene una referencia
        const amount = paymentData.transaction_amount;
        
        // Intentamos encontrar por merchant_order o por id de pago si lo mapeamos antes
        // Mercado Pago suele enviar el merchant_order_id en el pago
        const orderId = paymentData.order?.id?.toString();

        if (!orderId) {
          res.sendStatus(200); // No hay orden vinculada, ignoramos
          return;
        }

        const trans = await prisma.posTransaction.findUnique({
          where: { orderId }
        });

        if (trans && !trans.processed) {
          const pointsToAward = Math.floor(amount);

          await prisma.$transaction([
            // 1. Dar puntos al usuario
            prisma.user.update({
              where: { id: trans.userId },
              data: { points: { increment: pointsToAward } }
            }),
            // 2. Registrar historial
            prisma.pointHistory.create({
              data: {
                userId: trans.userId,
                pointsGained: pointsToAward,
                source: "COMPRA_POSNET",
                description: `Puntos por pago en POSNET (${orderId})`
              }
            }),
            // 3. Marcar transacción como procesada
            prisma.posTransaction.update({
              where: { id: trans.id },
              data: { 
                status: "SUCCESS", 
                amount, 
                processed: true,
                externalPaymentId: paymentId.toString()
              }
            })
          ]);

          console.log(`✅ Puntos acreditados: ${pointsToAward} para el usuario ${trans.userId}`);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(200).send(); // Siempre devolver 200 a MP para evitar reintentos infinitos si falla algo no crítico
  }
};
