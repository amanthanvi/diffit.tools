import { z } from 'zod';

/**
 * Analytics event types
 */
export const AnalyticsEvent = {
  // Page views
  PAGE_VIEW: 'page_view',
  
  // Diff events
  DIFF_CREATED: 'diff_created',
  DIFF_VIEWED: 'diff_viewed',
  DIFF_FORKED: 'diff_forked',
  DIFF_EXPORTED: 'diff_exported',
  DIFF_DELETED: 'diff_deleted',
  
  // Collection events
  COLLECTION_CREATED: 'collection_created',
  COLLECTION_VIEWED: 'collection_viewed',
  COLLECTION_UPDATED: 'collection_updated',
  COLLECTION_DELETED: 'collection_deleted',
  
  // Comment events
  COMMENT_CREATED: 'comment_created',
  COMMENT_REPLIED: 'comment_replied',
  COMMENT_REACTED: 'comment_reacted',
  
  // User events
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_UPGRADED: 'user_upgraded',
  USER_DOWNGRADED: 'user_downgraded',
  
  // Feature usage
  FEATURE_USED: 'feature_used',
  API_CALLED: 'api_called',
  
  // Error events
  ERROR_OCCURRED: 'error_occurred',
} as const;

export type AnalyticsEvent = typeof AnalyticsEvent[keyof typeof AnalyticsEvent];

/**
 * Time periods for analytics
 */
export const TimePeriod = {
  HOUR: 'hour',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  ALL_TIME: 'all_time',
} as const;

export type TimePeriod = typeof TimePeriod[keyof typeof TimePeriod];

/**
 * Analytics dimensions
 */
export const AnalyticsDimension = {
  COUNTRY: 'country',
  DEVICE: 'device',
  BROWSER: 'browser',
  OS: 'os',
  REFERRER: 'referrer',
  UTM_SOURCE: 'utm_source',
  UTM_MEDIUM: 'utm_medium',
  UTM_CAMPAIGN: 'utm_campaign',
  LANGUAGE: 'language',
  PLAN: 'plan',
} as const;

export type AnalyticsDimension = typeof AnalyticsDimension[keyof typeof AnalyticsDimension];

/**
 * Base analytics event
 */
export interface BaseAnalyticsEvent {
  event: AnalyticsEvent;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  
  properties?: Record<string, any>;
  
  context: {
    ip?: string;
    userAgent?: string;
    url?: string;
    referrer?: string;
    
    // Device info
    device?: {
      type: 'desktop' | 'mobile' | 'tablet';
      os: string;
      browser: string;
      viewport: {
        width: number;
        height: number;
      };
    };
    
    // Location info
    location?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
    
    // UTM parameters
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    };
  };
}

/**
 * Page view event
 */
export interface PageViewEvent extends BaseAnalyticsEvent {
  event: typeof AnalyticsEvent.PAGE_VIEW;
  properties: {
    path: string;
    title: string;
    duration?: number;
  };
}

/**
 * Diff event
 */
export interface DiffEvent extends BaseAnalyticsEvent {
  event: 
    | typeof AnalyticsEvent.DIFF_CREATED
    | typeof AnalyticsEvent.DIFF_VIEWED
    | typeof AnalyticsEvent.DIFF_FORKED
    | typeof AnalyticsEvent.DIFF_EXPORTED
    | typeof AnalyticsEvent.DIFF_DELETED;
  properties: {
    diffId: string;
    contentType?: string;
    visibility?: string;
    fileSize?: number;
    linesAdded?: number;
    linesRemoved?: number;
  };
}

/**
 * Feature usage event
 */
export interface FeatureUsageEvent extends BaseAnalyticsEvent {
  event: typeof AnalyticsEvent.FEATURE_USED;
  properties: {
    feature: string;
    action?: string;
    value?: any;
  };
}

/**
 * Analytics metric
 */
export interface AnalyticsMetric {
  name: string;
  value: number;
  period: TimePeriod;
  dimensions?: Record<AnalyticsDimension, string>;
  timestamp: Date;
}

/**
 * Analytics aggregate
 */
export interface AnalyticsAggregate {
  metric: string;
  period: TimePeriod;
  startDate: Date;
  endDate: Date;
  
  totals: {
    count: number;
    sum?: number;
    average?: number;
    min?: number;
    max?: number;
  };
  
  timeSeries: Array<{
    timestamp: Date;
    value: number;
  }>;
  
