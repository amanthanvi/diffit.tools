import { Axiom } from '@axiomhq/js'
import type { 
  AxiomConfig, 
  DatabaseMetrics, 
  APIMetrics 
} from '../types'
import { 
  createAxiomConfig, 
  LogLevel, 
  type LogEntry, 
  type PerformanceLog, 
  type ErrorLog,
  type SecurityLog,
  type BusinessLog 
} from './config'

let axiomServer: Axiom | null = null
let serverConfig: AxiomConfig | null = null

// Initialize Axiom server instance
export function initAxiomServer(axiomConfig?: Partial<AxiomConfig>) {
  if (axiomServer) return axiomServer

  serverConfig = createAxiomConfig(axiomConfig || {})
  
  if (!serverConfig.apiToken || !serverConfig.dataset) {
    console.log('Axiom server initialization skipped - missing configuration')
    return null
  }

  try {
    axiomServer = new Axiom({
      token: serverConfig.apiToken,
      orgId: process.env.AXIOM_ORG_ID,
    })
    
    console.log('Axiom server initialized')
    return axiomServer
  } catch (error) {
    console.error('Failed to initialize Axiom server:', error)
    return null
  }
}

// Get Axiom server instance
export function getAxiomServer(): Axiom | null {
  return axiomServer || initAxiomServer()
}

// Server-side logging
export async function logToAxiomServer(entry: LogEntry) {
  const client = getAxiomServer()
  if (!client || !serverConfig) return

  try {
    await client.ingest(serverConfig.dataset, [
      {
        ...entry,
        timestamp: entry.timestamp || new Date().toISOString(),
        service: entry.service || 'diffit-api',
        version: entry.version || process.env.APP_VERSION || 'unknown',
        environment: entry.environment || process.env.NODE_ENV || 'development',
      }
    ])
  } catch (error) {
    console.error('Failed to log to Axiom server:', error)
  }
}

// Structured server logging
export function logServerInfo(message: string, metadata?: Record<string, any>) {
  return logToAxiomServer({
    level: LogLevel.INFO,
    message,
    metadata,
    timestamp: new Date().toISOString(),
    service: 'diffit-api',
  })
}

export function logServerError(error: Error | string, context?: Record<string, any>) {
  const errorObj = typeof error === 'string' ? new Error(error) : error
  
  const errorLog: ErrorLog = {
    level: LogLevel.ERROR,
    message: `Server Error: ${errorObj.message}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-api',
    error: {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack,
    },
    context,
  }
  
  return logToAxiomServer(errorLog)
}

// Database operation logging
export function logDatabaseOperation(metrics: DatabaseMetrics) {
  const perfLog: PerformanceLog = {
    level: LogLevel.INFO,
    message: `Database ${metrics.operation}: ${metrics.query}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-api',
    duration: metrics.duration,
    operation: `db_${metrics.operation}`,
    success: !metrics.error,
    errorMessage: metrics.error,
    metadata: {
      type: 'database_operation',
      table: metrics.table,
      rows: metrics.rows,
    },
  }
  
  return logToAxiomServer(perfLog)
}

