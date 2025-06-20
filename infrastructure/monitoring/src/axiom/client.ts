import { Axiom } from '@axiomhq/js'
import type { 
  AxiomConfig, 
  PerformanceMetrics, 
  WebAssemblyMetrics, 
  APIMetrics 
} from '../types'
import { 
  createAxiomConfig, 
  LogLevel, 
  type LogEntry, 
  type PerformanceLog, 
  type ErrorLog 
} from './config'

let axiomClient: Axiom | null = null
let config: AxiomConfig | null = null

// Initialize Axiom client
export function initAxiom(axiomConfig?: Partial<AxiomConfig>) {
  if (typeof window === 'undefined' || axiomClient) return axiomClient

  config = createAxiomConfig(axiomConfig || {})
  
  if (!config.apiToken || !config.dataset) {
    console.log('Axiom initialization skipped - missing configuration')
    return null
  }

  try {
    axiomClient = new Axiom({
      token: config.apiToken,
      orgId: process.env.NEXT_PUBLIC_AXIOM_ORG_ID,
    })
    
    console.log('Axiom client initialized')
    return axiomClient
  } catch (error) {
    console.error('Failed to initialize Axiom:', error)
    return null
  }
}

// Get Axiom instance
export function getAxiom(): Axiom | null {
  return axiomClient || initAxiom()
}

// Generic logging function
export async function logToAxiom(entry: LogEntry) {
  const client = getAxiom()
  if (!client || !config) return

  try {
    await client.ingest(config.dataset, [
      {
        ...entry,
        timestamp: entry.timestamp || new Date().toISOString(),
        service: entry.service || 'diffit-web',
        version: entry.version || process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
        environment: entry.environment || process.env.NEXT_PUBLIC_ENV || 'development',
      }
    ])
  } catch (error) {
    console.error('Failed to log to Axiom:', error)
  }
}

// Structured logging functions
export function logInfo(message: string, metadata?: Record<string, any>) {
  return logToAxiom({
    level: LogLevel.INFO,
    message,
    metadata,
    timestamp: new Date().toISOString(),
    service: 'diffit-web',
  })
}

export function logWarn(message: string, metadata?: Record<string, any>) {
  return logToAxiom({
    level: LogLevel.WARN,
    message,
    metadata,
    timestamp: new Date().toISOString(),
    service: 'diffit-web',
  })
}

export function logError(error: Error | string, context?: Record<string, any>) {
  const errorObj = typeof error === 'string' ? new Error(error) : error
  
  const errorLog: ErrorLog = {
    level: LogLevel.ERROR,
    message: `Error: ${errorObj.message}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-web',
    error: {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack,
    },
    context,
  }
  
  return logToAxiom(errorLog)
}

// Performance logging
export function logPerformance(
  operation: string,
  duration: number,
  success: boolean = true,
  metadata?: Record<string, any>
) {
  const perfLog: PerformanceLog = {
    level: LogLevel.INFO,
    message: `Performance: ${operation} completed in ${duration}ms`,
    timestamp: new Date().toISOString(),
    service: 'diffit-web',
    duration,
    operation,
    success,
    metadata,
  }
  
  return logToAxiom(perfLog)
}

// Web Vitals logging
export function logWebVitals(metrics: PerformanceMetrics) {
  return logToAxiom({
    level: LogLevel.INFO,
    message: 'Web Vitals metrics captured',
    timestamp: new Date().toISOString(),
    service: 'diffit-web',
    metadata: {
      type: 'web_vitals',
      metrics,
    },
  })
}

// WebAssembly performance logging
export function logWasmPerformance(metrics: WebAssemblyMetrics) {
  return logToAxiom({
    level: LogLevel.INFO,
    message: 'WebAssembly performance metrics',
    timestamp: new Date().toISOString(),
    service: 'diffit-web',
    metadata: {
      type: 'wasm_performance',
      ...metrics,
    },
  })
}

// User interaction logging
export function logUserInteraction(
  action: string,
  element: string,
  metadata?: Record<string, any>
) {
  return logToAxiom({
    level: LogLevel.INFO,
    message: `User interaction: ${action} on ${element}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-web',
    metadata: {
      type: 'user_interaction',
      action,
      element,
      ...metadata,
    },
  })
}

// Feature usage logging
export function logFeatureUsage(
  feature: string,
  category: string,
  metadata?: Record<string, any>
) {
  return logToAxiom({
    level: LogLevel.INFO,
    message: `Feature used: ${feature} in ${category}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-web',
    metadata: {
      type: 'feature_usage',
      feature,
      category,
      ...metadata,
    },
  })
}

// API call logging
export function logAPICall(metrics: APIMetrics) {
  return logToAxiom({
    level: metrics.error ? LogLevel.ERROR : LogLevel.INFO,
    message: `API call: ${metrics.method} ${metrics.endpoint} - ${metrics.statusCode}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-web',
    metadata: {
      type: 'api_call',
      ...metrics,
    },
  })
}

// Search and query logging
export function logSearch(
  query: string,
  results: number,
  duration: number,
  metadata?: Record<string, any>
) {
  return logToAxiom({
    level: LogLevel.INFO,
    message: `Search performed: "${query}" returned ${results} results`,
    timestamp: new Date().toISOString(),
    service: 'diffit-web',
    metadata: {
      type: 'search',
      query,
      results,
      duration,
      ...metadata,
    },
  })
}

// Conversion tracking
export function logConversion(
  event: string,
  value?: number,
  currency?: string,
  metadata?: Record<string, any>
) {
  return logToAxiom({
    level: LogLevel.INFO,
    message: `Conversion: ${event}${value ? ` worth ${value} ${currency}` : ''}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-web',
    metadata: {
      type: 'conversion',
      event,
      value,
      currency,
      ...metadata,
    },
  })
}

// Custom metrics
export function logCustomMetric(
  name: string,
  value: number,
  unit?: string,
  tags?: Record<string, string>
) {
  return logToAxiom({
    level: LogLevel.INFO,
    message: `Custom metric: ${name} = ${value}${unit ? ` ${unit}` : ''}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-web',
    metadata: {
      type: 'custom_metric',
      name,
      value,
      unit,
      tags,
    },
  })
}

// Batch logging for performance
export async function logBatch(entries: LogEntry[]) {
  const client = getAxiom()
  if (!client || !config) return

  try {
    const enrichedEntries = entries.map(entry => ({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
      service: entry.service || 'diffit-web',
      version: entry.version || process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      environment: entry.environment || process.env.NEXT_PUBLIC_ENV || 'development',
    }))

    await client.ingest(config.dataset, enrichedEntries)
  } catch (error) {
    console.error('Failed to batch log to Axiom:', error)
  }
}

// Flush pending logs
export async function flushLogs() {
  const client = getAxiom()
  if (!client) return

  try {
    await client.flush()
  } catch (error) {
    console.error('Failed to flush Axiom logs:', error)
  }
}

// React hook for Axiom logging
export function useAxiomLogger() {
  return {
    logInfo,
    logWarn,
    logError,
    logPerformance,
    logWebVitals,
    logUserInteraction,
    logFeatureUsage,
    logAPICall,
    logCustomMetric,
  }
}