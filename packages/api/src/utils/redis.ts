import type { RedisClient } from '../types';

// Mock Redis client for development
// In production, use ioredis or similar
class MockRedisClient implements RedisClient {
  private store: Map<string, { value: string; expires?: number }> = new Map();
  
  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expires && item.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  async set(key: string, value: string, options?: { ex?: number }): Promise<void> {
    const expires = options?.ex ? Date.now() + options.ex * 1000 : undefined;
    this.store.set(key, { value, expires });
  }
  
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const value = current ? parseInt(current) + 1 : 1;
    await this.set(key, value.toString());
    return value;
  }
  
  async expire(key: string, seconds: number): Promise<void> {
    const item = this.store.get(key);
    if (item) {
      item.expires = Date.now() + seconds * 1000;
    }
  }
  
  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item || !item.expires) return -1;
    
    const ttl = Math.floor((item.expires - Date.now()) / 1000);
    return ttl > 0 ? ttl : -2;
  }
}

let redisClient: RedisClient | null = null;

export async function createRedisClient(): Promise<RedisClient> {
  if (redisClient) return redisClient;
  
  // In production, connect to actual Redis
  if (process.env.REDIS_URL) {
    // TODO: Implement real Redis connection
    // const Redis = require('ioredis');
    // redisClient = new Redis(process.env.REDIS_URL);
  }
  
  // For now, use mock client
  redisClient = new MockRedisClient();
  return redisClient;
}

/**
 * Cache wrapper for expensive operations
 */
export async function withCache<T>(
  redis: RedisClient | undefined,
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  if (!redis) {
    return fn();
  }
  
  // Try to get from cache
  const cached = await redis.get(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Invalid JSON, proceed to regenerate
    }
  }
  
  // Generate new value
  const value = await fn();
  
  // Store in cache
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttl });
  } catch (error) {
    console.error('Failed to cache value:', error);
  }
  
  return value;
}