import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

/**
 * Generate a unique slug for URLs
 */
export function generateSlug(length: number = 8): string {
  return randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Generate a secure API key
 */
export function generateApiKey(prefix: string = 'dfft'): string {
  return `${prefix}_${randomBytes(32).toString('hex')}`;
}

/**
 * Hash an API key for storage (you might want to use bcrypt in production)
 */
export async function hashApiKey(key: string): Promise<string> {
  // In production, use bcrypt or argon2
  // This is a simplified version for demonstration
  return Buffer.from(key).toString('base64');
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .slice(0, 10000); // Limit length
}

/**
 * Parse and validate sort parameters
 */
export function parseSortParams(
  sort?: string,
  allowedFields: string[] = ['createdAt', 'updatedAt', 'viewCount']
): Prisma.SortOrder {
  if (!sort) return { createdAt: 'desc' };
  
  const [field, direction] = sort.split(':');
  
  if (!allowedFields.includes(field)) {
    return { createdAt: 'desc' };
  }
  
  const order = direction === 'asc' ? 'asc' : 'desc';
  
  return { [field]: order } as any;
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Calculate expiration date based on plan
 */
export function calculateExpirationDate(
  plan: 'FREE' | 'PRO' | 'ENTERPRISE',
  customDays?: number
): Date | null {
  if (customDays) {
    return new Date(Date.now() + customDays * 24 * 60 * 60 * 1000);
  }
  
  switch (plan) {
    case 'FREE':
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    case 'PRO':
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    case 'ENTERPRISE':
      return null; // No expiration
    default:
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Build where clause for search queries
 */
export function buildSearchWhere(
  search?: string,
  fields: string[] = ['title', 'description']
): Prisma.DiffWhereInput | undefined {
  if (!search || search.trim().length < 2) {
    return undefined;
  }
  
  const searchTerm = search.trim();
  
  return {
    OR: fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as Prisma.QueryMode,
      },
    })),
  };
}

/**
 * Handle Prisma errors and return user-friendly messages
 */
export function handlePrismaError(error: unknown): {
  message: string;
  code?: string;
  field?: string;
} {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        const field = (error.meta?.target as string[])?.[0];
        return {
          message: `A record with this ${field || 'value'} already exists`,
          code: 'DUPLICATE_ERROR',
          field,
        };
      case 'P2025':
        return {
          message: 'Record not found',
          code: 'NOT_FOUND',
        };
      case 'P2003':
        return {
          message: 'Invalid reference',
          code: 'FOREIGN_KEY_ERROR',
        };
      case 'P2014':
        return {
          message: 'Invalid ID provided',
          code: 'INVALID_ID',
        };
      default:
        return {
          message: 'Database operation failed',
          code: error.code,
        };
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      message: 'Invalid data provided',
      code: 'VALIDATION_ERROR',
    };
  }
  
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Batch operations helper
 */
export class BatchProcessor<T> {
  private batch: T[] = [];
  private batchSize: number;
  private processor: (items: T[]) => Promise<void>;

  constructor(batchSize: number, processor: (items: T[]) => Promise<void>) {
    this.batchSize = batchSize;
    this.processor = processor;
  }

  async add(item: T): Promise<void> {
    this.batch.push(item);
    
    if (this.batch.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.batch.length === 0) return;
    
    const items = [...this.batch];
    this.batch = [];
    
    await this.processor(items);
  }
}

/**
 * Retry helper for database operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Database metrics collector
 */
export class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();

  record(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    
    const values = this.metrics.get(metric)!;
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }

  getStats(metric: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    
    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sorted.reduce((a, b) => a + b, 0) / count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };
  }

  clear(): void {
    this.metrics.clear();
  }
}

// Global metrics instance
export const dbMetrics = new MetricsCollector();