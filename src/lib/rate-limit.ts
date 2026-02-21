// In-memory rate limiting utility
// Suitable for single-instance or serverless deployments with short lifetimes.
// For robust multi-instance distributed rate-limiting, consider Redis (Upstash).

type RateLimitRecord = {
    count: number;
    resetTime: number;
};

const store = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
    limit: number;
    windowMs: number;
}

/**
 * Basic in-memory rate limiter.
 * @param identifier The unique key to limit by (e.g., IP address + Action)
 * @param options Configuration options
 * @returns Object indicating if the limit is exceeded and how many requests are remaining
 */
export function rateLimit(identifier: string, options: RateLimitOptions) {
    const now = Date.now();
    const record = store.get(identifier) ?? { count: 0, resetTime: now + options.windowMs };

    // Reset window if it has passed
    if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + options.windowMs;
    }

    record.count++;
    store.set(identifier, record);

    const isExceeded = record.count > options.limit;
    const remaining = Math.max(0, options.limit - record.count);

    return {
        isExceeded,
        remaining,
        resetTime: record.resetTime,
    };
}
