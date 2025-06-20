// Core monitoring types

export interface MonitoringConfig {
  environment: 'development' | 'staging' | 'production'
  debug?: boolean
  sentry?: SentryConfig
  posthog?: PostHogConfig
  axiom?: AxiomConfig
  analytics?: AnalyticsConfig
}

export interface SentryConfig {
  dsn: string
  environment: string
  tracesSampleRate: number
  profilesSampleRate?: number
  replaysSessionSampleRate?: number
  replaysOnErrorSampleRate?: number
  integrations?: any[]
  beforeSend?: (event: any, hint: any) => any
  ignoreErrors?: string[]
  allowUrls?: string[]
  denyUrls?: string[]
}

export interface PostHogConfig {
  apiKey: string
  apiHost?: string
  autocapture?: boolean
  capturePageview?: boolean
  capturePageleave?: boolean
  persistence?: 'localStorage' | 'cookie' | 'memory'
  cookieDomain?: string
  disableCookie?: boolean
  sessionRecording?: {
    enabled: boolean
    maskAllInputs?: boolean
    maskAllText?: boolean
    blockClass?: string
    blockSelector?: string
    ignoreClass?: string
    maskTextClass?: string
    maskTextSelector?: string
  }
}

export interface AxiomConfig {
  dataset: string
  apiToken: string
  url?: string
  flushInterval?: number
  batchSize?: number
}

export interface AnalyticsConfig {
  enableWebVitals?: boolean
  enableRUM?: boolean
  enableErrorTracking?: boolean
  enablePerformanceTracking?: boolean
  customMetrics?: CustomMetric[]
}

export interface CustomMetric {
  name: string
  value: number
  unit?: string
  tags?: Record<string, string>
}

// Event tracking types
export interface TrackingEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: number
  userId?: string
  sessionId?: string
}

export interface PageViewEvent extends TrackingEvent {
  name: 'page_view'
  properties: {
    path: string
    title: string
    referrer?: string
    search?: string
    hash?: string
  }
}

export interface DiffEvent extends TrackingEvent {
  name: 'diff_created' | 'diff_shared' | 'diff_exported' | 'diff_viewed'
  properties: {
    diffId?: string
    diffType: 'text' | 'file' | 'pdf'
    size?: number
    algorithm?: string
    exportFormat?: 'json' | 'html' | 'pdf' | 'markdown'
    shareMethod?: 'link' | 'email'
    viewDuration?: number
  }
}

export interface FeatureEvent extends TrackingEvent {
  name: 'feature_used'
  properties: {
    feature: string
    category: string
    value?: any
  }
}

export interface ErrorEvent extends TrackingEvent {
  name: 'error'
  properties: {
    error: string
    errorType: string
    stackTrace?: string
    context?: Record<string, any>
  }
}

export interface PerformanceEvent extends TrackingEvent {
  name: 'performance_metric'
  properties: {
    metric: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP' | 'custom'
    value: number
    unit?: string
    page?: string
  }
}

// Performance monitoring types
export interface PerformanceMetrics {
  FCP?: number // First Contentful Paint
  LCP?: number // Largest Contentful Paint
  FID?: number // First Input Delay
  CLS?: number // Cumulative Layout Shift
  TTFB?: number // Time to First Byte
  INP?: number // Interaction to Next Paint
}

export interface WebAssemblyMetrics {
  initTime: number
  executeTime: number
  memoryUsage: number
  functionCalls: Record<string, number>
}

export interface APIMetrics {
  endpoint: string
  method: string
  duration: number
  statusCode: number
  size?: number
  error?: string
}

export interface DatabaseMetrics {
  query: string
  duration: number
  rows?: number
  operation: 'read' | 'write' | 'delete'
  table?: string
  error?: string
}

// User context types
export interface UserContext {
  id?: string
  email?: string
  username?: string
  plan?: 'free' | 'pro' | 'enterprise'
  createdAt?: Date
  metadata?: Record<string, any>
}

export interface SessionContext {
  id: string
  startTime: Date
  duration?: number
  pageViews?: number
  events?: number
  referrer?: string
  userAgent?: string
  device?: {
    type: 'desktop' | 'mobile' | 'tablet'
    os?: string
    browser?: string
    version?: string
  }
}

// Dashboard and alert types
export interface DashboardConfig {
  id: string
  name: string
  description?: string
  widgets: DashboardWidget[]
  refreshInterval?: number
  filters?: DashboardFilter[]
}

export interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'table' | 'heatmap' | 'log'
  title: string
  query: string
  visualization?: {
    type: 'line' | 'bar' | 'pie' | 'number' | 'table'
    options?: Record<string, any>
  }
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface DashboardFilter {
  field: string
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between'
  value: any
}

export interface AlertConfig {
  id: string
  name: string
  description?: string
  metric: string
  condition: AlertCondition
  threshold: number
  window: string // e.g., '5m', '1h', '1d'
  channels: AlertChannel[]
  enabled: boolean
}

export interface AlertCondition {
  type: 'threshold' | 'anomaly' | 'trend'
  operator: 'gt' | 'lt' | 'equals' | 'change'
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count'
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty'
  config: Record<string, any>
}

// Privacy and compliance types
export interface PrivacyConfig {
  gdprCompliant: boolean
  ccpaCompliant: boolean
  anonymizeIP: boolean
  respectDoNotTrack: boolean
  cookieConsent: boolean
  dataRetention: {
    events: number // days
    sessions: number // days
    errors: number // days
  }
  piiRedaction: {
    enabled: boolean
    patterns: RegExp[]
    fields: string[]
  }
}

// Export all types
export type {
  TrackingEvent,
  PageViewEvent,
  DiffEvent,
  FeatureEvent,
  ErrorEvent,
  PerformanceEvent,
}