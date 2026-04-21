import { Router } from "express";
import { trackPosOrder, handleWebhook } from "../controllers/payments.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Endpoint para cuando el cliente escanea el QR del POSNET
router.post("/track-pos", authenticate, trackPosOrder);

// Webhook oficial de Mercado Pago (público)
router.post("/webhook", handleWebhook);

export default router;
