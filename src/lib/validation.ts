import validator from 'validator';

/**
 * Security-focused validation utilities
 */

/**
 * Sanitize text input to prevent XSS attacks
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  // Remove potentially dangerous HTML tags and scripts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Validate and sanitize phone number
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; sanitized: string } {
  if (!phone) return { isValid: true, sanitized: '' };
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Brazilian phone number validation (10 or 11 digits)
  const isValid = cleaned.length >= 10 && cleaned.length <= 11;
  
  return { isValid, sanitized: cleaned };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return true; // Optional field
  return validator.isEmail(email);
}

/**
 * Validate and sanitize observations/textarea content
 */
export function validateObservations(text: string): { isValid: boolean; sanitized: string } {
  if (!text) return { isValid: true, sanitized: '' };
  
  // Sanitize the text
  const sanitized = sanitizeText(text);
  
  // Check length limits (reasonable for observations)
  const isValid = sanitized.length <= 2000;
  
  return { isValid, sanitized };
}

/**
 * Validate lead name
 */
export function validateLeadName(name: string): { isValid: boolean; sanitized: string } {
  if (!name) return { isValid: false, sanitized: '' };
  
  const sanitized = sanitizeText(name).trim();
  const isValid = sanitized.length >= 2 && sanitized.length <= 100;
  
  return { isValid, sanitized };
}

/**
 * Rate limiting utility for form submissions
 */
export class RateLimiter {
  private submissions: Map<string, number[]> = new Map();
  private readonly maxSubmissions: number;
  private readonly timeWindow: number; // in milliseconds
  
  constructor(maxSubmissions = 5, timeWindowMinutes = 1) {
    this.maxSubmissions = maxSubmissions;
    this.timeWindow = timeWindowMinutes * 60 * 1000;
  }
  
  canSubmit(identifier: string): boolean {
    const now = Date.now();
    const userSubmissions = this.submissions.get(identifier) || [];
    
    // Remove old submissions outside the time window
    const recentSubmissions = userSubmissions.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    // Update the submissions array
    this.submissions.set(identifier, recentSubmissions);
    
    return recentSubmissions.length < this.maxSubmissions;
  }
  
  recordSubmission(identifier: string): void {
    const now = Date.now();
    const userSubmissions = this.submissions.get(identifier) || [];
    userSubmissions.push(now);
    this.submissions.set(identifier, userSubmissions);
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter(10, 5); // 10 submissions per 5 minutes