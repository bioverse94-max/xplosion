/**
 * High-performance, memory-efficient sliding window rate limiter
 * Protects against brute-force, credential stuffing, and SMS/OTP spam.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

// Periodic garbage collection to ensure zero memory leaks
const GC_INTERVAL_MS = 60 * 1000;
let lastGc = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastGc < GC_INTERVAL_MS) return;
  lastGc = now;

  store.forEach((record, key) => {
    if (now > record.resetAt) {
      store.delete(key);
    }
  });
}

export interface RateLimitOptions {
  limit: number; // Max allowed requests in window
  windowSeconds: number; // Duration of window in seconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks and increments the rate limit for a specific key (e.g. IP + action + identifier)
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  cleanupExpired();

  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      resetInSeconds: options.windowSeconds,
    };
  }

  if (record.count >= options.limit) {
    const resetInSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}

/**
 * Helper to extract client IP address from Next.js NextRequest
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp.trim();
  }
  return "127.0.0.1";
}
