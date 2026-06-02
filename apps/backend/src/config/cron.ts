// ═══════════════════════════════════════════════════
// ArtVerse — Background Cron Jobs
// ═══════════════════════════════════════════════════

import cron from "node-cron";
import { prisma } from "./database";
import { logger } from "./logger";

export function initializeCronJobs() {
  logger.info("Initializing background cron jobs...");

  // Run at midnight (00:00) every day
  // Sweeps the database for expired refresh tokens to prevent bloat
  cron.schedule("0 0 * * *", async () => {
    logger.info("[Cron] Running expired RefreshToken sweep...");
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      logger.info(`[Cron] Successfully swept ${result.count} expired tokens.`);
    } catch (err) {
      logger.error("[Cron] Failed to sweep refresh tokens:", err);
    }
  });
}
