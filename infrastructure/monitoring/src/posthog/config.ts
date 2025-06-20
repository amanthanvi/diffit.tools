import type { PostHogConfig } from '../types'

export const defaultPostHogConfig: Partial<PostHogConfig> = {
  apiHost: 'https://app.posthog.com',
  autocapture: true,
  capturePageview: true,
  capturePageleave: true,
  persistence: 'localStorage',
  disableCookie: false,
  sessionRecording: {
    enabled: process.env.NODE_ENV === 'production',
    maskAllInputs: true,
    maskAllText: false,
    blockClass: 'ph-no-capture',
    blockSelector: '[data-ph-no-capture]',
    ignoreClass: 'ph-ignore',
    maskTextClass: 'ph-mask',
    maskTextSelector: '[data-ph-mask]',
  },
}

export function createPostHogConfig(config: Partial<PostHogConfig>): PostHogConfig {
  return {
    ...defaultPostHogConfig,
    ...config,
    apiKey: config.apiKey || process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
    apiHost: config.apiHost || process.env.NEXT_PUBLIC_POSTHOG_HOST || defaultPostHogConfig.apiHost!,
    cookieDomain: config.cookieDomain || process.env.NEXT_PUBLIC_DOMAIN || undefined,
  } as PostHogConfig
}

// PostHog feature flags
export const FEATURE_FLAGS = {
  // UI/UX Features
  NEW_DIFF_VIEWER: 'new-diff-viewer',
  DARK_MODE_TOGGLE: 'dark-mode-toggle',
  ADVANCED_SETTINGS: 'advanced-settings',
  MOBILE_OPTIMIZATIONS: 'mobile-optimizations',
  
  // Performance Features
  WASM_DIFF_ENGINE: 'wasm-diff-engine',
  LAZY_LOADING: 'lazy-loading',
  VIRTUAL_SCROLLING: 'virtual-scrolling',
  
  // Analytics Features
  SESSION_RECORDING: 'session-recording',
  HEATMAPS: 'heatmaps',
  DETAILED_ANALYTICS: 'detailed-analytics',
  
  // Business Features
  PREMIUM_FEATURES: 'premium-features',
  API_ACCESS: 'api-access',
  EXPORT_OPTIONS: 'export-options',
  TEAM_COLLABORATION: 'team-collaboration',
  
  // Experimental Features  
  AI_ASSISTED_DIFF: 'ai-assisted-diff',
  REAL_TIME_COLLABORATION: 'real-time-collaboration',
  INTEGRATION_WEBHOOKS: 'integration-webhooks',
} as const

export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS]