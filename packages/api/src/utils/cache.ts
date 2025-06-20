import type { RedisClient } from '../types';
import { createHash } from 'crypto';

/**
 * Cache key generators
 */
export const cacheKeys = {
  diff: (slug: string) => `cache:diff:${slug}`,
  collection: (slug: string) => `cache:collection:${slug}`,
  userDiffs: (userId: string, page: number) => `cache:user:${userId}:diffs:${page}`,
  userCollections: (userId: string) => `cache:user:${userId}:collections`,
  comments: (diffId: string, page: number) => `cache:diff:${diffId}:comments:${page}`,
  analytics: (diffId: string) => `cache:diff:${diffId}:analytics`,
  apiKeyUsage: (keyId: string, period: string) => `cache:apikey:${keyId}:usage:${period}`,
};

/**
 * Cache TTL values (in seconds)
 */
export const cacheTTL = {
  diff: 300, // 5 minutes
  collection: 600, // 10 minutes
  userContent: 60, // 1 minute
  comments: 120, // 2 minutes
  analytics: 3600, // 1 hour
  apiKeyUsage: 300, // 5 minutes
};

/**
 * Cache invalidation helpers
 */
export async function invalidateCache(
  redis: RedisClient | undefined,
  patterns: string[]
): Promise<void> {
  if (!redis) return;
  
  // In production, use Redis SCAN to find and delete matching keys
  // For now, delete specific keys
  await Promise.all(patterns.map(pattern => redis.del(pattern))).catch(console.error);
}

/**
 * Invalidate diff-related caches
 */
export async function invalidateDiffCache(
  redis: RedisClient | undefined,
  diffId: string,
  slug: string,
  userId?: string
): Promise<void> {
  const patterns = [
    cacheKeys.diff(slug),
    cacheKeys.analytics(diffId),
  ];
  
  if (userId) {
    // Invalidate user's diff list cache (all pages)
    for (let i = 1; i <= 10; i++) {
      patterns.push(cacheKeys.userDiffs(userId, i));
    }
  }
  
  await invalidateCache(redis, patterns);
}

/**
 * Invalidate collection-related caches
 */
export async function invalidateCollectionCache(
  redis: RedisClient | undefined,
  collectionId: string,
  slug: string,
  userId: string
): Promise<void> {
  const patterns = [
    cacheKeys.collection(slug),
    cacheKeys.userCollections(userId),
  ];
  
  await invalidateCache(redis, patterns);
}

/**
 * Invalidate comment-related caches
 */
export async function invalidateCommentCache(
  redis: RedisClient | undefined,
  diffId: string
): Promise<void> {
  const patterns = [];
  
  // Invalidate all comment pages for this diff
  for (let i = 1; i <= 10; i++) {
    patterns.push(cacheKeys.comments(diffId, i));
  }
  
  await invalidateCache(redis, patterns);
}

/**
 * Generate cache key from request parameters
 */
export function generateCacheKey(prefix: string, params: any): string {
  const hash = createHash('md5')
    .update(JSON.stringify(params))
    .digest('hex');
  return `${prefix}:${hash}`;
}

/**
 * Cache wrapper with stale-while-revalidate support
 */
export async function cacheWithSWR<T>(
  redis: RedisClient | undefined,
  key: string,
  ttl: number,
  staleTime: number,
  fn: () => Promise<T>
): Promise<T> {
  if (!redis) {
    return fn();
  }
  
  try {
    // Try to get from cache
    const cached = await redis.get(key);
    if (cached) {
      const data = JSON.parse(cached);
      
      // Check if data is fresh
      if (data.timestamp + ttl * 1000 > Date.now()) {
        return data.value;
      }
      
      // Data is stale but within SWR window
      if (data.timestamp + (ttl + staleTime) * 1000 > Date.now()) {
        // Return stale data and refresh in background
        refreshInBackground(redis, key, ttl, fn);
        return data.value;
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  
  // Generate fresh data
  const value = await fn();
  
  // Store in cache
  try {
    const data = {
      value,
      timestamp: Date.now(),
    };
    await redis.set(key, JSON.stringify(data), { ex: ttl + staleTime });
  } catch (error) {
    console.error('Cache write error:', error);
  }
  
  return value;
}

/**
 * Refresh cache in background
 */
async function refreshInBackground<T>(
  redis: RedisClient,
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<void> {
  try {
    const value = await fn();
    const data = {
      value,
      timestamp: Date.now(),
    };
    await redis.set(key, JSON.stringify(data), { ex: ttl * 2 });
  } catch (error) {
    console.error('Background cache refresh error:', error);
  }
}

/**
 * Batch cache operations
 */
export class BatchCache {
  private operations: Array<() => Promise<void>> = [];
  
  constructor(private redis: RedisClient | undefined) {}
  
  set(key: string, value: any, ttl: number): this {
    if (!this.redis) return this;
    
    this.operations.push(async () => {
      await this.redis!.set(key, JSON.stringify(value), { ex: ttl });
    });
    return this;
  }
  
  del(key: string): this {
    if (!this.redis) return this;
    
    this.operations.push(async () => {
      await this.redis!.del(key);
    });
    return this;
  }
  
  async execute(): Promise<void> {
    if (!this.redis || this.operations.length === 0) return;
    
    try {
      await Promise.all(this.operations.map(op => op()));
    } catch (error) {
      console.error('Batch cache operation error:', error);
    }
  }
}