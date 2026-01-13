/**
 * Simple in-memory rate limiter for Vercel serverless
 * Note: In serverless, each instance has its own memory.
 * For production, use Upstash Redis: https://upstash.com/docs/redis/features/ratelimit
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Global cache for rate limiting (persists within serverless instance)
const rateLimitCache = new Map<string, RateLimitEntry>();

const RATE_LIMITS = {
  registration: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 req/min per IP
  waitinglist: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 req/min per IP
  eventsList: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 req/min per IP
  default: { windowMs: 60 * 1000, maxRequests: 100 },
};

function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",");
    return parts[0]?.trim() ?? "unknown";
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

export function rateLimit(
  request: Request,
  endpoint: keyof typeof RATE_LIMITS = "default",
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMITS[endpoint] ?? RATE_LIMITS.default;
  const key = getClientIP(request);
  const now = Date.now();

  let entry = rateLimitCache.get(key);

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  entry.count++;
  rateLimitCache.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

export function getRateLimitHeaders(
  remaining: number,
  resetTime: number,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": "100",
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
    "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
  };
}

export function rateLimitExceededHeaders(): Record<string, string> {
  const retryAfter = 60;
  return {
    "X-RateLimit-Limit": "5",
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + retryAfter),
    "Retry-After": String(retryAfter),
    "X-RateLimit-Blocked": "true",
  };
}
