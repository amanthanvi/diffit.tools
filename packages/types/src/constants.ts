/**
 * Plan limits and features
 */
export const PLAN_LIMITS = {
  FREE: {
    maxDiffsPerMonth: 50,
    maxFileSize: 1 * 1024 * 1024, // 1MB
    maxStorageSize: 100 * 1024 * 1024, // 100MB
    maxBandwidthPerMonth: 1 * 1024 * 1024 * 1024, // 1GB
    maxApiCallsPerMonth: 100,
    maxCollections: 3,
    maxTeamMembers: 1,
    features: {
      privateCollections: false,
      apiAccess: false,
      customDomains: false,
      sso: false,
      advancedAnalytics: false,
      prioritySupport: false,
      whiteLabeling: false,
    },
  },
  PRO: {
    maxDiffsPerMonth: 500,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxStorageSize: 10 * 1024 * 1024 * 1024, // 10GB
    maxBandwidthPerMonth: 50 * 1024 * 1024 * 1024, // 50GB
    maxApiCallsPerMonth: 10000,
    maxCollections: 50,
    maxTeamMembers: 1,
    features: {
      privateCollections: true,
      apiAccess: true,
      customDomains: false,
      sso: false,
      advancedAnalytics: true,
      prioritySupport: false,
      whiteLabeling: false,
    },
  },
  TEAM: {
    maxDiffsPerMonth: 2000,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxStorageSize: 100 * 1024 * 1024 * 1024, // 100GB
    maxBandwidthPerMonth: 500 * 1024 * 1024 * 1024, // 500GB
    maxApiCallsPerMonth: 50000,
    maxCollections: 200,
    maxTeamMembers: 10,
    features: {
      privateCollections: true,
      apiAccess: true,
      customDomains: true,
      sso: true,
      advancedAnalytics: true,
      prioritySupport: true,
      whiteLabeling: false,
    },
  },
  ENTERPRISE: {
    maxDiffsPerMonth: Infinity,
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxStorageSize: Infinity,
    maxBandwidthPerMonth: Infinity,
    maxApiCallsPerMonth: Infinity,
    maxCollections: Infinity,
    maxTeamMembers: Infinity,
    features: {
      privateCollections: true,
      apiAccess: true,
      customDomains: true,
      sso: true,
      advancedAnalytics: true,
      prioritySupport: true,
      whiteLabeling: true,
    },
  },
} as const;

/**
 * File size limits
 */
export const FILE_SIZE_LIMITS = {
  MIN_FILE_SIZE: 1, // 1 byte
  MAX_FILE_SIZE_FREE: 1 * 1024 * 1024, // 1MB
  MAX_FILE_SIZE_PRO: 10 * 1024 * 1024, // 10MB
  MAX_FILE_SIZE_TEAM: 50 * 1024 * 1024, // 50MB
  MAX_FILE_SIZE_ENTERPRISE: 500 * 1024 * 1024, // 500MB
  MAX_TEXT_LENGTH: 5000000, // 5M characters
  MAX_LINES: 100000, // 100k lines
} as const;

/**
 * Rate limits (requests per hour)
 */
export const RATE_LIMITS = {
  ANONYMOUS: {
    DEFAULT: 20,
    DIFF_CREATE: 5,
    FILE_UPLOAD: 2,
  },
  FREE: {
    DEFAULT: 100,
    DIFF_CREATE: 20,
    FILE_UPLOAD: 10,
    API_CALLS: 100,
  },
  PRO: {
    DEFAULT: 1000,
    DIFF_CREATE: 100,
    FILE_UPLOAD: 50,
    API_CALLS: 1000,
  },
  TEAM: {
    DEFAULT: 5000,
    DIFF_CREATE: 500,
    FILE_UPLOAD: 200,
    API_CALLS: 5000,
  },
  ENTERPRISE: {
    DEFAULT: Infinity,
    DIFF_CREATE: Infinity,
    FILE_UPLOAD: Infinity,
    API_CALLS: Infinity,
  },
} as const;

/**
 * Time limits
 */
