import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { track } from '@vercel/analytics'
import { getCLS, getFID, getFCP, getLCP, getTTFB, onINP } from 'web-vitals'
import type { PerformanceMetrics, PerformanceEvent } from '../types'

// Vercel Analytics tracking
export function trackVercelEvent(name: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return
  
  track(name, properties)
}

// Web Vitals tracking with Vercel Analytics
export function trackWebVitals(onMetric?: (metric: PerformanceEvent) => void) {
  if (typeof window === 'undefined') return

  const handleMetric = (metric: any) => {
    const performanceEvent: PerformanceEvent = {
      name: 'performance_metric',
      properties: {
        metric: metric.name as PerformanceEvent['properties']['metric'],
        value: metric.value,
        unit: metric.name === 'CLS' ? 'score' : 'millisecond',
        page: window.location.pathname,
      },
    }

    // Send to callback if provided
    onMetric?.(performanceEvent)

    // Send to Vercel Analytics
    track('Web Vital', {
      metric: metric.name,
      value: metric.value,
      path: window.location.pathname,
    })
  }

  // Track all Core Web Vitals
  getCLS(handleMetric)
  getFID(handleMetric)
  getFCP(handleMetric)
  getLCP(handleMetric)
  getTTFB(handleMetric)
  onINP(handleMetric)
}

// Custom performance observer for diffit.tools
export function observePerformance() {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return

  // Observe paint events
  try {
    const paintObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        track('Paint Metric', {
          name: entry.name,
          startTime: entry.startTime,
          path: window.location.pathname,
        })
      })
    })
    paintObserver.observe({ entryTypes: ['paint'] })
  } catch (error) {
    console.warn('Paint observer not supported:', error)
  }

  // Observe navigation timing
  try {
    const navigationObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        if (entry.entryType === 'navigation') {
          track('Navigation Timing', {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            transferSize: entry.transferSize,
            path: window.location.pathname,
          })
        }
      })
    })
    navigationObserver.observe({ entryTypes: ['navigation'] })
  } catch (error) {
    console.warn('Navigation observer not supported:', error)
  }

  // Observe resource timing
  try {
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: any) => {
        if (entry.duration > 100) { // Only track slow resources
          track('Slow Resource', {
            name: entry.name,
            duration: entry.duration,
            transferSize: entry.transferSize,
            path: window.location.pathname,
          })
        }
      })
    })
    resourceObserver.observe({ entryTypes: ['resource'] })
  } catch (error) {
    console.warn('Resource observer not supported:', error)
  }

  // Observe long tasks
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        track('Long Task', {
          duration: entry.duration,
          startTime: entry.startTime,
          path: window.location.pathname,
        })
      })
    })
    longTaskObserver.observe({ entryTypes: ['longtask'] })
  } catch (error) {
    console.warn('Long task observer not supported:', error)
  }
}

// Track diff-specific events
export function trackDiffPerformance(
  operation: 'create' | 'view' | 'export' | 'share',
  duration: number,
  metadata?: Record<string, any>
) {
  track('Diff Performance', {
    operation,
    duration,
    path: window.location.pathname,
    ...metadata,
  })
}

// Track user engagement
export function trackEngagement(
  event: 'scroll' | 'click' | 'focus' | 'blur' | 'resize',
  metadata?: Record<string, any>
) {
  track('User Engagement', {
    event,
    timestamp: Date.now(),
    path: window.location.pathname,
    ...metadata,
  })
}

// Track feature usage
export function trackFeature(
  feature: string,
  action: string,
  metadata?: Record<string, any>
) {
  track('Feature Usage', {
    feature,
    action,
    path: window.location.pathname,
    ...metadata,
  })
}

// Track errors
export function trackError(
  error: Error | string,
  context?: Record<string, any>
) {
  const errorMessage = typeof error === 'string' ? error : error.message
  
  track('Client Error', {
    error: errorMessage,
    stack: typeof error === 'object' ? error.stack : undefined,
    path: window.location.pathname,
    userAgent: navigator.userAgent,
    ...context,
  })
}

// Track conversions
export function trackConversion(
  event: string,
  value?: number,
  metadata?: Record<string, any>
) {
  track('Conversion', {
    event,
    value,
    path: window.location.pathname,
    ...metadata,
  })
}

// React components for Vercel Analytics
export function VercelAnalytics({ debug = false }: { debug?: boolean }) {
  return <Analytics debug={debug} />
}

export function VercelSpeedInsights({ debug = false }: { debug?: boolean }) {
  return <SpeedInsights debug={debug} />
}

// Hook for Vercel Analytics
export function useVercelAnalytics() {
  return {
    track: trackVercelEvent,
    trackWebVitals,
    trackDiffPerformance,
    trackEngagement,
    trackFeature,
    trackError,
    trackConversion,
  }
}

// Initialize all Vercel monitoring
export function initVercelMonitoring() {
  if (typeof window === 'undefined') return

  // Start Web Vitals tracking
  trackWebVitals()
  
  // Start performance observation
  observePerformance()
  
  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    track('Page Visibility', {
      state: document.visibilityState,
      path: window.location.pathname,
    })
  })
  
  // Track page unload
  window.addEventListener('beforeunload', () => {
    track('Page Unload', {
      path: window.location.pathname,
      duration: Date.now() - performance.timeOrigin,
    })
  })
  
  console.log('Vercel monitoring initialized')
}