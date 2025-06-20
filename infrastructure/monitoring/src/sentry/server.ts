import * as Sentry from '@sentry/nextjs'
import type { APIMetrics, DatabaseMetrics } from '../types'

// Initialize Sentry for server-side
export function initSentryServer(dsn?: string) {
  const config = {
    dsn: dsn || process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_DEV_ENABLED === 'true',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  }

  if (!config.dsn || !config.enabled) {
    console.log('Sentry server initialization skipped')
    return
  }

  Sentry.init(config)
}

// Middleware for API route error handling
export function withSentry<T extends (...args: any[]) => any>(
  handler: T,
  options?: {
    op?: string
    name?: string
    tags?: Record<string, string>
  }
): T {
  return (async (...args: Parameters<T>) => {
    const transaction = Sentry.startTransaction({
      op: options?.op || 'http.server',
      name: options?.name || 'API Route',
    })

    Sentry.getCurrentHub().configureScope((scope) => {
      scope.setSpan(transaction)
      
      if (options?.tags) {
        Object.entries(options.tags).forEach(([key, value]) => {
          scope.setTag(key, value)
        })
      }
    })

    try {
      const result = await handler(...args)
      transaction.setStatus('ok')
      return result
    } catch (error) {
      transaction.setStatus('internal_error')
      Sentry.captureException(error)
      throw error
    } finally {
      transaction.finish()
    }
  }) as T
}

// Track API performance
export function trackAPIPerformance(metrics: APIMetrics) {
  const transaction = Sentry.getCurrentHub().getScope().getTransaction()
  
  if (transaction) {
    transaction.setMeasurement('http.response_time', metrics.duration, 'millisecond')
    transaction.setMeasurement('http.response_size', metrics.size || 0, 'byte')
    transaction.setTag('http.status_code', metrics.statusCode.toString())
    transaction.setTag('http.method', metrics.method)
    transaction.setTag('http.route', metrics.endpoint)
    
    if (metrics.error) {
      transaction.setStatus('internal_error')
      Sentry.captureException(new Error(metrics.error), {
        contexts: {
          api: metrics,
        },
      })
    }
  }

  // Also send as custom metric
  Sentry.metrics.distribution('api.response_time', metrics.duration, {
    tags: {
      endpoint: metrics.endpoint,
      method: metrics.method,
      status: metrics.statusCode.toString(),
    },
    unit: 'millisecond',
  })
}

// Track database performance
export function trackDatabasePerformance(metrics: DatabaseMetrics) {
  const transaction = Sentry.getCurrentHub().getScope().getTransaction()
  
  if (transaction) {
    const span = transaction.startChild({
      op: `db.${metrics.operation}`,
      description: metrics.query,
    })

    span.setData('db.rows_affected', metrics.rows)
    span.setData('db.table', metrics.table)
    span.finish()
  }

  // Send as custom metric
  Sentry.metrics.distribution('db.query_duration', metrics.duration, {
    tags: {
      operation: metrics.operation,
      table: metrics.table || 'unknown',
      status: metrics.error ? 'error' : 'success',
    },
    unit: 'millisecond',
  })

  if (metrics.error) {
    Sentry.captureException(new Error(metrics.error), {
      contexts: {
        database: metrics,
      },
    })
  }
}

// Cron job monitoring
export function monitorCronJob(
  jobName: string,
  schedule: string,
  fn: () => Promise<void>
) {
  return async () => {
    const checkInId = Sentry.captureCheckIn({
      monitorSlug: jobName,
      status: 'in_progress',
      schedule: {
        type: 'crontab',
        value: schedule,
      },
    })

    try {
      await fn()
      
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: jobName,
        status: 'ok',
      })
    } catch (error) {
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: jobName,
        status: 'error',
      })
      
      Sentry.captureException(error, {
        tags: {
          cron_job: jobName,
        },
      })
      
      throw error
    }
  }
}

// Background job monitoring
export function monitorBackgroundJob<T>(
  jobName: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startTransaction({
    op: 'background_job',
    name: jobName,
  })

  Sentry.getCurrentHub().configureScope((scope) => {
    scope.setSpan(transaction)
  })

  return fn()
    .then((result) => {
      transaction.setStatus('ok')
      return result
    })
    .catch((error) => {
      transaction.setStatus('internal_error')
      Sentry.captureException(error)
      throw error
    })
    .finally(() => {
      transaction.finish()
    })
}

// Custom server-side error handling
export function captureServerError(
  error: Error | string,
  request?: {
    method?: string
    url?: string
    headers?: Record<string, string>
    body?: any
  },
  user?: {
    id?: string
    email?: string
  }
) {
  const errorObj = typeof error === 'string' ? new Error(error) : error

  Sentry.withScope((scope) => {
    if (request) {
      scope.setContext('request', {
        method: request.method,
        url: request.url,
        headers: request.headers,
        // Don't log sensitive data
        body: '[Redacted]',
      })
    }

    if (user) {
      scope.setUser(user)
    }

    Sentry.captureException(errorObj)
  })
}

// Export Sentry for advanced usage
export { Sentry }