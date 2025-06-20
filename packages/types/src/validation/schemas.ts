import { z } from 'zod';
import { REGEX, FILE_SIZE_LIMITS, SUPPORTED_FILE_TYPES } from '../constants';

/**
 * Common validation schemas
 */
export const IdSchema = z.string().uuid();

export const SlugSchema = z.string()
  .min(1)
  .max(100)
  .regex(REGEX.SLUG, 'Slug must contain only lowercase letters, numbers, and hyphens');

export const EmailSchema = z.string()
  .email('Invalid email address')
  .max(255);

export const UsernameSchema = z.string()
  .regex(REGEX.USERNAME, 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens');

export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const UrlSchema = z.string()
  .url('Invalid URL')
  .regex(REGEX.URL, 'Invalid URL format');

export const HexColorSchema = z.string()
  .regex(REGEX.HEX_COLOR, 'Invalid hex color format');

export const TimezoneSchema = z.string()
  .refine((tz) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'Invalid timezone');

export const LanguageCodeSchema = z.string()
  .length(2, 'Language code must be 2 characters')
  .regex(/^[a-z]{2}$/, 'Invalid language code');

export const FileUploadSchema = z.object({
  filename: z.string().max(255),
  mimeType: z.string(),
  size: z.number()
    .int()
    .positive()
    .max(FILE_SIZE_LIMITS.MAX_FILE_SIZE_ENTERPRISE),
  content: z.union([
    z.instanceof(File),
    z.instanceof(Blob),
    z.string(), // Base64 encoded
  ]),
});

export const TextContentSchema = z.string()
  .max(FILE_SIZE_LIMITS.MAX_TEXT_LENGTH, `Text content must not exceed ${FILE_SIZE_LIMITS.MAX_TEXT_LENGTH} characters`);

export const TagSchema = z.string()
  .min(1)
  .max(50)
  .regex(/^[a-zA-Z0-9-_]+$/, 'Tags must contain only letters, numbers, hyphens, and underscores');

export const TagsArraySchema = z.array(TagSchema).max(20, 'Maximum 20 tags allowed');

/**
 * Date validation schemas
 */
export const FutureDateSchema = z.date().refine(
  (date) => date > new Date(),
  'Date must be in the future'
);

export const PastDateSchema = z.date().refine(
  (date) => date < new Date(),
  'Date must be in the past'
);

export const DateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
}).refine(
  (data) => data.start <= data.end,
  'Start date must be before or equal to end date'
);

/**
 * Pagination validation schemas
 */
export const PageNumberSchema = z.number()
  .int()
  .positive()
  .default(1);

export const PageSizeSchema = z.number()
  .int()
  .min(1)
  .max(100)
  .default(20);

export const CursorSchema = z.string()
  .min(1)
  .refine((cursor) => {
    try {
      Buffer.from(cursor, 'base64');
      return true;
    } catch {
      return false;
    }
  }, 'Invalid cursor format');

/**
 * Search and filter schemas
 */
export const SearchQuerySchema = z.string()
  .min(1)
  .max(200)
  .transform((query) => query.trim());

export const SortFieldSchema = z.string()
  .regex(/^[a-zA-Z][a-zA-Z0-9_.]*$/, 'Invalid sort field');

export const SortOrderSchema = z.enum(['asc', 'desc']).default('desc');

/**
 * File type validation
 */
export const TextFileTypeSchema = z.enum(SUPPORTED_FILE_TYPES.TEXT);

export const CodeFileExtensionSchema = z.enum(SUPPORTED_FILE_TYPES.CODE);

/**
 * Environment variable schemas
 */
export const EnvironmentSchema = z.enum(['development', 'staging', 'production']);

export const DatabaseUrlSchema = z.string()
  .url()
  .refine(
    (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
    'Database URL must be a valid PostgreSQL connection string'
  );

export const RedisUrlSchema = z.string()
  .url()
  .refine(
    (url) => url.startsWith('redis://') || url.startsWith('rediss://'),
    'Redis URL must be a valid Redis connection string'
  );

/**
 * API response schemas
 */
export const SuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.object({
      timestamp: z.string().datetime(),
      version: z.string(),
    }).optional(),
  });

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
  meta: z.object({
    timestamp: z.string().datetime(),
    requestId: z.string().optional(),
  }).optional(),
});

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      pageSize: z.number().int().positive(),
      totalPages: z.number().int().nonnegative(),
      totalItems: z.number().int().nonnegative(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
    }),
    meta: z.object({
      timestamp: z.string().datetime(),
      version: z.string(),
    }).optional(),
  });

/**
 * Webhook schemas
 */
export const WebhookEventSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  timestamp: z.string().datetime(),
  data: z.record(z.any()),
  signature: z.string(),
});

export const WebhookConfigSchema = z.object({
  url: UrlSchema,
  events: z.array(z.string()),
  secret: z.string().min(32),
  active: z.boolean().default(true),
  headers: z.record(z.string()).optional(),
});