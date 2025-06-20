import { PostHog } from 'posthog-node'
import type { 
  PostHogConfig, 
  UserContext, 
  TrackingEvent, 
  DiffEvent, 
  FeatureEvent,
  PerformanceEvent 
} from '../types'

let posthogServer: PostHog | null = null

// Initialize PostHog server instance
export function initPostHogServer(config?: Partial<PostHogConfig>) {
  if (posthogServer) return posthogServer

  const apiKey = config?.apiKey || process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY
  const apiHost = config?.apiHost || process.env.POSTHOG_HOST || 'https://app.posthog.com'

  if (!apiKey) {
    console.log('PostHog server initialization skipped - no API key')
    return null
  }

  posthogServer = new PostHog(apiKey, {
    host: apiHost,
    flushAt: 20,
    flushInterval: 10000,
    requestTimeout: 10000,
    maxRetries: 3,
    disableGeoip: false,
    captureMode: 'json',
  })

  return posthogServer
}

// Get PostHog instance
export function getPostHogServer(): PostHog | null {
  return posthogServer || initPostHogServer()
}

// Server-side event tracking
export function trackServerEvent(event: TrackingEvent) {
  const posthog = getPostHogServer()
  if (!posthog) return

  posthog.capture({
    distinctId: event.userId || 'anonymous',
    event: event.name,
    properties: {
      ...event.properties,
      timestamp: event.timestamp || Date.now(),
      session_id: event.sessionId,
      $ip: null, // Respect privacy
    },
  })
}

// Identify user server-side
export function identifyServerUser(userId: string, user: UserContext) {
  const posthog = getPostHogServer()
  if (!posthog) return

  posthog.identify({
    distinctId: userId,
    properties: {
      email: user.email,
      username: user.username,
      plan: user.plan,
      created_at: user.createdAt?.toISOString(),
      ...user.metadata,
    },
  })
}

// Server-side feature flags
export async function getServerFeatureFlag(
  flag: string, 
  userId: string, 
  userProperties?: Record<string, any>
): Promise<boolean> {
  const posthog = getPostHogServer()
  if (!posthog) return false

  try {
    const result = await posthog.isFeatureEnabled(flag, userId, {
      personProperties: userProperties,
    })
    return result || false
  } catch (error) {
    console.error('Error getting feature flag:', error)
    return false
  }
}

export async function getAllServerFeatureFlags(
  userId: string, 
  userProperties?: Record<string, any>
): Promise<Record<string, boolean>> {
  const posthog = getPostHogServer()
  if (!posthog) return {}

  try {
    const result = await posthog.getAllFlags(userId, {
      personProperties: userProperties,
    })
    return result || {}
  } catch (error) {
    console.error('Error getting all feature flags:', error)
    return {}
  }
}

// Server-side A/B testing
export async function getServerVariant(
  experimentKey: string,
  userId: string,
  userProperties?: Record<string, any>
): Promise<string | null> {
  const posthog = getPostHogServer()
  if (!posthog) return null

  try {
    const result = await posthog.getFeatureFlagPayload(experimentKey, userId, {
      personProperties: userProperties,
    })
    return result as string || null
  } catch (error) {
    console.error('Error getting variant:', error)
    return null
  }
}

// Enhanced event tracking for server-side analytics
export function trackServerDiffEvent(
  event: Omit<DiffEvent, 'name'> & { name: DiffEvent['name'] },
  userId?: string
) {
  trackServerEvent({
    ...event,
    userId: userId || 'anonymous',
  })
}

export function trackServerPerformance(
  metric: PerformanceEvent['properties']['metric'],
  value: number,
  userId?: string,
  context?: Record<string, any>
) {
  const event: PerformanceEvent = {
    name: 'performance_metric',
    properties: {
      metric,
      value,
      unit: metric === 'CLS' ? 'score' : 'millisecond',
      ...context,
    },
    userId: userId || 'anonymous',
  }
  trackServerEvent(event)
}

// API analytics
export function trackAPIUsage(
  endpoint: string,
  method: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  trackServerEvent({
    name: 'api_used',
    properties: {
      endpoint,
      method,
      ...metadata,
    },
    userId: userId || 'anonymous',
  })
}

// Business metrics
export function trackSubscription(
  userId: string,
  plan: string,
  action: 'created' | 'updated' | 'cancelled',
  metadata?: Record<string, any>
) {
  trackServerEvent({
    name: 'subscription_event',
    properties: {
      plan,
      action,
      ...metadata,
    },
    userId,
  })
}

export function trackRevenue(
  userId: string,
  revenue: number,
  currency: string = 'USD',
  metadata?: Record<string, any>
) {
  trackServerEvent({
    name: 'revenue',
    properties: {
      revenue,
      currency,
      ...metadata,
    },
    userId,
  })
}

// Group analytics for teams
export function setServerGroup(
  userId: string,
  groupType: string,
  groupKey: string,
  properties?: Record<string, any>
) {
  const posthog = getPostHogServer()
  if (!posthog) return

  posthog.groupIdentify({
    distinctId: userId,
    groupType,
    groupKey,
    properties,
  })
}

// Batch operations for performance
export function batchTrackEvents(events: TrackingEvent[]) {
  const posthog = getPostHogServer()
  if (!posthog) return

  const batch = events.map(event => ({
    distinctId: event.userId || 'anonymous',
    event: event.name,
    properties: {
      ...event.properties,
      timestamp: event.timestamp || Date.now(),
      session_id: event.sessionId,
    },
  }))

  posthog.captureMultiple(batch)
}

// Graceful shutdown
export async function shutdownPostHogServer() {
  if (posthogServer) {
    await posthogServer.shutdown()
    posthogServer = null
  }
}

// Middleware for Next.js API routes
export function withPostHogTracking<T extends (...args: any[]) => any>(
  handler: T,
  options?: {
    trackRequest?: boolean
    trackResponse?: boolean
    trackPerformance?: boolean
    userId?: string
  }
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now()
    const req = args[0] // Assuming first arg is request
    const userId = options?.userId || req?.user?.id

    // Track request
    if (options?.trackRequest) {
      trackServerEvent({
        name: 'api_request',
        properties: {
          method: req?.method,
          url: req?.url,
          userAgent: req?.headers?.['user-agent'],
        },
        userId,
      })
    }

    try {
      const result = await handler(...args)
      
      // Track successful response
      if (options?.trackResponse) {
        trackServerEvent({
          name: 'api_response',
          properties: {
            status: 'success',
            method: req?.method,
            url: req?.url,
            duration: Date.now() - startTime,
          },
          userId,
        })
      }

      return result
    } catch (error) {
      // Track error response
      if (options?.trackResponse) {
        trackServerEvent({
          name: 'api_response',
          properties: {
            status: 'error',
            method: req?.method,
            url: req?.url,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          userId,
        })
      }

      throw error
    }
  }) as T
}

// Export PostHog server instance
export { posthogServer }