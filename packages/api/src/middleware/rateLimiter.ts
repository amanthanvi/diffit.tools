import { TRPCError } from '@trpc/server';
import { middleware } from '../trpc';
import type { RateLimitConfig } from '../types';

/**
 * Rate limiting middleware using sliding window algorithm
 */
export function rateLimiter(config: RateLimitConfig) {
  return middleware(async ({ ctx, next, path }) => {
    // Skip rate limiting if configured
    if (config.skip?.(ctx)) {
      return next();
    }
    
    // No rate limiting without Redis
    if (!ctx.redis) {
      console.warn('Rate limiting disabled: Redis not available');
      return next();
    }
    
    // Generate rate limit key
    const keyGenerator = config.keyGenerator || ((ctx) => {
      if (ctx.user) return `rate:user:${ctx.user.id}`;
      if (ctx.apiKey) return `rate:api:${ctx.apiKey.id}`;
      // Fall back to IP address
      const ip = ctx.req.headers.get('x-forwarded-for') || 
                 ctx.req.headers.get('x-real-ip') || 
                 'unknown';
      return `rate:ip:${ip}`;
    });
    
    const key = `${keyGenerator(ctx)}:${path}`;
    const windowKey = `${key}:window`;
    
    // Sliding window algorithm
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get current window data
    const windowData = await ctx.redis.get(windowKey);
    let timestamps: number[] = windowData ? JSON.parse(windowData) : [];
    
    // Remove expired timestamps
    timestamps = timestamps.filter(ts => ts > windowStart);
    
    // Check if limit exceeded
    if (timestamps.length >= config.max) {
      const oldestTimestamp = Math.min(...timestamps);
      const resetTime = new Date(oldestTimestamp + config.windowMs);
      
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: config.message || `Rate limit exceeded. Try again after ${resetTime.toISOString()}`,
        cause: {
          limit: config.max,
          window: config.windowMs,
          reset: resetTime,
        },
      });
    }
    
    // Add current timestamp
    timestamps.push(now);
    
    // Update window data
    await ctx.redis.set(windowKey, JSON.stringify(timestamps), {
      ex: Math.ceil(config.windowMs / 1000),
    });
    
    // Add rate limit headers
    const remaining = config.max - timestamps.length;
    const reset = Math.min(...timestamps) + config.windowMs;
    
    ctx.res.headers.set('X-RateLimit-Limit', config.max.toString());
    ctx.res.headers.set('X-RateLimit-Remaining', remaining.toString());
    ctx.res.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());
    
    return next();
  });
}

// Preset rate limiters
export const standardRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});

export const strictRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
});

export const apiRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  keyGenerator: (ctx) => {
    if (ctx.apiKey) {
      // Use API key specific limit
      return `rate:api:${ctx.apiKey.id}`;
    }
    return `rate:user:${ctx.user?.id || 'anonymous'}`;
  },
});