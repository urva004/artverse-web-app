// ═══════════════════════════════════════════════════
// ArtVerse — Express Server Entry Point
// ═══════════════════════════════════════════════════

import http from "http";
import path from "path";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config";
import { prisma } from "./config/database";
import { logger } from "./config/logger";
import { redis } from "./config/redis";
import { initSocket } from "./config/socket";
import { initializeCronJobs } from "./config/cron";
import { errorHandler } from "./middleware/errorHandler";
import { generalLimiter } from "./middleware/rateLimiter";
import routes from "./routes";

const app = express();
const server = http.createServer(app);

// ── Security Middleware ──
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: [env.CORS_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:4000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

// ── Body Parsing ──
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── Rate Limiting ──
app.use(generalLimiter);

// ── Serve uploaded files (dev mode — when Cloudinary is not configured) ──
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// ── API Routes ──
app.use(`/api/${env.API_VERSION}`, routes);

// ── 404 Handler ──
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ── Global Error Handler ──
app.use(errorHandler);

// ── Server Startup ──
async function startServer() {
  try {
    // Prisma lazily connects on first query, so we avoid blocking startup
    logger.info("✅ Database configured (lazy connection enabled)");

    // Initialize scheduled background jobs
    initializeCronJobs();

    // Redis auto-connects (no lazyConnect). If it fails, the app runs without cache.

    // Initialize Socket.io
    initSocket(server);

    // Start HTTP server
    server.listen(env.PORT, "0.0.0.0", () => {
      logger.info(
        `🚀 ArtVerse API running on http://localhost:${env.PORT}/api/${env.API_VERSION}`
      );
      logger.info(`📊 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// ── Graceful Shutdown ──
async function shutdown(signal: string) {
  logger.info(`\n${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    logger.info("✅ Server shut down cleanly");
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error("⚠️ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();

export { app, server };
