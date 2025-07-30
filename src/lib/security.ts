/**
 * Security utilities and configurations
 */

/**
 * Security headers for production deployment
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Security configuration constants
 */
export const SECURITY_CONFIG = {
  // Session timeout (24 hours)
  SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000,
  
  // Maximum failed login attempts
  MAX_LOGIN_ATTEMPTS: 5,
  
  // Login attempt lockout duration (15 minutes)
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,
  
  // Sensitive operations that should be logged
  SENSITIVE_OPERATIONS: [
    'lead_status_change',
    'lead_deletion',
    'lead_export',
    'user_login',
    'user_logout',
    'password_change',
    'sitplan_selection',
    'ta_assignment'
  ] as const,
} as const;

/**
 * Create audit log entry
 */
export function createAuditLog(
  user_id: string,
  action: typeof SECURITY_CONFIG.SENSITIVE_OPERATIONS[number],
  resource_type: string,
  resource_id?: string,
  details?: Record<string, any>
): AuditLogEntry {
  return {
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    timestamp: new Date().toISOString(),
    ip_address: getClientIP(),
    user_agent: navigator.userAgent,
  };
}

/**
 * Get client IP address (best effort)
 */
function getClientIP(): string {
  // In production, this would be better handled server-side
  // For now, we'll use a placeholder
  return 'client-ip-masked';
}

/**
 * Sanitize error messages for production
 */
export function sanitizeErrorMessage(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message;
  
  // Remove potentially sensitive information from error messages
  const sensitivePatterns = [
    /password/gi,
    /token/gi,
    /secret/gi,
    /key/gi,
    /auth/gi,
    /jwt/gi,
    /session/gi,
  ];
  
  let sanitized = message;
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  // In production, return generic error for database/auth errors
  if (process.env.NODE_ENV === 'production') {
    if (sanitized.includes('database') || sanitized.includes('auth')) {
      return 'Ocorreu um erro interno. Tente novamente.';
    }
  }
  
  return sanitized;
}

/**
 * Check if operation requires enhanced security
 */
export function requiresEnhancedSecurity(operation: string): boolean {
  return SECURITY_CONFIG.SENSITIVE_OPERATIONS.includes(
    operation as typeof SECURITY_CONFIG.SENSITIVE_OPERATIONS[number]
  );
}

/**
 * Validate session and check for timeout
 */
export function validateSession(sessionTimestamp: number): boolean {
  const now = Date.now();
  const sessionAge = now - sessionTimestamp;
  return sessionAge < SECURITY_CONFIG.SESSION_TIMEOUT_MS;
}