import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import "dotenv/config";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "placeholder_value",
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0, 
  profilesSampleRate: 1.0,
});

import express from "express";
import path from "path";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.routes";
import apiRoutes from "./routes/api.routes";
import paymentRoutes from "./routes/payments.routes";
import { loggerMiddleware, logger } from "./utils/logger";

const prisma = new PrismaClient();
const app = express();

app.use(cors({
  origin: "*",
  credentials: true,
}));

app.use(loggerMiddleware);

// Logger para depuración
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: '5mb' })); // allow base64 image uploads

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Boston Club API is running" });
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", apiRoutes);

Sentry.setupExpressErrorHandler(app);

const PORT = process.env.PORT || 8080;
app.listen(Number(PORT), "0.0.0.0", () => {
  logger.info(`Server is running on port ${PORT} (Network Accessible)`);
  console.log(`Server is running on port ${PORT} (Network Accessible)`);
});
