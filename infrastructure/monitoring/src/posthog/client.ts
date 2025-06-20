import posthog from 'posthog-js'
import type { 
  PostHogConfig, 
  UserContext, 
  TrackingEvent, 
  DiffEvent, 
  FeatureEvent, 
  PageViewEvent,
  PerformanceEvent 
} from '../types'
import { createPostHogConfig, FEATURE_FLAGS, type FeatureFlag } from './config'

let isInitialized = false

// Initialize PostHog client
export function initPostHog(config?: Partial<PostHogConfig>) {
  if (typeof window === 'undefined' || isInitialized) return

  const posthogConfig = createPostHogConfig(config || {})
  
  if (!posthogConfig.apiKey) {
    console.log('PostHog initialization skipped - no API key')
    return
  }

  posthog.init(posthogConfig.apiKey, {
    api_host: posthogConfig.apiHost,
    autocapture: posthogConfig.autocapture,
    capture_pageview: posthogConfig.capturePageview,
    capture_pageleave: posthogConfig.capturePageleave,
    persistence: posthogConfig.persistence,
    cookie_domain: posthogConfig.cookieDomain,
    disable_cookie: posthogConfig.disableCookie,
    
    // Session recording configuration
    session_recording: posthogConfig.sessionRecording,
    
    // Privacy settings
    respect_dnt: true,
    opt_out_capturing_by_default: process.env.NODE_ENV === 'development',
    
    // Performance settings
    batch_requests: true,
    request_batching: true,
    
    // Custom configurations
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug()
      }
    },
    
    // Property sanitization
    sanitize_properties: (properties, event) => {
      // Remove sensitive data
      const sanitized = { ...properties }
      
      // Remove potential PII
      delete sanitized.email
      delete sanitized.phone
      delete sanitized.ssn
      delete sanitized.credit_card
      
      // Sanitize URLs to remove query parameters with sensitive data
      if (sanitized.$current_url) {
        const url = new URL(sanitized.$current_url)
        url.searchParams.delete('token')
        url.searchParams.delete('api_key')
        url.searchParams.delete('password')
        sanitized.$current_url = url.toString()
      }
      
      return sanitized
    },
  })

  isInitialized = true
}

// User identification and context
export function identifyUser(user: UserContext) {
  if (!isInitialized || !user.id) return

  posthog.identify(user.id, {
    email: user.email,
    username: user.username,
    plan: user.plan,
    created_at: user.createdAt?.toISOString(),
    ...user.metadata,
  })
}

export function setUserProperties(properties: Record<string, any>) {
  if (!isInitialized) return
  posthog.setPersonProperties(properties)
}

export function clearUser() {
  if (!isInitialized) return
  posthog.reset()
}

// Event tracking
export function trackEvent(event: TrackingEvent) {
  if (!isInitialized) return

  posthog.capture(event.name, {
    ...event.properties,
    timestamp: event.timestamp || Date.now(),
    session_id: event.sessionId,
    user_id: event.userId,
  })
}

// Specific event trackers
export function trackPageView(event: Omit<PageViewEvent, 'name'>) {
  trackEvent({
    name: 'page_view',
    ...event,
  })
}

export function trackDiffEvent(event: Omit<DiffEvent, 'name'> & { name: DiffEvent['name'] }) {
  trackEvent(event)
}

export function trackFeatureUsage(feature: string, category: string, value?: any) {
  const event: FeatureEvent = {
    name: 'feature_used',
    properties: {
      feature,
      category,
      value,
    },
  }
  trackEvent(event)
}

export function trackPerformance(metric: PerformanceEvent['properties']['metric'], value: number, page?: string) {
  const event: PerformanceEvent = {
    name: 'performance_metric',
    properties: {
      metric,
      value,
      unit: metric === 'CLS' ? 'score' : 'millisecond',
      page,
    },
  }
  trackEvent(event)
}

// Custom events for diffit.tools
export function trackDiffCreated(diffType: 'text' | 'file' | 'pdf', size?: number, algorithm?: string) {
  trackDiffEvent({
    name: 'diff_created',
    properties: {
      diffType,
      size,
      algorithm,
    },
  })
}

export function trackDiffShared(diffId: string, shareMethod: 'link' | 'email') {
  trackDiffEvent({
    name: 'diff_shared',
    properties: {
      diffId,
      diffType: 'unknown', // Will be enriched server-side
      shareMethod,
    },
  })
}

export function trackDiffExported(diffId: string, exportFormat: 'json' | 'html' | 'pdf' | 'markdown') {
  trackDiffEvent({
    name: 'diff_exported',
    properties: {
      diffId,
      diffType: 'unknown', // Will be enriched server-side
      exportFormat,
    },
  })
}

export function trackDiffViewed(diffId: string, viewDuration: number) {
  trackDiffEvent({
    name: 'diff_viewed',
    properties: {
      diffId,
      diffType: 'unknown', // Will be enriched server-side
      viewDuration,
    },
  })
}

// Feature flags
export function getFeatureFlag(flag: FeatureFlag): boolean {
  if (!isInitialized) return false
  return posthog.isFeatureEnabled(flag)
}

export function getAllFeatureFlags(): Record<string, boolean> {
  if (!isInitialized) return {}
  
  const flags: Record<string, boolean> = {}
  Object.values(FEATURE_FLAGS).forEach(flag => {
    flags[flag] = posthog.isFeatureEnabled(flag)
  })
  
  return flags
}

export function onFeatureFlagsLoaded(callback: (flags: Record<string, boolean>) => void) {
  if (!isInitialized) return

  posthog.onFeatureFlags(() => {
    callback(getAllFeatureFlags())
  })
}

// A/B testing
export function getVariant(experimentKey: string): string | null {
  if (!isInitialized) return null
  return posthog.getFeatureFlagPayload(experimentKey) as string || null
}

// Group analytics (for team features)
export function setGroup(groupType: string, groupKey: string, properties?: Record<string, any>) {
  if (!isInitialized) return
  
  posthog.group(groupType, groupKey, properties)
}

// Session data
export function getSessionId(): string | null {
  if (!isInitialized) return null
  return posthog.get_session_id()
}

export function getDistinctId(): string | null {
  if (!isInitialized) return null
  return posthog.get_distinct_id()
}

// Surveys and feedback
export function showSurvey(surveyId: string) {
  if (!isInitialized) return
  posthog.getActiveMatchingSurveys((surveys) => {
    const survey = surveys.find(s => s.id === surveyId)
    if (survey) {
      posthog.renderSurvey(surveyId)
    }
  })
}

// Privacy controls
export function optOut() {
  if (!isInitialized) return
  posthog.opt_out_capturing()
}

export function optIn() {
  if (!isInitialized) return
  posthog.opt_in_capturing()
}

export function hasOptedOut(): boolean {
  if (!isInitialized) return true
  return posthog.has_opted_out_capturing()
}

// GDPR compliance
export function gdprDelete() {
  if (!isInitialized) return
  posthog.capture('$delete_person')
}

// React hooks for PostHog
export function usePostHog() {
  return {
    isInitialized,
    track: trackEvent,
    identify: identifyUser,
    clearUser,
    getFeatureFlag,
    getAllFeatureFlags,
    getVariant,
    optOut,
    optIn,
    hasOptedOut,
  }
}

// Export PostHog instance for advanced usage
export { posthog }