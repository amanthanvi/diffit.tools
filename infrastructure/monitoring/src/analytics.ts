import posthog from 'posthog-js';
import { PostHog } from 'posthog-node';

export interface AnalyticsConfig {
  posthogKey: string;
  environment: string;
  apiHost?: string;
  enableSessionRecording?: boolean;
  capturePageviews?: boolean;
  enableHeatmaps?: boolean;
}

export interface UserProperties {
  id: string;
  email?: string;
  name?: string;
  plan?: string;
  createdAt?: Date;
  lastActiveAt?: Date;
  [key: string]: any;
}

export interface EventProperties {
  [key: string]: any;
}

// Client-side analytics
export const initClientAnalytics = (config: AnalyticsConfig): void => {
  if (typeof window === 'undefined') return;

  posthog.init(config.posthogKey, {
    api_host: config.apiHost || 'https://app.posthog.com',
    autocapture: true,
    capture_pageviews: config.capturePageviews !== false,
    disable_session_recording: !config.enableSessionRecording,
    enable_recording_console_log: config.environment !== 'production',
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: { password: true },
    },
    bootstrap: {
      distinctID: undefined, // Will be set after user identification
    },
    opt_out_capturing_by_default: config.environment === 'development',
  });

  // Set environment context
  posthog.register({
    environment: config.environment,
    version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
  });
};

// Server-side analytics
let serverPostHog: PostHog | null = null;

export const initServerAnalytics = (config: AnalyticsConfig): PostHog => {
  if (!serverPostHog) {
    serverPostHog = new PostHog(config.posthogKey, {
      host: config.apiHost || 'https://app.posthog.com',
    });
  }
  return serverPostHog;
};

export const getServerAnalytics = (): PostHog | null => serverPostHog;

// User identification
export const identifyUser = (user: UserProperties): void => {
  if (typeof window === 'undefined') return;
  
  posthog.identify(user.id, {
    email: user.email,
    name: user.name,
    plan: user.plan,
    $created_at: user.createdAt,
    $last_active_at: user.lastActiveAt,
    ...user,
  });
};

export const identifyUserServer = (user: UserProperties): void => {
  if (!serverPostHog) return;
  
  serverPostHog.identify({
    distinctId: user.id,
    properties: {
      email: user.email,
      name: user.name,
      plan: user.plan,
      $created_at: user.createdAt,
      $last_active_at: user.lastActiveAt,
      ...user,
    },
  });
};

// Event tracking
export const trackEvent = (event: string, properties?: EventProperties): void => {
  if (typeof window === 'undefined') return;
  posthog.capture(event, properties);
};

export const trackEventServer = (userId: string, event: string, properties?: EventProperties): void => {
  if (!serverPostHog) return;
  serverPostHog.capture({
    distinctId: userId,
    event,
    properties,
  });
};

// Page tracking
export const trackPageView = (path: string, properties?: EventProperties): void => {
  if (typeof window === 'undefined') return;
  posthog.capture('$pageview', {
    $current_url: window.location.href,
    $pathname: path,
    ...properties,
  });
};

// Feature flag utilities
export const getFeatureFlag = (flag: string, defaultValue: boolean = false): boolean => {
  if (typeof window === 'undefined') return defaultValue;
  return posthog.isFeatureEnabled(flag) ?? defaultValue;
};

export const getFeatureFlagServer = async (userId: string, flag: string, defaultValue: boolean = false): Promise<boolean> => {
  if (!serverPostHog) return defaultValue;
  return (await serverPostHog.isFeatureEnabled(flag, userId)) ?? defaultValue;
};

// A/B testing
export const getVariant = (experiment: string, defaultVariant: string = 'control'): string => {
  if (typeof window === 'undefined') return defaultVariant;
  return posthog.getFeatureFlag(experiment) as string || defaultVariant;
};

// Specific tracking functions for diffit.tools
export const trackDiffCreated = (diffId: string, type: string, fileSize?: number): void => {
  trackEvent('diff_created', {
    diff_id: diffId,
    diff_type: type,
    file_size: fileSize,
  });
};

export const trackDiffViewed = (diffId: string, viewMode: string): void => {
  trackEvent('diff_viewed', {
    diff_id: diffId,
    view_mode: viewMode,
  });
};

export const trackDiffShared = (diffId: string, shareMethod: string): void => {
  trackEvent('diff_shared', {
    diff_id: diffId,
    share_method: shareMethod,
  });
};

export const trackDiffExported = (diffId: string, format: string): void => {
  trackEvent('diff_exported', {
    diff_id: diffId,
    export_format: format,
  });
};

export const trackFileUploaded = (fileName: string, fileSize: number, fileType: string): void => {
  trackEvent('file_uploaded', {
    file_name: fileName,
    file_size: fileSize,
    file_type: fileType,
  });
};

export const trackCollectionCreated = (collectionId: string): void => {
  trackEvent('collection_created', {
    collection_id: collectionId,
  });
};

export const trackCommentAdded = (diffId: string, commentId: string): void => {
  trackEvent('comment_added', {
    diff_id: diffId,
    comment_id: commentId,
  });
};

export const trackSearchPerformed = (query: string, resultsCount: number): void => {
  trackEvent('search_performed', {
    search_query: query,
    results_count: resultsCount,
  });
};

export const trackThemeChanged = (theme: string): void => {
  trackEvent('theme_changed', {
    theme,
  });
};

export const trackCommandPaletteUsed = (command: string): void => {
  trackEvent('command_palette_used', {
    command,
  });
};

export const trackAPIKeyGenerated = (): void => {
  trackEvent('api_key_generated');
};

export const trackAPICall = (endpoint: string, method: string, statusCode: number): void => {
  trackEvent('api_call', {
    endpoint,
    method,
    status_code: statusCode,
  });
};

// Error tracking
export const trackError = (error: string, context?: EventProperties): void => {
  trackEvent('error_occurred', {
    error_message: error,
    ...context,
  });
};

// Performance tracking
export const trackPerformance = (metric: string, value: number, context?: EventProperties): void => {
  trackEvent('performance_metric', {
    metric_name: metric,
    metric_value: value,
    ...context,
  });
};

// User actions
export const trackUserAction = (action: string, context?: EventProperties): void => {
  trackEvent('user_action', {
    action,
    ...context,
  });
};

// Session management
export const startSession = (): void => {
  trackEvent('session_started');
};

export const endSession = (): void => {
  trackEvent('session_ended');
};

// Cleanup
export const shutdownAnalytics = (): void => {
  if (serverPostHog) {
    serverPostHog.shutdown();
  }
};

// React hooks for analytics
export const useAnalytics = () => {
  const track = trackEvent;
  const identify = identifyUser;
  const getFlag = getFeatureFlag;
  
  return {
    track,
    identify,
    getFlag,
    trackDiffCreated,
    trackDiffViewed,
    trackDiffShared,
    trackDiffExported,
    trackFileUploaded,
    trackCollectionCreated,
    trackCommentAdded,
    trackSearchPerformed,
    trackThemeChanged,
    trackCommandPaletteUsed,
    trackAPIKeyGenerated,
    trackUserAction,
    trackError,
    trackPerformance,
  };
};