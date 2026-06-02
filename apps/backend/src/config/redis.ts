// ═══════════════════════════════════════════════════
// ArtVerse — Redis Client
// ═══════════════════════════════════════════════════

import Redis from "ioredis";

import { env } from "./index";
import { logger } from "./logger";

let redisAvailable = false;

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  tls: env.REDIS_URL.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
});

redis.on("connect", () => {
  redisAvailable = true;
  logger.info("✅ Redis connected");
});

redis.on("error", (error) => {
  redisAvailable = false;
  logger.error("❌ Redis connection error: " + error.message);
});

redis.on("close", () => {
  redisAvailable = false;
});

/**
 * Check if Redis is currently available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable;
}

/**
 * Get a cached value, or compute & cache it.
 * Gracefully falls back to fetcher when Redis is unavailable.
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  if (redisAvailable) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
    }
  }

  const data = await fetcher();

  if (redisAvailable) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
    }
  }

  return data;
}

/**
 * Invalidate cache keys matching a pattern.
 * No-op when Redis is unavailable.
 */
export async function invalidateCache(pattern: string): Promise<void> {
  if (!redisAvailable) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error(`Redis invalidate error for pattern ${pattern}:`, error);
  }
}

export default redis;
