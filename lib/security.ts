import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in-memory for development, use Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMITS = {
  'generate-hooks': { maxRequests: 10, windowMs: 60000 },
  'hooks-save': { maxRequests: 30, windowMs: 60000 },
  'hooks-delete': { maxRequests: 20, windowMs: 60000 },
  'search-topics': { maxRequests: 20, windowMs: 60000 },
  'youtube-topics': { maxRequests: 10, windowMs: 60000 },
  'default': { maxRequests: 60, windowMs: 60000 },
};

// Sanitize string input to prevent XSS and injection attacks
export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';

  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data URLs
    .trim();
}

// Validate platform input
const VALID_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin'];

export function validatePlatform(platform: string): boolean {
  return VALID_PLATFORMS.includes(platform);
}

// Validate hook style input
const VALID_STYLES = ['curiosity', 'controversy', 'storytelling', 'data', 'problem', 'transformation'];

export function validateStyle(style: string): boolean {
  return VALID_STYLES.includes(style);
}

// Rate limiting middleware
export function rateLimit(
  request: NextRequest,
  endpoint: keyof typeof RATE_LIMITS = 'default'
): { success: boolean; remaining: number; resetTime: number } {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const key = `${ip}-${endpoint}`;
  const config = RATE_LIMITS[endpoint];
  const now = Date.now();

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { success: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }

  if (record.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { success: true, remaining: config.maxRequests - record.count, resetTime: record.resetTime };
}

// Security headers for responses
export function securityHeaders(headers: Headers = new Headers()): Headers {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return headers;
}

// Content Security Policy
export function getCSP(): string {
  const isDev = process.env.NODE_ENV === 'development';

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.anthropic.com https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    isDev ? "" : "upgrade-insecure-requests",
  ].filter(Boolean).join('; ');
}

// Validate request body size
export function validateBodySize(request: NextRequest, maxSizeKB: number = 10): boolean {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) return true;

  const size = parseInt(contentLength, 10);
  return size <= maxSizeKB * 1024;
}

// Create rate limit error response
export function rateLimitError(resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  const headers = securityHeaders(new Headers({
    'Retry-After': retryAfter.toString(),
    'X-RateLimit-Reset': resetTime.toString(),
  }));

  return NextResponse.json(
    { error: 'Too many requests. Please slow down.' },
    { status: 429, headers }
  );
}

// Create validation error response
export function validationError(message: string): NextResponse {
  const headers = securityHeaders();
  return NextResponse.json(
    { error: message },
    { status: 400, headers }
  );
}

// Create unauthorized response
export function unauthorizedError(): NextResponse {
  const headers = securityHeaders();
  return NextResponse.json(
    { error: 'Authentication required' },
    { status: 401, headers }
  );
}
