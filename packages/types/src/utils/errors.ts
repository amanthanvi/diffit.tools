import { z } from 'zod';

/**
 * Error codes for the application
 */
export const ErrorCode = {
  // Authentication errors (4000-4099)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Permission errors (4100-4199)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  PLAN_LIMIT_EXCEEDED: 'PLAN_LIMIT_EXCEEDED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Validation errors (4200-4299)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource errors (4300-4399)
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  RESOURCE_EXPIRED: 'RESOURCE_EXPIRED',
  
  // File errors (4400-4499)
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  
  // Server errors (5000-5099)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Business logic errors (6000-6099)
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  TRIAL_EXPIRED: 'TRIAL_EXPIRED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type ErrorSeverity = typeof ErrorSeverity[keyof typeof ErrorSeverity];

/**
 * Base error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public details?: any,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      severity: this.severity,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Specific error classes
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, ErrorSeverity.LOW, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', code: ErrorCode = ErrorCode.UNAUTHORIZED) {
    super(code, message, 401, ErrorSeverity.MEDIUM);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(ErrorCode.FORBIDDEN, message, 403, ErrorSeverity.MEDIUM);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with id "${id}" not found`
      : `${resource} not found`;
    super(ErrorCode.NOT_FOUND, message, 404, ErrorSeverity.LOW);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.ALREADY_EXISTS, message, 409, ErrorSeverity.LOW, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(limit: number, window: string, retryAfter?: number) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded: ${limit} requests per ${window}`,
      429,
      ErrorSeverity.LOW,
      { limit, window, retryAfter }
    );
    this.name = 'RateLimitError';
  }
}

export class PlanLimitError extends AppError {
  constructor(feature: string, limit: number, current: number) {
    super(
      ErrorCode.PLAN_LIMIT_EXCEEDED,
      `Plan limit exceeded for ${feature}: ${current}/${limit}`,
      403,
      ErrorSeverity.LOW,
      { feature, limit, current }
    );
    this.name = 'PlanLimitError';
  }
}

export class FileError extends AppError {
  constructor(code: ErrorCode, message: string, details?: any) {
    super(code, message, 400, ErrorSeverity.LOW, details);
    this.name = 'FileError';
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCode.PAYMENT_FAILED, message, 402, ErrorSeverity.HIGH, details);
    this.name = 'PaymentError';
  }
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
    documentation?: string;
  };
}

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  field: string;
  code: string;
  message: string;
  value?: any;
}

// Zod schemas
export const ErrorCodeSchema = z.enum([
  ErrorCode.UNAUTHORIZED,
  ErrorCode.INVALID_CREDENTIALS,
  ErrorCode.TOKEN_EXPIRED,
  ErrorCode.TOKEN_INVALID,
  ErrorCode.SESSION_EXPIRED,
  ErrorCode.FORBIDDEN,
  ErrorCode.INSUFFICIENT_PERMISSIONS,
  ErrorCode.PLAN_LIMIT_EXCEEDED,
  ErrorCode.RATE_LIMIT_EXCEEDED,
  ErrorCode.VALIDATION_ERROR,
  ErrorCode.INVALID_INPUT,
  ErrorCode.MISSING_REQUIRED_FIELD,
  ErrorCode.INVALID_FORMAT,
  ErrorCode.NOT_FOUND,
  ErrorCode.ALREADY_EXISTS,
  ErrorCode.RESOURCE_LOCKED,
  ErrorCode.RESOURCE_EXPIRED,
  ErrorCode.FILE_TOO_LARGE,
  ErrorCode.INVALID_FILE_TYPE,
  ErrorCode.FILE_UPLOAD_FAILED,
  ErrorCode.INTERNAL_ERROR,
  ErrorCode.DATABASE_ERROR,
  ErrorCode.EXTERNAL_SERVICE_ERROR,
  ErrorCode.TIMEOUT_ERROR,
  ErrorCode.SUBSCRIPTION_REQUIRED,
  ErrorCode.PAYMENT_FAILED,
  ErrorCode.TRIAL_EXPIRED,
  ErrorCode.FEATURE_NOT_AVAILABLE,
]);

export const ErrorSeveritySchema = z.enum([
  ErrorSeverity.LOW,
  ErrorSeverity.MEDIUM,
  ErrorSeverity.HIGH,
  ErrorSeverity.CRITICAL,
]);

export const ValidationErrorDetailSchema = z.object({
  field: z.string(),
  code: z.string(),
  message: z.string(),
  value: z.any().optional(),
});

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    details: z.any().optional(),
    timestamp: z.string(),
    requestId: z.string().optional(),
    documentation: z.string().url().optional(),
  }),
});

// Error utilities
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}

export function formatZodError(error: z.ZodError): ValidationErrorDetail[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    code: err.code,
    message: err.message,
    value: err.code === 'invalid_type' ? undefined : err,
  }));
}