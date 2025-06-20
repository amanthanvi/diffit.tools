import { inferAsyncReturnType } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { db } from '@diffit/db';
import type { Context, RedisClient } from '../types';
import { createRedisClient } from '../utils/redis';

/**
 * Creates the context for each request
 */
export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<Context> {
  const { req, resHeaders } = opts;
  
  // Create response object that can be used to set headers
  const res = {
    headers: resHeaders,
  } as Response;
  
  // Get Redis client if available
  let redis: RedisClient | undefined;
  try {
    redis = await createRedisClient();
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