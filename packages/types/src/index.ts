// Core types
export * from './diff';
export * from './collection';
export * from './comment';
export * from './analytics';

// API exports (excluding conflicting schemas)
export {
  // Constants
  ApiStatus,
  // Schemas (renamed to avoid conflicts)
  ApiStatusSchema,
  ApiErrorSchema,
  PaginationParamsSchema,
  PaginationMetaSchema,
  SortParamsSchema,
  FilterParamsSchema,
  ApiResponseSchema,
  PaginatedResponseSchema as ApiPaginatedResponseSchema,
  BatchResultSchema,
  FileUploadResponseSchema,
} from './api';

export type {
  // Types and interfaces
  ApiError,
  PaginationParams,
  PaginationMeta,
  SortParams,
  FilterParams,
  ApiResponse,
  PaginatedResponse,
  BatchResult,
  FileUploadParams,
  FileUploadResponse,
  DiffApiRequests,
  CollectionApiRequests,
  CommentApiRequests,
  DiffApiResponses,
  CollectionApiResponses,
  CommentApiResponses,
} from './api';

// Utils - pagination
export * from './utils/pagination';

// Utils - errors (excluding conflicting schema)
export {
  // Constants
  ErrorCode,
  ErrorSeverity,
  // Classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  PlanLimitError,
  FileError,
  PaymentError,
  // Schemas (renamed to avoid conflicts)
  ErrorCodeSchema,
  ErrorSeveritySchema,
  ValidationErrorDetailSchema,
  ErrorResponseSchema as AppErrorResponseSchema,
  // Utilities
  isAppError,
  isOperationalError,
  formatZodError,
} from './utils/errors';

export type {
  // Interfaces
  ErrorResponse,
  ValidationErrorDetail,
} from './utils/errors';

// Utils - filters (excluding conflicting schema)
export {
  // Constants
  SortOrder,
  FilterOperator,
  // Schemas (renamed to avoid conflicts)
  SortOrderSchema as FilterSortOrderSchema,
  DateRangeFilterSchema,
  NumberRangeFilterSchema,
  TextSearchOptionsSchema,
  SortInputSchema,
  FilterOperatorSchema,
  FilterConditionSchema,
  FilterGroupSchema,
  CommonFiltersSchema,
  DiffFiltersSchema,
  CollectionFiltersSchema,
  UserFiltersSchema,
  // Utilities
  FilterBuilder,
  createDateRangeFilter,
  parseSearchQuery,
} from './utils/filters';

export type {
  // Interfaces
  DateRangeFilter,
  NumberRangeFilter,
  TextSearchOptions,
  SortInput,
  FilterCondition,
  FilterGroup,
  CommonFilters,
  DiffFilters,
  CollectionFilters,
  UserFilters,
} from './utils/filters';

// Utils - types
export * from './utils/types';

// Constants
export * from './constants';

// Validation
export * from './validation';

// Re-export commonly used Zod utilities
export { z } from 'zod';
export type { ZodError, ZodIssue } from 'zod';