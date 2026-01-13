/**
 * Simple in-memory cache with TTL support
 * Designed for reducing database queries in Next.js API routes
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  constructor() {
    // No interval-based cleanup in serverless environments
    // Instead, we use lazy cleanup on get/set operations
  }

  /**
   * Get a value from cache
   * Returns null if expired or not found
   * Performs lazy cleanup of expired entries
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a value in cache with TTL in seconds
   * Performs lazy cleanup with 10% probability to avoid performance impact
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    // Occasional lazy cleanup (10% chance) to avoid perf impact
    if (Math.random() < 0.1) {
      this.lazyCleanup();
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries (lazy/occasional cleanup)
   */
  private lazyCleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
const cache = new SimpleCache();

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  USER_DATA: 5 * 60, // 5 minutes
  USER_ROLE: 10 * 60, // 10 minutes
  EVENT_WITH_COUNT: 30, // 30 seconds
  REGISTRATION_HISTORY_EXISTS: Number.MAX_SAFE_INTEGER, // Permanent (checked once at startup)
  REGISTRATION_HISTORY: 5 * 60, // 5 minutes
  EVENT_DETAILS: 30, // 30 seconds
  WAITING_LIST: 5 * 60, // 5 minutes
};

// Cache key generators
export const CacheKeys = {
  userById: (userId: string) => `user:${userId}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userRole: (userId: string) => `user:role:${userId}`,
  eventWithCount: (eventId: string) => `event:withCount:${eventId}`,
  registrationHistoryExists: () => `regHistory:exists`,
  registrationHistory: (eventId?: string) =>
    eventId ? `regHistory:event:${eventId}` : `regHistory:all`,
  eventDetails: (eventId: string) => `event:details:${eventId}`,
  waitingList: (eventId: string) => `waitingList:${eventId}`,
};

/**
 * Get user data from cache or return null
 */
export function getCachedUser<T>(key: string): T | null {
  return cache.get<T>(key);
}

/**
 * Set user data in cache
 */
export function setCachedUser<T>(key: string, user: T): void {
  cache.set(key, user, CACHE_TTL.USER_DATA);
}

/**
 * Get user role from cache
 */
export function getCachedRole(userId: string): string | null {
  return cache.get<string>(CacheKeys.userRole(userId));
}

/**
 * Set user role in cache
 */
export function setCachedRole(userId: string, role: string): void {
  cache.set(CacheKeys.userRole(userId), role, CACHE_TTL.USER_ROLE);
}

/**
 * Invalidate user cache (call when user is updated)
 */
export function invalidateUserCache(userId: string): void {
  const roleKey = CacheKeys.userRole(userId);
  cache.delete(roleKey);

  // Also clear by ID and email patterns
  for (const key of cache.getStats().keys) {
    if (key.startsWith(`user:${userId}`)) {
      cache.delete(key);
    }
  }
}

/**
 * Get event with count from cache
 */
export function getCachedEventWithCount<T>(eventId: string): T | null {
  return cache.get<T>(CacheKeys.eventWithCount(eventId));
}

/**
 * Set event with count in cache
 */
export function setCachedEventWithCount<T>(eventId: string, event: T): void {
  cache.set(
    CacheKeys.eventWithCount(eventId),
    event,
    CACHE_TTL.EVENT_WITH_COUNT,
  );
}

/**
 * Check if registration history table exists (cached at startup)
 */
export function getRegistrationHistoryTableExists(): boolean | null {
  return cache.get<boolean>(CacheKeys.registrationHistoryExists());
}

/**
 * Set registration history table existence (call once at startup)
 */
export function setRegistrationHistoryTableExists(
  exists: boolean | null,
): void {
  cache.set(
    CacheKeys.registrationHistoryExists(),
    exists ?? false,
    CACHE_TTL.REGISTRATION_HISTORY_EXISTS,
  );
}

/**
 * Get registration history from cache
 */
export function getCachedRegistrationHistory<T>(eventId?: string): T | null {
  return cache.get<T>(CacheKeys.registrationHistory(eventId));
}

/**
 * Set registration history in cache
 */
export function setCachedRegistrationHistory<T>(
  history: T,
  eventId?: string,
): void {
  cache.set(
    CacheKeys.registrationHistory(eventId),
    history,
    CACHE_TTL.REGISTRATION_HISTORY,
  );
}

/**
 * Get event details from cache
 */
export function getCachedEventDetails<T>(eventId: string): T | null {
  return cache.get<T>(CacheKeys.eventDetails(eventId));
}

/**
 * Set event details in cache
 */
export function setCachedEventDetails<T>(eventId: string, event: T): void {
  cache.set(CacheKeys.eventDetails(eventId), event, CACHE_TTL.EVENT_DETAILS);
}

/**
 * Get waiting list from cache
 */
export function getCachedWaitingList<T>(eventId: string): T | null {
  return cache.get<T>(CacheKeys.waitingList(eventId));
}

/**
 * Set waiting list in cache
 */
export function setCachedWaitingList<T>(eventId: string, waitingList: T): void {
  cache.set(
    CacheKeys.waitingList(eventId),
    waitingList,
    CACHE_TTL.WAITING_LIST,
  );
}

/**
 * Invalidate all event-related cache for a specific event
 */
export function invalidateEventCache(eventId: string): void {
  cache.delete(CacheKeys.eventWithCount(eventId));
  cache.delete(CacheKeys.eventDetails(eventId));
  cache.delete(CacheKeys.waitingList(eventId));
  cache.delete(CacheKeys.registrationHistory(eventId));
}

/**
 * Clear all cache (useful for testing)
 */
export function clearAllCache(): void {
  cache.clear();
}

// Export cache instance for advanced use cases
export { cache };
