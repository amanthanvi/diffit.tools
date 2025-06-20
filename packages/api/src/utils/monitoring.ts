import type { Context } from '../types';

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>();
  
  static start(name: string): void {
    this.timers.set(name, performance.now());
  }
  
  static end(name: string): number {
    const start = this.timers.get(name);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    this.timers.delete(name);
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  static async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      const duration = this.end(name);
      
      // Record metric
      this.recordMetric(name, duration);
      
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }
  
  private static recordMetric(name: string, duration: number): void {
    // In production, send to metrics service (e.g., DataDog, CloudWatch)
    console.debug(`Metric: ${name} = ${duration.toFixed(2)}ms`);
  }
}

/**
 * Request metrics
 */
export interface RequestMetrics {
  path: string;
  method: string;
  duration: number;
  status: 'success' | 'error';
  userId?: string;
  apiKeyId?: string;
  errorCode?: string;
}

/**
 * Collect request metrics
 */
export function collectRequestMetrics(
  ctx: Context,
  path: string,
  duration: number,
  error?: unknown
): RequestMetrics {
  const metrics: RequestMetrics = {
    path,
    method: ctx.req.method,
    duration,
    status: error ? 'error' : 'success',
  };
  
  if (error && error instanceof Error && 'code' in error) {
    metrics.errorCode = (error as any).code;
  }
  
  // Send to metrics service
  sendMetrics(metrics);
  
  return metrics;
}

/**
 * Send metrics to monitoring service
 */
function sendMetrics(metrics: RequestMetrics): void {
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to DataDog, New Relic, etc.
    console.log('Metrics:', metrics);
  }
}

/**
 * Health check data
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    redis: boolean;
    storage: boolean;
  };
  metrics: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: number;
  };
  timestamp: Date;
}

/**
 * Perform health check
 */
export async function performHealthCheck(ctx: Context): Promise<HealthCheckResult> {
  const checks = {
    database: false,
    redis: false,
    storage: false,
  };
  
  // Check database
  try {
    // Simple health check - try to query diffs
    await ctx.db.diff.findPublic(1);
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }
  
  // Check Redis
  try {
    if (ctx.redis) {
      await ctx.redis.set('health:check', 'ok', { ex: 10 });
      checks.redis = true;
    }
  } catch (error) {
    console.error('Redis health check failed:', error);
  }
  
  // Check storage (simplified)
  checks.storage = true; // Assume storage is working
  
  // Determine overall status
  const failedChecks = Object.values(checks).filter(v => !v).length;
  const status = failedChecks === 0 ? 'healthy' : 
                 failedChecks === 1 ? 'degraded' : 'unhealthy';
  
  return {
    status,
    checks,
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage().user / 1000000, // Convert to seconds
    },
    timestamp: new Date(),
  };
}

/**
 * API metrics dashboard data
 */
export interface ApiMetrics {
  requests: {
    total: number;
    success: number;
    errors: number;
    averageDuration: number;
  };
  topEndpoints: Array<{
    path: string;
    count: number;
    averageDuration: number;
  }>;
  errorRate: number;
  activeUsers: number;
  apiKeyUsage: Array<{
    keyId: string;
    requests: number;
    lastUsed: Date;
  }>;
}

/**
 * Get API metrics (mock implementation)
 */
export async function getApiMetrics(): Promise<ApiMetrics> {
  // In production, aggregate from metrics storage
  return {
    requests: {
      total: 10000,
      success: 9500,
      errors: 500,
      averageDuration: 145,
    },
    topEndpoints: [
      { path: 'diff.create', count: 3000, averageDuration: 230 },
      { path: 'diff.get', count: 5000, averageDuration: 85 },
      { path: 'auth.me', count: 2000, averageDuration: 45 },
    ],
    errorRate: 0.05,
    activeUsers: 150,
    apiKeyUsage: [
      { keyId: 'key1', requests: 500, lastUsed: new Date() },
      { keyId: 'key2', requests: 300, lastUsed: new Date() },
    ],
  };
}