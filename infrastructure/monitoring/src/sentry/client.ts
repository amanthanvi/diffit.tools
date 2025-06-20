import * as Sentry from '@sentry/nextjs'
import type { UserContext, ErrorEvent } from '../types'

// Initialize Sentry for client-side
export function initSentryClient(dsn?: string) {
  if (typeof window === 'undefined') return

  const config = {
    dsn: dsn || process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_ENV || 'development',
    enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_DEV_ENABLED === 'true',
  }

  if (!config.dsn || !config.enabled) {
    console.log('Sentry client initialization skipped')
    return
  }

  Sentry.init(config)
}

// User identification
export function identifyUser(user: UserContext) {
  if (!user.id) return

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    // Custom attributes
    plan: user.plan,
    created_at: user.createdAt?.toISOString(),
    ...user.metadata,
  })
}

// Clear user context
export function clearUser() {
  Sentry.setUser(null)
}

// Add breadcrumb for tracking
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  })
}

// Capture custom errors with context
export function captureError(
  error: Error | string,
  context?: Record<string, any>,
  level: 'fatal' | 'error' | 'warning' | 'info' = 'error'
) {
  const errorObj = typeof error === 'string' ? new Error(error) : error

  Sentry.withScope((scope) => {
    scope.setLevel(level)
    
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value)
      })
    }

    Sentry.captureException(errorObj)
  })

  // Also track as custom event
  const errorEvent: ErrorEvent = {
    name: 'error',
    properties: {
      error: errorObj.message,
      errorType: errorObj.name,
      stackTrace: errorObj.stack,
      context,
    },
  }

  return errorEvent
}

// Capture messages
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, any>
) {
  Sentry.withScope((scope) => {
    scope.setLevel(level)
    
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value)
      })
    }

    Sentry.captureMessage(message, level)
  })
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
    data: {
      source: 'custom',
    },
  })
}

// Create error boundary component
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<any>,
  showDialog?: boolean
) {
  return Sentry.withErrorBoundary(Component, {
    fallback,
    showDialog,
    dialogOptions: {
      title: 'Something went wrong',
      subtitle: 'Our team has been notified and will look into this issue.',
      subtitle2: 'If you\'d like to help, tell us what happened below.',
      labelName: 'Name',
      labelEmail: 'Email',
      labelComments: 'What happened?',
      labelClose: 'Close',
      labelSubmit: 'Submit',
      errorGeneric: 'An unknown error occurred while submitting your report. Please try again.',
      errorFormEntry: 'Some fields were invalid. Please correct the errors and try again.',
      successMessage: 'Your feedback has been sent. Thank you!',
    },
  })
}

// Profile a component
export function withSentryProfiler<P extends object>(
  Component: React.ComponentType<P>,
  name?: string
) {
  return Sentry.withProfiler(Component, { name })
}

// Custom hooks for error handling
export function useSentryError() {
  return {
    captureError,
    captureMessage,
    addBreadcrumb,
  }
}

// Export Sentry instance for advanced usage
export { Sentry }