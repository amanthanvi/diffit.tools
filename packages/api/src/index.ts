export { appRouter } from './router';
export type { AppRouter } from './router';
export { createContext } from './context';
export type { Context } from './context';

// Export utilities for server implementation
export { WebSocketManager, broadcastToDiff, getActiveDiffUsers } from './utils/websocket';
export { handleFileUpload, validateFile, getFileUrl } from './utils/upload';
export { triggerWebhookEvent } from './routers/webhook';

// Export types
export type {
  ApiError,
  ApiResponse,
  PaginatedResponse,
  RateLimitConfig,
  FileUploadOptions,
  UploadedFile,
  WebhookConfig,
  WebhookEvent,
  WSMessage,
} from './types';

// Export error utilities
export { errors, formatError, logError, ERROR_CODES } from './utils/errors';

// Export cache utilities
export {
  cacheKeys,
  cacheTTL,
  invalidateDiffCache,
  invalidateCollectionCache,
  invalidateCommentCache,
  BatchCache,
} from './utils/cache';

// Export monitoring utilities
export {
  PerformanceMonitor,
  collectRequestMetrics,
  performHealthCheck,
  getApiMetrics,
} from './utils/monitoring';

// Re-export tRPC utilities for server setup
export { createHTTPHandler } from '@trpc/server/adapters/standalone';
export { applyWSSHandler } from '@trpc/server/adapters/ws';