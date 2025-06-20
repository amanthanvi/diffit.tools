// Main exports for the monitoring package
export * from './sentry';
export * from './analytics';
export * from './performance';

// Re-export key types
export type {
  SentryConfig,
  AnalyticsConfig,
  UserProperties,
  EventProperties,
  PerformanceConfig,
  CustomMetric,
  PerformanceReport,
} from './sentry';

// Unified initialization function
export interface MonitoringConfig {
  sentry?: {
    dsn: string;
    environment: string;
    release?: string;
    tracesSampleRate?: number;
    enableTracing?: boolean;
    enableProfiling?: boolean;
  };
  analytics?: {
    posthogKey: string;
    environment: string;
    apiHost?: string;
    enableSessionRecording?: boolean;
    capturePageviews?: boolean;
  };
  performance?: {
    enableWebVitals?: boolean;
    enableCustomMetrics?: boolean;
    enableResourceTiming?: boolean;
    enableNavigationTiming?: boolean;
  };
}

export const initMonitoring = (config: MonitoringConfig): void => {
  // Initialize Sentry
  if (config.sentry) {
    const { initSentry } = require('./sentry');
    initSentry(config.sentry);
  }

  // Initialize Analytics
  if (config.analytics) {
    const { initClientAnalytics } = require('./analytics');
    initClientAnalytics(config.analytics);
  }

  // Initialize Performance Tracking
  if (config.performance) {
    const { initWebVitals, initPerformanceObserver } = require('./performance');
    initWebVitals(config.performance);
    initPerformanceObserver();
  }
};

// Environment-specific configurations
export const getMonitoringConfig = (environment: string): MonitoringConfig => {
  const isProd = environment === 'production';
  const isDev = environment === 'development';

  return {
    sentry: {
      dsn: process.env.SENTRY_DSN || '',
      environment,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      tracesSampleRate: isProd ? 0.1 : 1.0,
      enableTracing: true,
      enableProfiling: isProd,
    },
    analytics: {
      posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
      environment,
      apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      enableSessionRecording: isProd,
      capturePageviews: true,
    },
    performance: {
      enableWebVitals: true,
      enableCustomMetrics: true,
      enableResourceTiming: !isDev,
      enableNavigationTiming: !isDev,
    },
  };
};

// Health check utilities
export const getHealthStatus = (): {
  sentry: boolean;
  analytics: boolean;
  performance: boolean;
} => {
  return {
    sentry: !!process.env.SENTRY_DSN,
    analytics: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
    performance: typeof window !== 'undefined' && 'performance' in window,
  };
};

// Cleanup function
export const cleanupMonitoring = (): void => {
  const { shutdownAnalytics } = require('./analytics');
  shutdownAnalytics();
};

// Default export with all utilities
export default {
  initMonitoring,
  getMonitoringConfig,
  getHealthStatus,
  cleanupMonitoring,
};