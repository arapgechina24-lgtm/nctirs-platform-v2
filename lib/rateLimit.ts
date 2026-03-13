/**
 * In-memory rate limiter for API routes.
 * Uses a sliding window approach with automatic cleanup.
 *
 * For production, replace with Redis-backed solution (e.g., @upstash/ratelimit).
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks (runs at most once per minute)
let lastCleanup = 0;
function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < 60_000) return;
    lastCleanup = now;
    for (const [key, val] of rateLimitStore) {
        if (now > val.resetAt) rateLimitStore.delete(key);
    }
}

export interface RateLimitConfig {
    /** Maximum requests allowed per window */
    limit: number;
    /** Window duration in milliseconds */
    windowMs: number;
}

/** Default rate limit presets */
export const RATE_LIMITS = {
    /** Strict: 5 req / 60s — for registration, auth */
    STRICT: { limit: 5, windowMs: 60_000 },
    /** Standard: 30 req / 60s — for general write endpoints */
    STANDARD: { limit: 30, windowMs: 60_000 },
    /** Relaxed: 60 req / 60s — for read endpoints */
    RELAXED: { limit: 60, windowMs: 60_000 },
    /** AI: 20 req / 60s — for AI analysis */
    AI: { limit: 20, windowMs: 60_000 },
} as const;

/**
 * Check if a request is within the rate limit.
 * @param key - Unique key (e.g., IP address, user ID, or combination)
 * @param config - Rate limit configuration
 * @returns Object with `allowed` boolean and `remaining` count
 */
export function checkRateLimit(
    key: string,
    config: RateLimitConfig = RATE_LIMITS.STANDARD
): { allowed: boolean; remaining: number; resetAt: number } {
    cleanup();

    const now = Date.now();
    const prefixedKey = `${config.limit}:${config.windowMs}:${key}`;
    const entry = rateLimitStore.get(prefixedKey);

    if (!entry || now > entry.resetAt) {
        const resetAt = now + config.windowMs;
        rateLimitStore.set(prefixedKey, { count: 1, resetAt });
        return { allowed: true, remaining: config.limit - 1, resetAt };
    }

    if (entry.count >= config.limit) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: config.limit - entry.count,
        resetAt: entry.resetAt,
    };
}

/**
 * Get rate limit headers for the response.
 */
export function rateLimitHeaders(remaining: number, resetAt: number): Record<string, string> {
    return {
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
    };
}
