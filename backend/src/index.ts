import express from "express";
import cors from "cors";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.routes";
import apiRoutes from "./routes/api.routes";
import paymentRoutes from "./routes/payments.routes";
import { initCronJobs } from "./cron";

const prisma = new PrismaClient();
const app = express();

app.use(cors({
  origin: "*",
  credentials: true,
}));

// Logger para depuración
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: '5mb' })); // allow base64 image uploads

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Boston Club API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 8080;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT} (Network Accessible)`);
  initCronJobs(); // Initialize scheduled tasks
});