// API request/response logging
export function logAPIRequest(
  method: string,
  endpoint: string,
  statusCode: number,
  duration: number,
  userId?: string,
  metadata?: Record<string, any>
) {
  return logToAxiomServer({
    level: statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO,
    message: `API Request: ${method} ${endpoint} - ${statusCode}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-api',
    userId,
    metadata: {
      type: 'api_request',
      method,
      endpoint,
      statusCode,
      duration,
      ...metadata,
    },
  })
}

// Security event logging
export function logSecurityEvent(
  event: SecurityLog['event'],
  ip?: string,
  userAgent?: string,
  details?: Record<string, any>
) {
  const securityLog: SecurityLog = {
    level: event === 'suspicious_activity' || event === 'data_breach' ? LogLevel.ERROR : LogLevel.WARN,
    message: `Security Event: ${event}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-api',
    event,
    ip,
    userAgent,
    details,
  }
  
  return logToAxiomServer(securityLog)
}

// Business event logging
export function logBusinessEvent(
  event: BusinessLog['event'],
  userId?: string,
  value?: number,
  currency?: string,
  metadata?: Record<string, any>
) {
  const businessLog: BusinessLog = {
    level: LogLevel.INFO,
    message: `Business Event: ${event}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-api',
    userId,
    event,
    value,
    currency,
    metadata,
  }
  
  return logToAxiomServer(businessLog)
}

// Background job logging
export function logBackgroundJob(
  jobName: string,
  duration: number,
  success: boolean,
  metadata?: Record<string, any>
) {
  const perfLog: PerformanceLog = {
    level: success ? LogLevel.INFO : LogLevel.ERROR,
    message: `Background Job: ${jobName} ${success ? 'completed' : 'failed'}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-api',
    duration,
    operation: 'background_job',
    success,
    metadata: {
      jobName,
      ...metadata,
    },
  }
  
  return logToAxiomServer(perfLog)
}

// Rate limiting events
export function logRateLimit(
  ip: string,
  endpoint: string,
  limit: number,
  windowMs: number,
  userAgent?: string
) {
  return logSecurityEvent(
    'rate_limit',
    ip,
    userAgent,
    {
      endpoint,
      limit,
      windowMs,
    }
  )
}

// Authentication events
export function logAuthEvent(
  event: 'login' | 'logout' | 'signup' | 'password_reset' | 'failed_login',
  userId?: string,
  ip?: string,
  metadata?: Record<string, any>
) {
  return logToAxiomServer({
    level: event === 'failed_login' ? LogLevel.WARN : LogLevel.INFO,
    message: `Auth Event: ${event}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-api',
    userId,
    metadata: {
      type: 'auth_event',
      event,
      ip,
      ...metadata,
    },
  })
}

// File processing logging
export function logFileProcessing(
  operation: 'upload' | 'process' | 'diff' | 'export',
  fileType: string,
  fileSize: number,
  duration: number,
  success: boolean,
  userId?: string,
  error?: string
) {
  const perfLog: PerformanceLog = {
    level: success ? LogLevel.INFO : LogLevel.ERROR,
    message: `File Processing: ${operation} ${fileType} file (${fileSize} bytes)`,
    timestamp: new Date().toISOString(),
    service: 'diffit-api',
    userId,
    duration,
    operation: `file_${operation}`,
    success,
    errorMessage: error,
    metadata: {
      fileType,
      fileSize,
    },
  }
  
  return logToAxiomServer(perfLog)
}

// Resource usage logging
export function logResourceUsage(
  type: 'memory' | 'cpu' | 'disk',
  value: number,
  unit: string,
  metadata?: Record<string, any>
) {
  return logToAxiomServer({
    level: LogLevel.INFO,
    message: `Resource Usage: ${type} = ${value} ${unit}`,
    timestamp: new Date().toISOString(),
    service: 'diffit-api',
    metadata: {
      type: 'resource_usage',
      resource: type,
      value,
      unit,
      ...metadata,
    },
  })
}

// Middleware for automatic request logging
export function withAxiomLogging<T extends (...args: any[]) => any>(
  handler: T,
  options?: {
    logRequest?: boolean
    logResponse?: boolean
    logPerformance?: boolean
  }
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now()
    const req = args[0] // Assuming first arg is request
    const res = args[1] // Assuming second arg is response

    // Log request
    if (options?.logRequest) {
      await logToAxiomServer({
        level: LogLevel.INFO,
        message: `Incoming request: ${req?.method} ${req?.url}`,
        timestamp: new Date().toISOString(),
        service: 'diffit-api',
        metadata: {
          type: 'incoming_request',
          method: req?.method,
          url: req?.url,
          userAgent: req?.headers?.['user-agent'],
          ip: req?.ip || req?.connection?.remoteAddress,
        },
      })
    }

    try {
      const result = await handler(...args)
      
      // Log successful response
      if (options?.logResponse || options?.logPerformance) {
        const duration = Date.now() - startTime
        await logAPIRequest(
          req?.method || 'unknown',
          req?.url || 'unknown',
          res?.statusCode || 200,
          duration,
          req?.user?.id,
          {
            success: true,
          }
        )
      }

      return result
    } catch (error) {
      // Log error response
      if (options?.logResponse || options?.logPerformance) {
        const duration = Date.now() - startTime
        await logAPIRequest(
          req?.method || 'unknown',
          req?.url || 'unknown',
          res?.statusCode || 500,
          duration,
          req?.user?.id,
          {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        )
      }

      await logServerError(error instanceof Error ? error : new Error(String(error)), {
        method: req?.method,
        url: req?.url,
        userId: req?.user?.id,
      })

      throw error
    }
  }) as T
}

// Batch logging for performance
export async function logServerBatch(entries: LogEntry[]) {
  const client = getAxiomServer()
  if (!client || !serverConfig) return

  try {
    const enrichedEntries = entries.map(entry => ({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
      service: entry.service || 'diffit-api',
      version: entry.version || process.env.APP_VERSION || 'unknown',
      environment: entry.environment || process.env.NODE_ENV || 'development',
    }))

    await client.ingest(serverConfig.dataset, enrichedEntries)
  } catch (error) {
    console.error('Failed to batch log to Axiom server:', error)
  }
}

// Graceful shutdown
export async function shutdownAxiomServer() {
  if (axiomServer) {
    try {
      await axiomServer.flush()
      console.log('Axiom server shutdown complete')
    } catch (error) {
      console.error('Error during Axiom server shutdown:', error)
    }
  }
}