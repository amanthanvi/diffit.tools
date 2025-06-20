import { init, configureScope, withScope, captureException, captureMessage, addBreadcrumb } from '@sentry/nextjs';
import { BrowserTracing } from '@sentry/tracing';

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  enableTracing?: boolean;
  enableProfiling?: boolean;
  profilesSampleRate?: number;
  beforeSend?: (event: any) => any;
  beforeSendTransaction?: (event: any) => any;
}

export const initSentry = (config: SentryConfig): void => {
  init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release || process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: config.tracesSampleRate || (config.environment === 'production' ? 0.1 : 1.0),
    profilesSampleRate: config.profilesSampleRate || (config.environment === 'production' ? 0.1 : 1.0),
    
    integrations: [
      new BrowserTracing({
        routingInstrumentation: undefined, // Will be set by Next.js integration
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/diffit\.tools/,
          /^https:\/\/.*\.diffit\.tools/,
          /^https:\/\/.*\.vercel\.app/,
        ],
      }),
    ],

    beforeSend: config.beforeSend || ((event) => {
      // Filter out known non-critical errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.type === 'ChunkLoadError' || 
            error?.type === 'NetworkError' ||
            error?.value?.includes('Loading chunk')) {
          return null;
        }
      }
      return event;
    }),

    beforeSendTransaction: config.beforeSendTransaction || ((event) => {
      // Filter out non-critical transactions
      if (event.transaction === 'GET /health' || 
          event.transaction === 'GET /api/health') {
        return null;
      }
      return event;
    }),

    enabled: config.environment !== 'development',
  });

  // Set global context
  configureScope((scope) => {
    scope.setTag('component', 'diffit-tools');
    scope.setTag('environment', config.environment);
    scope.setContext('runtime', {
      name: 'browser',
      version: typeof window !== 'undefined' ? navigator.userAgent : 'node',
    });
  });
};

export const trackError = (error: Error, context?: Record<string, any>): void => {
  withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    captureException(error);
  });
};

export const trackMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): void => {
  withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    captureMessage(message, level);
  });
};

export const addBreadcrumbEvent = (message: string, category: string, data?: Record<string, any>): void => {
  addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
};

export const setUserContext = (user: { id: string; email?: string; username?: string }): void => {
  configureScope((scope) => {
    scope.setUser(user);
  });
};

export const setFeatureContext = (feature: string, enabled: boolean): void => {
  configureScope((scope) => {
    scope.setTag(`feature.${feature}`, enabled);
  });
};

export const trackDiffEvent = (event: string, diffId: string, metadata?: Record<string, any>): void => {
  addBreadcrumbEvent(`Diff ${event}`, 'diff', {
    diffId,
    ...metadata,
  });
};

export const trackPerformance = (name: string, duration: number, metadata?: Record<string, any>): void => {
  addBreadcrumbEvent(`Performance: ${name}`, 'performance', {
    duration,
    ...metadata,
  });
};

export const trackAPICall = (endpoint: string, method: string, statusCode: number, duration: number): void => {
  addBreadcrumbEvent(`API Call: ${method} ${endpoint}`, 'api', {
    method,
    endpoint,
    statusCode,
    duration,
  });
};

export const trackFileUpload = (fileName: string, fileSize: number, fileType: string, success: boolean): void => {
  addBreadcrumbEvent(`File Upload: ${fileName}`, 'upload', {
    fileName,
    fileSize,
    fileType,
    success,
  });
};

export const trackExport = (format: string, diffId: string, success: boolean): void => {
  addBreadcrumbEvent(`Export: ${format}`, 'export', {
    format,
    diffId,
    success,
  });
};

// Error boundary helpers
export const withErrorBoundary = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<{ error: Error }>,
): React.ComponentType<T> => {
  return (props: T) => {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback;
      if (Fallback && this.state.error) {
        return <Fallback error={this.state.error} />;
      }
      return <div>Something went wrong. Please try refreshing the page.</div>;
    }

    return this.props.children;
  }
}

import React from 'react';