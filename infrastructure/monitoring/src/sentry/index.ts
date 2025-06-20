// Sentry monitoring exports
export * from './config'
export * from './client'
export * from './server'

// Re-export commonly used Sentry utilities
export { 
  captureException,
  captureMessage,
  withScope,
  setUser,
  setContext,
  setTag,
  setExtra,
  addBreadcrumb as sentryAddBreadcrumb,
  configureScope,
  getCurrentHub,
  startTransaction as sentryStartTransaction,
  metrics,
} from '@sentry/nextjs'