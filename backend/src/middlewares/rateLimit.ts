import { Request, Response, NextFunction } from "express";
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: Number(process.env.REDIS_PORT) || 6379,
});

redis.on("error", (err) => {
  console.error("[RateLimit] Redis error:", err.message);
});

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
  message?: string;
}

/**
 * Redis-backed rate limiter middleware.
 * Key: IP address + keyPrefix.
 */
export function createRateLimit(opts: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const key = `rl:${opts.keyPrefix}:${ip}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, opts.windowSeconds);
      }
      if (current > opts.maxRequests) {
        const ttl = await redis.ttl(key);
        res.status(429).json({
          message: opts.message || "Demasiados intentos. Por favor esperá antes de reintentar.",
          retryAfterSeconds: ttl,
        });
        return;
      }
      next();
    } catch (err) {
      console.error("[RateLimit] Error:", err);
      next();
    }
  };
}

// ── Presets ──────────────────────────────────────────────────────────────────

/** Login: 10 intentos por 15 minutos */
export const loginRateLimit = createRateLimit({
  keyPrefix: "login",
  maxRequests: 10,
  windowSeconds: 15 * 60,
  message: "Demasiados intentos de inicio de sesión. Esperá 15 minutos.",
});

/** Registro: 5 cuentas por IP por hora */
export const registerRateLimit = createRateLimit({
  keyPrefix: "register",
  maxRequests: 5,
  windowSeconds: 60 * 60,
  message: "Demasiados registros desde esta IP. Esperá 1 hora.",
});

/** Forgot password: 5 intentos por 30 minutos */
export const forgotPasswordRateLimit = createRateLimit({
  keyPrefix: "forgot",
  maxRequests: 5,
  windowSeconds: 30 * 60,
  message: "Demasiados pedidos de recuperación. Esperá 30 minutos.",
});

/** Generación de QR de canje: 10 por hora */
export const redemptionRateLimit = createRateLimit({
  keyPrefix: "redemption",
  maxRequests: 10,
  windowSeconds: 60 * 60,
  message: "Demasiados canjes generados. Esperá un momento.",
});

/** Resend verification: 3 por 10 minutos */
export const resendVerificationRateLimit = createRateLimit({
  keyPrefix: "resend",
  maxRequests: 3,
  windowSeconds: 10 * 60,
  message: "Demasiados reenvíos de código. Esperá 10 minutos.",
});
