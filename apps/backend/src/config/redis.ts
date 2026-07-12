// ═══════════════════════════════════════════════════
// ArtVerse — Redis Client (Disabled / Mocked)
// ═══════════════════════════════════════════════════

import { logger } from "./logger";

// Keep this always false to run in database-only mode
const redisAvailable = false;

// Mocked Redis client to prevent any connection attempts
export const redis = {
  quit: async () => {
    return "OK";
  },
  on: () => {},
};

/**
 * Check if Redis is currently available
 */
export function isRedisAvailable(): boolean {
  return false;
}

/**
 * Get a cached value, or compute & cache it.
 * (Directly calls the fetcher since Redis is disabled)
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  return fetcher();
}

/**
 * Invalidate cache keys matching a pattern.
 * (No-op since Redis is disabled)
 */
export async function invalidateCache(pattern: string): Promise<void> {
  // No-op
}

export default redis;
