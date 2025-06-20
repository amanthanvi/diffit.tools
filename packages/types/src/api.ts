import { z } from 'zod';
import { Diff, CreateDiffInput, UpdateDiffInput } from './diff';
import { Collection, CreateCollectionInput, UpdateCollectionInput } from './collection';
import { Comment, CreateCommentInput } from './comment';

/**
 * API response status
 */
export const ApiStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
  PARTIAL: 'partial',
} as const;

export type ApiStatus = typeof ApiStatus[keyof typeof ApiStatus];

/**
 * Standard API error
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  cursor?: string;
  nextCursor?: string;
}

/**
 * Sort parameters
 */
export interface SortParams<T = string> {
  sortBy?: T;
  order?: 'asc' | 'desc';
}

/**
 * Filter parameters
 */
export interface FilterParams {
  search?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: any;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  status: ApiStatus;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: Date;
    requestId: string;
    version: string;
    [key: string]: any;
  };
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

/**
 * Batch operation result
 */
export interface BatchResult<T> {
  successful: T[];
  failed: Array<{
    item: any;
    error: ApiError;
  }>;
  stats: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

/**
 * File upload parameters
 */
export interface FileUploadParams {
  file: File | Blob;
  filename?: string;
  mimeType?: string;
  metadata?: Record<string, any>;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  id: string;
  url: string;
  publicUrl?: string;
  size: number;
  mimeType: string;
  metadata: Record<string, any>;
  expiresAt?: Date;
}

// API Request types
export interface DiffApiRequests {
  list: PaginationParams & SortParams & FilterParams;
  get: { id: string };
  create: CreateDiffInput;
  update: { id: string } & UpdateDiffInput;
  delete: { id: string };
  fork: { id: string };
  export: { id: string; format: 'html' | 'pdf' | 'markdown' };
}

export interface CollectionApiRequests {
  list: PaginationParams & SortParams & FilterParams;
  get: { id: string };
  create: CreateCollectionInput;
  update: { id: string } & UpdateCollectionInput;
  delete: { id: string };
  addDiff: { collectionId: string; diffId: string };
  removeDiff: { collectionId: string; diffId: string };
}

export interface CommentApiRequests {
  list: { diffId: string } & PaginationParams;
  create: CreateCommentInput;
  update: { id: string; content: string };
  delete: { id: string };
  react: { commentId: string; reaction: string };
}


// API Response types
export interface DiffApiResponses {
  list: PaginatedResponse<Diff>;
  get: ApiResponse<Diff>;
  create: ApiResponse<Diff>;
  update: ApiResponse<Diff>;
  delete: ApiResponse<{ success: boolean }>;
  fork: ApiResponse<Diff>;
  export: ApiResponse<{ url: string }>;
}

export interface CollectionApiResponses {
  list: PaginatedResponse<Collection>;
  get: ApiResponse<Collection>;
  create: ApiResponse<Collection>;
  update: ApiResponse<Collection>;
  delete: ApiResponse<{ success: boolean }>;
}

export interface CommentApiResponses {
  list: PaginatedResponse<Comment>;
  create: ApiResponse<Comment>;
  update: ApiResponse<Comment>;
  delete: ApiResponse<{ success: boolean }>;
}

// Zod schemas
export const ApiStatusSchema = z.enum([
  ApiStatus.SUCCESS,
  ApiStatus.ERROR,
  ApiStatus.PARTIAL,
]);

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  stack: z.string().optional(),
});

export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});

export const PaginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  hasMore: z.boolean(),
  cursor: z.string().optional(),
  nextCursor: z.string().optional(),
});

export const SortParamsSchema = z.object({
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const FilterParamsSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
}).passthrough();

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    status: ApiStatusSchema,
    data: dataSchema.optional(),
    error: ApiErrorSchema.optional(),
    meta: z.object({
      timestamp: z.date(),
      requestId: z.string(),
      version: z.string(),
    }).passthrough().optional(),
  });

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  ApiResponseSchema(z.array(itemSchema)).extend({
    pagination: PaginationMetaSchema,
  });

export const BatchResultSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    successful: z.array(itemSchema),
    failed: z.array(z.object({
      item: z.any(),
      error: ApiErrorSchema,
    })),
    stats: z.object({
      total: z.number().int(),
      succeeded: z.number().int(),
      failed: z.number().int(),
    }),
  });

export const FileUploadResponseSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  publicUrl: z.string().url().optional(),
  size: z.number().int().min(0),
  mimeType: z.string(),
  metadata: z.record(z.any()),
  expiresAt: z.date().optional(),
});