  breakdown?: Array<{
    dimension: AnalyticsDimension;
    value: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * User analytics summary
 */
export interface UserAnalytics {
  userId: string;
  period: TimePeriod;
  
  overview: {
    diffsCreated: number;
    diffsViewed: number;
    collectionsCreated: number;
    commentsCreated: number;
    apiCalls: number;
    storageUsed: number;
    bandwidthUsed: number;
  };
  
  topDiffs: Array<{
    id: string;
    title?: string;
    views: number;
    forks: number;
  }>;
  
  topCollections: Array<{
    id: string;
    title: string;
    views: number;
  }>;
  
  activity: Array<{
    date: Date;
    events: number;
    diffs: number;
    comments: number;
  }>;
}

// Zod schemas
export const AnalyticsEventSchema = z.enum([
  AnalyticsEvent.PAGE_VIEW,
  AnalyticsEvent.DIFF_CREATED,
  AnalyticsEvent.DIFF_VIEWED,
  AnalyticsEvent.DIFF_FORKED,
  AnalyticsEvent.DIFF_EXPORTED,
  AnalyticsEvent.DIFF_DELETED,
  AnalyticsEvent.COLLECTION_CREATED,
  AnalyticsEvent.COLLECTION_VIEWED,
  AnalyticsEvent.COLLECTION_UPDATED,
  AnalyticsEvent.COLLECTION_DELETED,
  AnalyticsEvent.COMMENT_CREATED,
  AnalyticsEvent.COMMENT_REPLIED,
  AnalyticsEvent.COMMENT_REACTED,
  AnalyticsEvent.USER_SIGNUP,
  AnalyticsEvent.USER_LOGIN,
  AnalyticsEvent.USER_LOGOUT,
  AnalyticsEvent.USER_UPGRADED,
  AnalyticsEvent.USER_DOWNGRADED,
  AnalyticsEvent.FEATURE_USED,
  AnalyticsEvent.API_CALLED,
  AnalyticsEvent.ERROR_OCCURRED,
]);

export const TimePeriodSchema = z.enum([
  TimePeriod.HOUR,
  TimePeriod.DAY,
  TimePeriod.WEEK,
  TimePeriod.MONTH,
  TimePeriod.QUARTER,
  TimePeriod.YEAR,
  TimePeriod.ALL_TIME,
]);

export const AnalyticsDimensionSchema = z.enum([
  AnalyticsDimension.COUNTRY,
  AnalyticsDimension.DEVICE,
  AnalyticsDimension.BROWSER,
  AnalyticsDimension.OS,
  AnalyticsDimension.REFERRER,
  AnalyticsDimension.UTM_SOURCE,
  AnalyticsDimension.UTM_MEDIUM,
  AnalyticsDimension.UTM_CAMPAIGN,
  AnalyticsDimension.LANGUAGE,
  AnalyticsDimension.PLAN,
]);

export const BaseAnalyticsEventSchema = z.object({
  event: AnalyticsEventSchema,
  userId: z.string().optional(),
  sessionId: z.string(),
  timestamp: z.date(),
  
  properties: z.record(z.any()).optional(),
  
  context: z.object({
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    url: z.string().url().optional(),
    referrer: z.string().optional(),
    
    device: z.object({
      type: z.enum(['desktop', 'mobile', 'tablet']),
      os: z.string(),
      browser: z.string(),
      viewport: z.object({
        width: z.number(),
        height: z.number(),
      }),
    }).optional(),
    
    location: z.object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
      timezone: z.string().optional(),
    }).optional(),
    
    utm: z.object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional(),
    }).optional(),
  }),
});

export const AnalyticsMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  period: TimePeriodSchema,
  dimensions: z.record(AnalyticsDimensionSchema, z.string()).optional(),
  timestamp: z.date(),
});

export const AnalyticsAggregateSchema = z.object({
  metric: z.string(),
  period: TimePeriodSchema,
  startDate: z.date(),
  endDate: z.date(),
  
  totals: z.object({
    count: z.number(),
    sum: z.number().optional(),
    average: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }),
  
  timeSeries: z.array(z.object({
    timestamp: z.date(),
    value: z.number(),
  })),
  
  breakdown: z.array(z.object({
    dimension: AnalyticsDimensionSchema,
    value: z.string(),
    count: z.number(),
    percentage: z.number(),
  })).optional(),
});