import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

export interface PerformanceConfig {
  enableWebVitals?: boolean;
  enableCustomMetrics?: boolean;
  enableResourceTiming?: boolean;
  enableNavigationTiming?: boolean;
  reportCallback?: (metric: Metric) => void;
}

export interface CustomMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string | number>;
}

export interface PerformanceReport {
  webVitals: Record<string, number>;
  customMetrics: CustomMetric[];
  resourceTiming: PerformanceResourceTiming[];
  navigationTiming: PerformanceNavigationTiming | null;
  memoryUsage?: MemoryInfo;
}

// Web Vitals tracking
export const initWebVitals = (config: PerformanceConfig): void => {
  if (typeof window === 'undefined' || !config.enableWebVitals) return;

  const reportMetric = (metric: Metric) => {
    // Send metric to analytics
    if (config.reportCallback) {
      config.reportCallback(metric);
    }

    // Send to PostHog or other analytics
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('web_vital', {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_rating: metric.rating,
        metric_delta: metric.delta,
        metric_id: metric.id,
      });
    }
  };

  // Core Web Vitals
  getCLS(reportMetric);
  getFID(reportMetric);
  getFCP(reportMetric);
  getLCP(reportMetric);
  getTTFB(reportMetric);
};

// Custom performance metrics
class PerformanceTracker {
  private metrics: Map<string, CustomMetric> = new Map();
  private timers: Map<string, number> = new Map();

  // Start timing
  startTiming(name: string, tags?: Record<string, string | number>): void {
    this.timers.set(name, performance.now());
    
    // Store tags for later use
    if (tags) {
      const existingMetric = this.metrics.get(name);
      this.metrics.set(name, {
        name,
        value: 0,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { ...existingMetric?.tags, ...tags },
      });
    }
  }

