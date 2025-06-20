export { appRouter } from './router';
export type { AppRouter } from './router';
export { createContext } from './context';
export type { Context } from './types';

// Export utilities for server implementation
export { WebSocketHandler, broadcastToRoom, sendToUser } from './utils/websocket';
export { handleFileUpload, validateFile, getFileUrl } from './utils/upload';
export { queueWebhookEvent } from './routers/webhook';

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
export { createWSHandler } from '@trpc/server/adapters/ws';