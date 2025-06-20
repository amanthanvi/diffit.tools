import type { AxiomConfig } from '../types'

export const defaultAxiomConfig: Partial<AxiomConfig> = {
  url: 'https://cloud.axiom.co',
  flushInterval: 5000, // 5 seconds
  batchSize: 100,
}

export function createAxiomConfig(config: Partial<AxiomConfig>): AxiomConfig {
  return {
    ...defaultAxiomConfig,
    ...config,
    dataset: config.dataset || process.env.AXIOM_DATASET || 'diffit-logs',
    apiToken: config.apiToken || process.env.AXIOM_TOKEN || '',
  } as AxiomConfig
}

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Structured logging interfaces
export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  service: string
  version?: string
  environment?: string
  userId?: string
  sessionId?: string
  requestId?: string
  metadata?: Record<string, any>
  tags?: string[]
}

export interface PerformanceLog extends LogEntry {
  level: LogLevel.INFO
  duration: number
  operation: string
  success: boolean
  errorMessage?: string
  metrics?: Record<string, number>
}

export interface ErrorLog extends LogEntry {
  level: LogLevel.ERROR | LogLevel.FATAL
  error: {
    name: string
    message: string
    stack?: string
    code?: string | number
  }
  context?: Record<string, any>
}

export interface SecurityLog extends LogEntry {
  level: LogLevel.WARN | LogLevel.ERROR
  event: 'auth_failed' | 'rate_limit' | 'suspicious_activity' | 'data_breach'
  ip?: string
  userAgent?: string
  details?: Record<string, any>
}

export interface BusinessLog extends LogEntry {
  level: LogLevel.INFO
  event: 'user_signup' | 'subscription_created' | 'diff_created' | 'export_generated'
  value?: number
  currency?: string
  metadata?: Record<string, any>
}