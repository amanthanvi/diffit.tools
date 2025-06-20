import { inferAsyncReturnType } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import type { RedisClient } from '../types';

// Lazy imports to avoid loading during build
let dbPromise: Promise<any> | null = null;
let redisClientPromise: Promise<any> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = import('@diffit/db').then(mod => mod.db);
  }
  return dbPromise;
}

async function getRedisClient() {
  if (!redisClientPromise) {
    redisClientPromise = import('../utils/redis').then(mod => mod.createRedisClient());
  }
  return redisClientPromise;
}

/**
 * Creates the context for each request
 */
export async function createContext(
  opts: FetchCreateContextFnOptions
) {
  const { req, resHeaders } = opts;
  
  // Create response object that can be used to set headers
  const res = {
    headers: resHeaders,
  } as Response;
  
  // Get database connection
  const db = await getDb();
  
  // Get Redis client if available
  let redis: RedisClient | undefined;
  try {
    redis = await getRedisClient();
  } catch (error) {
    console.warn('Redis connection failed, continuing without cache:', error);
  }
  
  return {
    db,
    req,
    res,
    redis,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;