  // End timing and record metric
  endTiming(name: string, tags?: Record<string, string | number>): number {
    const startTime = this.timers.get(name);
    if (startTime === undefined) {
      console.warn(`No start time found for metric: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.recordMetric(name, duration, 'ms', tags);
    return duration;
  }

  // Record a custom metric
  recordMetric(name: string, value: number, unit: string = '', tags?: Record<string, string | number>): void {
    const metric: CustomMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.set(name, metric);

    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('custom_metric', {
        metric_name: name,
        metric_value: value,
        metric_unit: unit,
        ...tags,
      });
    }
  }

  // Get all metrics
  getMetrics(): CustomMetric[] {
    return Array.from(this.metrics.values());
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
    this.timers.clear();
  }
}

export const performanceTracker = new PerformanceTracker();

// Resource timing analysis
export const getResourceTimings = (): PerformanceResourceTiming[] => {
  if (typeof window === 'undefined') return [];
  
  return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
};

export const analyzeResourceTimings = (): {
  totalResources: number;
  totalSize: number;
  slowestResource: PerformanceResourceTiming | null;
  resourcesByType: Record<string, number>;
} => {
  const resources = getResourceTimings();
  
  let totalSize = 0;
  let slowestResource: PerformanceResourceTiming | null = null;
  const resourcesByType: Record<string, number> = {};

  resources.forEach(resource => {
    // Calculate size if available
    if (resource.transferSize) {
      totalSize += resource.transferSize;
    }

    // Find slowest resource
    if (!slowestResource || resource.duration > slowestResource.duration) {
      slowestResource = resource;
    }

    // Count by type
    const type = getResourceType(resource.name);
    resourcesByType[type] = (resourcesByType[type] || 0) + 1;
  });

  return {
    totalResources: resources.length,
    totalSize,
    slowestResource,
    resourcesByType,
  };
};

// Navigation timing
export const getNavigationTiming = (): PerformanceNavigationTiming | null => {
  if (typeof window === 'undefined') return null;
  
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  return navigation || null;
};

export const analyzeNavigationTiming = (): {
  domContentLoaded: number;
  loadComplete: number;
  firstByte: number;
  domInteractive: number;
} | null => {
  const navigation = getNavigationTiming();
  if (!navigation) return null;

  return {
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
    loadComplete: navigation.loadEventEnd - navigation.navigationStart,
    firstByte: navigation.responseStart - navigation.navigationStart,
    domInteractive: navigation.domInteractive - navigation.navigationStart,
  };
};

// Memory usage (Chrome only)
export const getMemoryUsage = (): MemoryInfo | null => {
  if (typeof window === 'undefined') return null;
  
  const memory = (performance as any).memory;
  return memory || null;
};

// Diff-specific performance tracking
export const trackDiffPerformance = {
  startDiffCalculation: (diffId: string) => {
    performanceTracker.startTiming('diff_calculation', { diff_id: diffId });
  },

  endDiffCalculation: (diffId: string) => {
    return performanceTracker.endTiming('diff_calculation', { diff_id: diffId });
  },

  startFileLoad: (fileName: string, fileSize: number) => {
    performanceTracker.startTiming('file_load', { 
      file_name: fileName, 
      file_size: fileSize 
    });
  },

  endFileLoad: (fileName: string, fileSize: number) => {
    return performanceTracker.endTiming('file_load', { 
      file_name: fileName, 
      file_size: fileSize 
    });
  },

  startWasmOperation: (operation: string) => {
    performanceTracker.startTiming('wasm_operation', { operation });
  },

  endWasmOperation: (operation: string) => {
    return performanceTracker.endTiming('wasm_operation', { operation });
  },

  trackRenderTime: (component: string, renderTime: number) => {
    performanceTracker.recordMetric('render_time', renderTime, 'ms', { component });
  },

  trackAPICall: (endpoint: string, duration: number, statusCode: number) => {
    performanceTracker.recordMetric('api_call_duration', duration, 'ms', {
      endpoint,
      status_code: statusCode,
    });
  },
};

// Comprehensive performance report
export const generatePerformanceReport = (): PerformanceReport => {
  return {
    webVitals: getWebVitalsSnapshot(),
    customMetrics: performanceTracker.getMetrics(),
    resourceTiming: getResourceTimings(),
    navigationTiming: getNavigationTiming(),
    memoryUsage: getMemoryUsage(),
  };
};

// Get current Web Vitals snapshot
const getWebVitalsSnapshot = (): Record<string, number> => {
  const vitals: Record<string, number> = {};
  
  // This is a simplified version - in practice, you'd store these values
  // when they're reported by the web-vitals library
  if (typeof window !== 'undefined') {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      vitals.FCP = navigation.domContentLoadedEventEnd - navigation.navigationStart;
      vitals.LCP = navigation.loadEventEnd - navigation.navigationStart;
      vitals.TTFB = navigation.responseStart - navigation.navigationStart;
    }
  }
  
  return vitals;
};

// Utility functions
const getResourceType = (url: string): string => {
  if (url.includes('.js')) return 'script';
  if (url.includes('.css')) return 'stylesheet';
  if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) return 'image';
  if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
  if (url.includes('api/')) return 'api';
  return 'other';
};

// React hooks for performance tracking
export const usePerformanceTracking = () => {
  const startTiming = (name: string, tags?: Record<string, string | number>) => {
    performanceTracker.startTiming(name, tags);
  };

  const endTiming = (name: string, tags?: Record<string, string | number>) => {
    return performanceTracker.endTiming(name, tags);
  };

  const recordMetric = (name: string, value: number, unit?: string, tags?: Record<string, string | number>) => {
    performanceTracker.recordMetric(name, value, unit, tags);
  };

  return {
    startTiming,
    endTiming,
    recordMetric,
    trackDiffPerformance,
    generateReport: generatePerformanceReport,
  };
};

// Performance observer for monitoring
export const initPerformanceObserver = (): void => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;

  // Observe long tasks
  const longTaskObserver = new PerformanceObserver(list => {
    list.getEntries().forEach(entry => {
      performanceTracker.recordMetric('long_task', entry.duration, 'ms', {
        entry_type: entry.entryType,
      });
    });
  });

  try {
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // Long task observer not supported
  }

  // Observe layout shifts
  const layoutShiftObserver = new PerformanceObserver(list => {
    list.getEntries().forEach(entry => {
      if (entry.entryType === 'layout-shift') {
        performanceTracker.recordMetric('layout_shift', (entry as any).value, '', {
          had_recent_input: (entry as any).hadRecentInput,
        });
      }
    });
  });

  try {
    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // Layout shift observer not supported
  }
};