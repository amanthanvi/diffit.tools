import { z } from 'zod';

/**
 * Cursor-based pagination input
 */
export interface CursorPaginationInput {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

/**
 * Offset-based pagination input
 */
export interface OffsetPaginationInput {
  page?: number;
  limit?: number;
}

/**
 * Generic pagination input (supports both cursor and offset)
 */
export type PaginationInput = CursorPaginationInput | OffsetPaginationInput;

/**
 * Pagination info for responses
 */
export interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  limit: number;
}

/**
 * Paginated edge wrapper
 */
export interface Edge<T> {
  node: T;
  cursor: string;
}

/**
 * Paginated connection (GraphQL style)
 */
export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PaginationInfo;
  totalCount?: number;
}

/**
 * Simple paginated list
 */
export interface PaginatedList<T> {
  items: T[];
  pagination: PaginationInfo;
}

/**
 * Relay-style connection arguments
 */
export interface ConnectionArgs {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

// Pagination utilities
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Calculate offset from page number
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(totalCount: number, limit: number): number {
  return Math.ceil(totalCount / limit);
}

/**
 * Create cursor from item
 */
export function encodeCursor(item: { id: string; createdAt: Date }): string {
  return Buffer.from(`${item.createdAt.toISOString()}:${item.id}`).toString('base64');
}

/**
 * Decode cursor
 */
export function decodeCursor(cursor: string): { timestamp: string; id: string } {
  const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
  const [timestamp, id] = decoded.split(':');
  return { timestamp, id };
}

// Zod schemas
export const CursorPaginationInputSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
  direction: z.enum(['forward', 'backward']).optional(),
});

export const OffsetPaginationInputSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
});

export const PaginationInfoSchema = z.object({
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  startCursor: z.string().optional(),
  endCursor: z.string().optional(),
  totalCount: z.number().int().optional(),
  currentPage: z.number().int().optional(),
  totalPages: z.number().int().optional(),
  limit: z.number().int(),
});

export const EdgeSchema = <T extends z.ZodType>(nodeSchema: T) =>
  z.object({
    node: nodeSchema,
    cursor: z.string(),
  });

export const ConnectionSchema = <T extends z.ZodType>(nodeSchema: T) =>
  z.object({
    edges: z.array(EdgeSchema(nodeSchema)),
    pageInfo: PaginationInfoSchema,
    totalCount: z.number().int().optional(),
  });

export const PaginatedListSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: PaginationInfoSchema,
  });

export const ConnectionArgsSchema = z.object({
  first: z.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
  after: z.string().optional(),
  last: z.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
  before: z.string().optional(),
}).refine(
  (data) => {
    // Can't use both forward and backward pagination
    if ((data.first || data.after) && (data.last || data.before)) {
      return false;
    }
    // Must have at least one pagination parameter
    return !!(data.first || data.last || data.after || data.before);
  },
  {
    message: 'Must specify either forward (first/after) or backward (last/before) pagination',
  }
);

// Type guards
export function isCursorPagination(input: PaginationInput): input is CursorPaginationInput {
  return 'cursor' in input || 'direction' in input;
}

export function isOffsetPagination(input: PaginationInput): input is OffsetPaginationInput {
  return 'page' in input && !('cursor' in input);
}