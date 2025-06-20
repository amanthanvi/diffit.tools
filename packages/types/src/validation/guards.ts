import { z } from 'zod';
import { 
  Diff,
  DiffVisibility,
  Collection,
  Comment,
  CommentStatus,
} from '../';

/**
 * Type guard for Diff objects
 */
export function isDiff(value: unknown): value is Diff {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'leftContent' in value &&
    'rightContent' in value &&
    'metadata' in value
  );
}

/**
 * Type guard for DiffVisibility
 */
export function isDiffVisibility(value: unknown): value is DiffVisibility {
  return (
    typeof value === 'string' &&
    ['public', 'private', 'unlisted', 'password'].includes(value)
  );
}

/**
 * Type guard for Collection objects
 */
export function isCollection(value: unknown): value is Collection {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'slug' in value &&
    'visibility' in value
  );
}

/**
 * Type guard for Comment objects
 */
export function isComment(value: unknown): value is Comment {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'diffId' in value &&
    'author' in value &&
    'content' in value &&
    'status' in value
  );
}

/**
 * Type guard for CommentStatus
 */
export function isCommentStatus(value: unknown): value is CommentStatus {
  return (
    typeof value === 'string' &&
    ['active', 'deleted', 'hidden', 'flagged'].includes(value)
  );
}

/**
 * Type guard for arrays
 */
export function isArray<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(itemGuard);
}

/**
 * Type guard for nullable values
 */
export function isNullable<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T | null {
  return value === null || guard(value);
}

/**
 * Type guard for optional values
 */
export function isOptional<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T | undefined {
  return value === undefined || guard(value);
}

/**
 * Type guard for Record objects
 */
export function isRecord<T>(
  value: unknown,
  valueGuard: (item: unknown) => item is T
): value is Record<string, T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every(valueGuard)
  );
}

/**
 * Type guard for Date objects
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard for valid email strings
 */
export function isEmail(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

/**
 * Type guard for UUID strings
 */
export function isUUID(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value)
  );
}

/**
 * Type guard for URL strings
 */
export function isURL(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a type guard from a Zod schema
 */
export function createGuardFromSchema<T>(
  schema: z.ZodType<T>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    const result = schema.safeParse(value);
    return result.success;
  };
}

/**
 * Assert a value matches a type (throws if not)
 */
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  message?: string
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(message || 'Type assertion failed');
  }
}

/**
 * Narrow an unknown value to a specific type
 */
export function narrow<T>(
  value: unknown,
  guard: (value: unknown) => value is T
): T | undefined {
  return guard(value) ? value : undefined;
}

/**
 * Ensure a value is defined (throws if not)
 */
export function ensureDefined<T>(
  value: T | null | undefined,
  message?: string
): T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value is null or undefined');
  }
  return value;
}