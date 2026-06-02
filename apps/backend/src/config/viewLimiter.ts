// ═══════════════════════════════════════════════════
// ArtVerse — In-Memory View Limiter
// Fallback logic for when Redis is disconnected
// ═══════════════════════════════════════════════════

const MAX_CACHE_SIZE = 10000;
const VIEW_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour buffer

class ViewLimiter {
  private cache: Map<string, number>;

  constructor() {
    this.cache = new Map();
    // Auto-clean up the map every hour to prevent memory leaks
    setInterval(() => this.cleanup(), VIEW_TIMEOUT_MS).unref();
  }

  /**
   * Checks if the IP has viewed the specific product recently.
   * Returns true if allowed (first view or timeout passed).
   */
  public allowView(ip: string, productId: string): boolean {
    if (!ip) return true; // Failsafe if IP isn't resolved behind proxies

    const key = `${ip}:${productId}`;
    const now = Date.now();
    const lastViewed = this.cache.get(key);

    if (lastViewed && now - lastViewed < VIEW_TIMEOUT_MS) {
      return false; // Already viewed recently
    }

    // Process view and refresh timestamp
    this.cache.set(key, now);

    // Naive sizing protection
    if (this.cache.size > MAX_CACHE_SIZE) {
      this.cleanup(true); 
    }

    return true;
  }

  private cleanup(forcePartial = false) {
    const now = Date.now();
    for (const [key, timestamp] of this.cache.entries()) {
      if (now - timestamp >= VIEW_TIMEOUT_MS || forcePartial) {
        this.cache.delete(key);
        if (forcePartial && this.cache.size <= MAX_CACHE_SIZE * 0.8) break;
      }
    }
  }
}

export const viewLimiter = new ViewLimiter();
