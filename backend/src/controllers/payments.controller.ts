import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { MercadoPagoConfig, Payment, MerchantOrder } from "mercadopago";

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

    console.log(`[POS] Vinculando Order ${orderId} al usuario ${userId}`);

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

export const checkPosStatus = async (req: any, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const trans = await prisma.posTransaction.findUnique({
      where: { orderId }
    });

    if (!trans) {
      res.status(404).json({ message: "Transacción no encontrada" });
      return;
    }

    if (trans.userId !== userId) {
      res.status(403).json({ message: "Acceso denegado" });
      return;
    }

    res.json({ 
      status: trans.status, 
      processed: trans.processed, 
      amount: trans.amount 
    });
  } catch (error) {
    console.error("Error checking POS status:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // Soportar tanto Webhook normal (body) como IPN (query params)
    const actionBody = req.body.action || req.body.type;
    const queryTopic = req.query.topic || req.query.type;
    const actionOrType = actionBody || queryTopic;
    
    // El ID puede venir en data.id (Webhook) o en id (IPN)
    const dataId = req.body.data?.id || req.body.id || req.query.id;

    console.log(`[WEBHOOK] ${new Date().toLocaleTimeString()} - Tipo: ${actionOrType} - ID recogido: ${dataId}`);

    if (!dataId) {
      res.sendStatus(200);
      return;
    }

    // 1. Manejo de Pagos (Payment)
    if (actionOrType === "payment.created" || actionOrType === "payment.updated" || actionOrType === "payment") {
      const paymentId = dataId.toString();
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      console.log(`[DEBUG_MP] Datos completos del Pago ${paymentId}:`, JSON.stringify(paymentData, null, 2));

      if (paymentData.status === "approved" && typeof paymentData.transaction_amount === "number") {
        const amount = paymentData.transaction_amount;
        let orderId = paymentData.order?.id?.toString();
        const externalRef = paymentData.external_reference;
        
        // Buscar en metadata (Muy común en integraciones de POS)
        const metadataId = (paymentData as any).metadata?.order_id || (paymentData as any).metadata?.id;

        console.log(`[MP_MATCH] Analizando: Order=${orderId}, ExtRef=${externalRef}, Meta=${metadataId}`);

        if (orderId) await processPointsAwarding(orderId, amount, paymentId);
        if (externalRef) await processPointsAwarding(externalRef, amount, paymentId);
        if (metadataId) await processPointsAwarding(metadataId.toString(), amount, paymentId);

        const poi: any = paymentData.point_of_interaction;
        const pointRefs = poi?.references || [];
        
        let found = false;
        // 1. Intentar por IDs normales
        if (orderId && await processPointsAwarding(orderId, amount, paymentId)) found = true;
        if (externalRef && !found && await processPointsAwarding(externalRef, amount, paymentId)) found = true;
        if (metadataId && !found && await processPointsAwarding(metadataId.toString(), amount, paymentId)) found = true;

        for (const ref of pointRefs) {
          if (!found && await processPointsAwarding(ref.id.toString(), amount, paymentId)) found = true;
        }

        // 2. FALLBACK: Vínculo Temporal (Si nada coincidió)
        if (!found) {
          console.log(`[FALLBACK] No hay coincidencia de ID. Buscando último escaneo temporal...`);
          const twoMinutesAgo = new Date(Date.now() - 120 * 1000);
          
          const lastPending = await prisma.posTransaction.findFirst({
            where: {
              status: "PENDING",
              createdAt: { gte: twoMinutesAgo }
            },
            orderBy: { createdAt: 'desc' }
          });

          if (lastPending) {
            console.log(`[FALLBACK_SUCCESS] Vinculando pago ${paymentId} al usuario ${lastPending.userId} por proximidad temporal.`);
            await processPointsAwarding(lastPending.orderId, amount, paymentId);
          } else {
            console.log(`[FALLBACK_FAIL] No se encontró ningún escaneo reciente (2 min).`);
          }
        }
      }
    }

    // 2. Manejo de Merchant Orders (Estructura Smart POS o Simulación)
    else if (actionOrType === "merchant_order" || actionOrType === "order" || actionOrType === "merchant_order.created" || actionOrType === "merchant_order.updated") {
      const orderId = dataId.toString();
      const merchantOrder = new MerchantOrder(client);
      const orderData = await merchantOrder.get({ merchantOrderId: orderId });

      console.log(`[ORDER] Detalle: ${orderData.status} - ID: ${orderId} - Ref: ${orderData.external_reference}`);

      if (orderData.status === "closed" || (orderData.payments && orderData.payments.some(p => p.status === 'approved'))) {
        const amount = orderData.total_amount || 0;
        const externalRef = orderData.external_reference;

        await processPointsAwarding(orderId, amount, "ORDER_" + orderId);
        if (externalRef) await processPointsAwarding(externalRef, amount, "ORDER_" + orderId);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("[WEBHOOK ERROR]", error);
    res.status(200).send(); 
  }
};

// Función auxiliar para acreditar puntos (Retorna true si tuvo éxito)
async function processPointsAwarding(idToSearch: string, amount: number, externalId: string): Promise<boolean> {
  try {
    // Buscamos la transacción que coincida con el ID escaneado
    const trans = await prisma.posTransaction.findUnique({
      where: { orderId: idToSearch }
    });

    if (trans && !trans.processed) {
      const pointsToAward = Math.floor(amount);
      if (pointsToAward <= 0) return false;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: trans.userId },
          data: { points: { increment: pointsToAward } }
        }),
        prisma.pointHistory.create({
          data: {
            userId: trans.userId,
            pointsGained: pointsToAward,
            source: "COMPRA_POSNET",
            description: `Puntos por pago en POSNET (${idToSearch})`
          }
        }),
        prisma.posTransaction.update({
          where: { id: trans.id },
          data: { 
            status: "SUCCESS", 
            amount, 
            processed: true,
            externalPaymentId: externalId
          }
        })
      ]);

      console.log(`[POINTS] ✅ ${pointsToAward} puntos acreditados con éxito al socio.`);
      return true;
    }
    return false; // Asegurar que siempre retorne un booleano
  } catch (err) {
    console.error("[PROCESS POINTS ERROR]", err);
    return false;
  }
}