export const TIME_LIMITS = {
  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
  DIFF_EXPIRY_ANONYMOUS: 24 * 60 * 60 * 1000, // 24 hours
  DIFF_EXPIRY_FREE: 30 * 24 * 60 * 60 * 1000, // 30 days
  DIFF_EXPIRY_PAID: 365 * 24 * 60 * 60 * 1000, // 1 year
  PASSWORD_RESET_TOKEN: 60 * 60 * 1000, // 1 hour
  EMAIL_VERIFICATION_TOKEN: 24 * 60 * 60 * 1000, // 24 hours
  API_KEY_DEFAULT_EXPIRY: 90 * 24 * 60 * 60 * 1000, // 90 days
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  GONE: 'GONE',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  
  // Server errors (5xx)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  BAD_GATEWAY: 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
  
  // Custom errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  PLAN_LIMIT_ERROR: 'PLAN_LIMIT_ERROR',
  FILE_SIZE_ERROR: 'FILE_SIZE_ERROR',
  FILE_TYPE_ERROR: 'FILE_TYPE_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  SUBSCRIPTION_ERROR: 'SUBSCRIPTION_ERROR',
} as const;

/**
 * Feature flags
 */
export const FEATURE_FLAGS = {
  NEW_DIFF_ENGINE: 'new_diff_engine',
  COLLABORATIVE_EDITING: 'collaborative_editing',
  AI_SUGGESTIONS: 'ai_suggestions',
  ADVANCED_SEARCH: 'advanced_search',
  CUSTOM_THEMES: 'custom_themes',
  EXPORT_TO_GITHUB: 'export_to_github',
  WEBHOOKS: 'webhooks',
  OAUTH_PROVIDERS: 'oauth_providers',
  TWO_FACTOR_AUTH: 'two_factor_auth',
  AUDIT_LOGS: 'audit_logs',
} as const;

/**
 * Supported file types
 */
export const SUPPORTED_FILE_TYPES = {
  TEXT: [
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'text/markdown',
    'text/x-python',
    'text/x-java',
    'text/x-c',
    'text/x-cpp',
    'text/x-csharp',
    'text/x-go',
    'text/x-rust',
    'text/x-ruby',
    'text/x-php',
    'text/x-sql',
    'text/x-yaml',
    'application/json',
    'application/xml',
    'application/javascript',
    'application/typescript',
  ],
  CODE: [
    '.js', '.jsx', '.ts', '.tsx',
    '.py', '.java', '.c', '.cpp', '.cc', '.cxx',
    '.cs', '.go', '.rs', '.rb', '.php',
    '.swift', '.kt', '.scala', '.r',
    '.sql', '.html', '.css', '.scss', '.sass',
    '.json', '.xml', '.yaml', '.yml',
    '.md', '.markdown', '.rst', '.txt',
  ],
  ARCHIVE: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-tar',
    'application/gzip',
  ],
} as const;

/**
 * Diff context lines
 */
export const DIFF_CONTEXT = {
  MIN_LINES: 0,
  DEFAULT_LINES: 3,
  MAX_LINES: 999,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

/**
 * Cache TTL (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

/**
 * WebSocket events
 */
export const WS_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Diff events
  DIFF_UPDATE: 'diff:update',
  DIFF_VIEW: 'diff:view',
  DIFF_DELETE: 'diff:delete',
  
  // Comment events
  COMMENT_CREATE: 'comment:create',
  COMMENT_UPDATE: 'comment:update',
  COMMENT_DELETE: 'comment:delete',
  COMMENT_REACTION: 'comment:reaction',
  
  // Collaboration events
  USER_JOIN: 'user:join',
  USER_LEAVE: 'user:leave',
  CURSOR_MOVE: 'cursor:move',
  SELECTION_CHANGE: 'selection:change',
} as const;

/**
 * Regular expressions
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  SLUG: /^[a-z0-9-]+$/,
  HEX_COLOR: /^#[0-9a-fA-F]{6}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  SEMVER: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
} as const;

/**
 * Default values
 */
export const DEFAULTS = {
  AVATAR_URL: '/images/default-avatar.png',
  COVER_IMAGE_URL: '/images/default-cover.png',
  THEME: 'system' as const,
  LANGUAGE: 'en',
  TIMEZONE: 'UTC',
  DIFF_VIEW_MODE: 'split' as const,
  SYNTAX_HIGHLIGHTING: true,
  LINE_NUMBERS: true,
  WHITESPACE_VISIBLE: false,
  WORD_WRAP: false,
  FONT_SIZE: 14,
  FONT_FAMILY: 'Monaco, Consolas, "Courier New", monospace',
} as const;