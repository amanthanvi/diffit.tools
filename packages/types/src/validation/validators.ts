import { z } from 'zod';
import { 
  PLAN_LIMITS, 
  FILE_SIZE_LIMITS, 
  RATE_LIMITS,
  REGEX,
  SUPPORTED_FILE_TYPES,
} from '../constants';
import { DiffContentType } from '../diff';

/**
 * Validate file size against limits
 */
export function validateFileSize(
  size: number
): { valid: boolean; error?: string } {
  // Use FREE tier limit as default since there's no authentication
  const limit = FILE_SIZE_LIMITS.MAX_FILE_SIZE_FREE;
  
  if (size > limit) {
    return {
      valid: false,
      error: `File size exceeds limit of ${formatBytes(limit)}`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate text content length
 */
export function validateTextLength(
  text: string
): { valid: boolean; error?: string } {
  if (text.length > FILE_SIZE_LIMITS.MAX_TEXT_LENGTH) {
    return {
      valid: false,
      error: `Text length exceeds maximum of ${FILE_SIZE_LIMITS.MAX_TEXT_LENGTH} characters`,
    };
  }
  
  const lineCount = text.split('\n').length;
  if (lineCount > FILE_SIZE_LIMITS.MAX_LINES) {
    return {
      valid: false,
      error: `Line count exceeds maximum of ${FILE_SIZE_LIMITS.MAX_LINES} lines`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(
  mimeType: string,
  filename?: string
): { valid: boolean; error?: string; contentType?: DiffContentType } {
  // Check if it's a supported text MIME type
  if (SUPPORTED_FILE_TYPES.TEXT.includes(mimeType as any)) {
    return { valid: true, contentType: 'text' };
  }
  
  // Check by file extension if filename is provided
  if (filename) {
    const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (ext && SUPPORTED_FILE_TYPES.CODE.includes(ext as any)) {
      return { valid: true, contentType: 'code' };
    }
  }
  
  // Check for specific content types
  if (mimeType.startsWith('text/')) {
    return { valid: true, contentType: 'text' };
  }
  
  if (mimeType === 'application/json') {
    return { valid: true, contentType: 'json' };
  }
  
  if (mimeType === 'application/xml' || mimeType.endsWith('+xml')) {
    return { valid: true, contentType: 'xml' };
  }
  
  return {
    valid: false,
    error: `Unsupported file type: ${mimeType}`,
  };
}

/**
 * Validate rate limit
 */
export function validateRateLimit(
  requestCount: number,
  limitType: keyof typeof RATE_LIMITS.ANONYMOUS = 'DEFAULT'
): { valid: boolean; error?: string; retryAfter?: number } {
  // Use ANONYMOUS tier limits since there's no authentication
  const limits = RATE_LIMITS.ANONYMOUS;
  const limit = (limits as any)[limitType] || limits.DEFAULT;
  
  if (requestCount >= limit) {
    return {
      valid: false,
      error: `Rate limit exceeded: ${limit} requests per hour`,
      retryAfter: 3600, // 1 hour in seconds
    };
  }
  
  return { valid: true };
}

/**
 * Validate username
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!REGEX.USERNAME.test(username)) {
    return {
      valid: false,
      error: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens',
    };
  }
  
  // Check for reserved usernames
  const reserved = ['admin', 'api', 'app', 'auth', 'blog', 'dashboard', 'docs', 'help', 'www'];
  if (reserved.includes(username.toLowerCase())) {
    return {
      valid: false,
      error: 'This username is reserved',
    };
  }
  
  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  error?: string;
  strength: 'weak' | 'medium' | 'strong';
  suggestions?: string[];
} {
  const suggestions: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  if (password.length < 8) {
    suggestions.push('Use at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    suggestions.push('Include at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    suggestions.push('Include at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    suggestions.push('Include at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    suggestions.push('Include at least one special character');
  }
  
  // Calculate strength
  const checks = [
    password.length >= 8,
    password.length >= 12,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  
  const score = checks.filter(Boolean).length;
  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  const valid = password.length >= 8 && 
                /[A-Z]/.test(password) && 
                /[a-z]/.test(password) && 
                /[0-9]/.test(password);
  
  return {
    valid,
    error: valid ? undefined : 'Password does not meet minimum requirements',
    strength,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

/**
 * Validate email domain
 */
export function validateEmailDomain(
  email: string,
  allowedDomains?: string[],
  blockedDomains?: string[]
): { valid: boolean; error?: string } {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  if (allowedDomains && !allowedDomains.includes(domain)) {
    return {
      valid: false,
      error: `Email domain must be one of: ${allowedDomains.join(', ')}`,
    };
  }
  
  if (blockedDomains && blockedDomains.includes(domain)) {
    return {
      valid: false,
      error: 'Email domain is not allowed',
    };
  }
  
  // Check for disposable email domains
  const disposableDomains = ['tempmail.com', 'throwaway.email', '10minutemail.com'];
  if (disposableDomains.includes(domain)) {
    return {
      valid: false,
      error: 'Disposable email addresses are not allowed',
    };
  }
  
  return { valid: true };
}

/**
 * Validate API key format
 */
export function validateApiKey(key: string): { valid: boolean; error?: string } {
  // Expected format: dft_[environment]_[random]
  const pattern = /^dft_(dev|prod)_[a-zA-Z0-9]{32}$/;
  
  if (!pattern.test(key)) {
    return {
      valid: false,
      error: 'Invalid API key format',
    };
  }
  
  return { valid: true };
}

/**
 * Sanitize and validate tags
 */
export function validateTags(tags: string[]): {
  valid: boolean;
  error?: string;
  sanitized: string[];
} {
  const sanitized = tags
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0)
    .filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates
  
  if (sanitized.length > 20) {
    return {
      valid: false,
      error: 'Maximum 20 tags allowed',
      sanitized: sanitized.slice(0, 20),
    };
  }
  
  const invalidTags = sanitized.filter(tag => !/^[a-z0-9-_]+$/.test(tag));
  if (invalidTags.length > 0) {
    return {
      valid: false,
      error: `Invalid tag format: ${invalidTags.join(', ')}`,
      sanitized: sanitized.filter(tag => /^[a-z0-9-_]+$/.test(tag)),
    };
  }
  
  return { valid: true, sanitized };
}

/**
 * Validate collection slug
 */
export function validateSlug(slug: string): { valid: boolean; error?: string; sanitized?: string } {
  const sanitized = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  if (sanitized.length < 3) {
    return {
      valid: false,
      error: 'Slug must be at least 3 characters long',
      sanitized,
    };
  }
  
  if (sanitized.length > 100) {
    return {
      valid: false,
      error: 'Slug must not exceed 100 characters',
      sanitized: sanitized.slice(0, 100),
    };
  }
  
  if (!REGEX.SLUG.test(sanitized)) {
    return {
      valid: false,
      error: 'Slug must contain only lowercase letters, numbers, and hyphens',
      sanitized,
    };
  }
  
  return { valid: true, sanitized };
}

// Helper functions
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}