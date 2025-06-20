import { middleware } from '../trpc';
import type { UsageType } from '@diffit/db';
import crypto from 'crypto';

/**
 * Logging middleware for monitoring and debugging
 */
export const logging = middleware(async ({ ctx, next, path, type }) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  
  // Add request ID to context
  ctx.res.headers.set('X-Request-ID', requestId);
  
  // Log request
  console.log({
    type: 'request',
    requestId,
    path,
    method: type,
    userId: ctx.user?.id,
    apiKeyId: ctx.apiKey?.id,
    timestamp: new Date().toISOString(),
  });
  
  try {
    const result = await next();
    const duration = Date.now() - start;
    
    // Log successful response
    console.log({
      type: 'response',
      requestId,
      path,
      duration,
      status: 'success',
      timestamp: new Date().toISOString(),
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    // Log error response
    console.error({
      type: 'response',
      requestId,
      path,
      duration,
      status: 'error',
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      timestamp: new Date().toISOString(),
    });
    
    throw error;
  }
});

/**
 * Usage tracking middleware
 */
export function trackUsage(type: UsageType) {
  return middleware(async ({ ctx, next }) => {
    const result = await next();
    
    // Track usage asynchronously (don't block response)
    ctx.db.usage.create({
      data: {
        userId: ctx.user?.id,
        apiKeyId: ctx.apiKey?.id,
        type,
        metadata: {
          userAgent: ctx.req.headers.get('user-agent'),
          referer: ctx.req.headers.get('referer'),
        },
        ipAddress: ctx.req.headers.get('x-forwarded-for') || 
                   ctx.req.headers.get('x-real-ip') || 
                   undefined,
        userAgent: ctx.req.headers.get('user-agent') || undefined,
      },
    }).catch(error => {
      console.error('Failed to track usage:', error);
    });
    
    return result;
  });
}