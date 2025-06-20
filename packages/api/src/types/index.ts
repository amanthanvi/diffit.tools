import { z } from 'zod';
import type { Diff, Collection, Comment, Usage } from '@diffit/db';
import type { db } from '@diffit/db';

// Context types
export interface Context {
  db: typeof db;
  req: Request;
  res: Response;
  redis?: RedisClient;
}

// Redis client interface
export interface RedisClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number }) => Promise<void>;
  del: (key: string) => Promise<void>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<void>;
  ttl: (key: string) => Promise<number>;
}

// Rate limit types
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (ctx: Context) => string;
  skip?: (ctx: Context) => boolean;
  message?: string;
}

// WebSocket types
export interface WSMessage {
  type: 'join' | 'leave' | 'cursor' | 'selection' | 'ping' | 'pong' | 
        'user_joined' | 'user_left' | 'room_state' | 'cursor_update' | 
        'selection_update' | 'diff-update' | 'comment-added';
  data: any;
  room?: string;
  userId?: string;
}

// File upload types
export interface FileUploadOptions {
  maxSize: number;
  allowedTypes: string[];
  storage: 'local' | 's3';
}

export interface UploadedFile {
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  checksum: string;
}

// Error types
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Common validation schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
});

export const sortSchema = z.object({
  field: z.string(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});

// API response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  cursor?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId: string;
    timestamp: Date;
    version: string;
  };
}

// Webhook types
export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  signature: string;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}