import { init, BrowserTracing, Replay, ProfilingIntegration } from '@sentry/nextjs'
import type { SentryConfig } from '../types'

export const defaultSentryConfig: Partial<SentryConfig> = {
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network errors
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    // Common non-critical errors
    'Non-Error promise rejection captured',
    'AbortError',
    // Safari specific
    'Non-Error exception captured',
    'TypeError: Load failed',
  ],
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    // Firefox extensions
    /^moz-extension:\/\//i,
    // Safari extensions
    /^safari-extension:\/\//i,
    // Other browser extensions
    /^resource:\/\//i,
    // Social media embeds
    /graph\.facebook\.com/i,
    /connect\.facebook\.net/i,
    /twitter\.com\/i\/widget/i,
  ],
  allowUrls: [
    /https?:\/\/(www\.)?diffit\.tools/,
    /https?:\/\/(.*\.)?vercel\.app/,
  ],
}

export function createSentryConfig(config: Partial<SentryConfig>): SentryConfig {
  return {
    ...defaultSentryConfig,
    ...config,
    dsn: config.dsn || process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    environment: config.environment || process.env.NEXT_PUBLIC_ENV || 'development',
    integrations: [
      ...(config.integrations || []),
      new BrowserTracing({
        routingInstrumentation: (customStartTransaction, startTransactionOnPageLoad) => {
          // Custom routing instrumentation for Next.js
          if (typeof window !== 'undefined') {
            startTransactionOnPageLoad()
            
            // Listen to route changes
            const originalPushState = history.pushState
            history.pushState = function(...args) {
              originalPushState.apply(history, args)
              customStartTransaction({
                name: window.location.pathname,
                op: 'navigation',
                tags: {
                  'routing.instrumentation': 'next-router',
                },
              })
            }
          }
        },
        tracingOrigins: [
          'localhost',
          'diffit.tools',
          /^\//,
          /^https:\/\/(www\.)?diffit\.tools/,
        ],
      }),
      new Replay({
        maskAllText: false,
        maskAllInputs: true,
        blockAllMedia: false,
        maskTextSelector: '[data-sensitive]',
        blockSelector: '[data-block-replay]',
        ignoreSelector: '[data-ignore-replay]',
        maskTextClass: 'sensitive-data',
        networkDetailAllowUrls: [
          'https://diffit.tools',
          'https://api.diffit.tools',
        ],
        networkCaptureBodies: true,
        networkRequestHeaders: ['X-Request-ID'],
        networkResponseHeaders: ['X-Response-Time'],
      }),
      new ProfilingIntegration(),
    ],
    beforeSend: (event, hint) => {
      // Custom error filtering and enrichment
      if (config.beforeSend) {
        event = config.beforeSend(event, hint)
      }

      // Skip events in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEV_ENABLED) {
        return null
      }

      // Add custom context
      if (event.exception) {
        event.contexts = {
          ...event.contexts,
          app: {
            version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
            build: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
          },
        }
      }

      // Redact sensitive data
      if (event.request?.cookies) {
        event.request.cookies = '[Redacted]'
      }

      return event
    },
  } as SentryConfig
}