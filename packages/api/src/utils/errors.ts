import { TRPCError } from '@trpc/server';
import { ZodError } from 'zod';

/**
 * Custom error codes
 */
export const ERROR_CODES = {
  // Authentication & Authorization
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  API_KEY_INVALID: 'API_KEY_INVALID',
  API_KEY_EXPIRED: 'API_KEY_EXPIRED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // Resource Errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_EXPIRED: 'RESOURCE_EXPIRED',
  RESOURCE_DELETED: 'RESOURCE_DELETED',
  
  // Validation
  INVALID_INPUT: 'INVALID_INPUT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  
  // Business Logic
  PLAN_LIMIT_EXCEEDED: 'PLAN_LIMIT_EXCEEDED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  
  // External Services
  WEBHOOK_FAILED: 'WEBHOOK_FAILED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
} as const;

/**
 * Error response formatter
 */
export function formatError(error: unknown): {
  code: string;
  message: string;
  details?: any;
} {
  // Handle TRPCError
  if (error instanceof TRPCError) {
    return {
      code: error.code,
      message: error.message,
      details: error.cause,
    };
  }
  
  // Handle ZodError
  if (error instanceof ZodError) {
    return {
      code: 'BAD_REQUEST',
      message: 'Validation error',
      details: error.flatten(),
    };
  }
  
  // Handle custom ApiError
  if (error instanceof Error && 'code' in error) {
    return {
      code: (error as any).code,
      message: error.message,
      details: (error as any).details,
    };
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
    };
  }
  
  // Unknown error
  return {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  };
}

/**
 * Create standardized error responses
 */
export const errors = {
  unauthorized: (message = 'You must be logged in to perform this action') =>
    new TRPCError({ code: 'UNAUTHORIZED', message }),
  
  forbidden: (message = 'You don\'t have permission to perform this action') =>
    new TRPCError({ code: 'FORBIDDEN', message }),
  
  notFound: (resource = 'Resource') =>
    new TRPCError({ code: 'NOT_FOUND', message: `${resource} not found` }),
  
  badRequest: (message: string, details?: any) =>
    new TRPCError({ code: 'BAD_REQUEST', message, cause: details }),
  
  conflict: (message: string) =>
    new TRPCError({ code: 'CONFLICT', message }),
  
  tooManyRequests: (resetTime?: Date) =>
    new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded',
      cause: { resetTime },
    }),
  
  planLimitExceeded: (limit: string, current: number, max: number) =>
    new TRPCError({
      code: 'FORBIDDEN',
      message: `You've reached your ${limit} limit (${current}/${max})`,
      cause: { code: ERROR_CODES.PLAN_LIMIT_EXCEEDED, limit, current, max },
    }),
  
  featureNotAvailable: (feature: string, requiredPlan: string) =>
    new TRPCError({
      code: 'FORBIDDEN',
      message: `${feature} is only available on ${requiredPlan} plan`,
      cause: { code: ERROR_CODES.FEATURE_NOT_AVAILABLE, feature, requiredPlan },
    }),
  
  internal: (message = 'An internal error occurred', details?: any) =>
    new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message,
      cause: details,
    }),
};

/**
 * Error logging helper
 */
export function logError(
  error: unknown,
  context: {
    userId?: string;
    path?: string;
    input?: any;
    [key: string]: any;
  }
): void {
  const formattedError = formatError(error);
  
  console.error({
    timestamp: new Date().toISOString(),
    error: formattedError,
    context,
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  // In production, send to error tracking service (e.g., Sentry)
}