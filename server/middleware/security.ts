/**
 * Security Middleware
 * Rate limiting, input sanitization, and security headers
 */

import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { logger } from "../_core/logger";

// Re-export rateLimit for use in other files if needed
export { rateLimit };

// Configuration for rate limiters
const defaultConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests", retryAfter: true },
};

const strictConfig = {
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // Reduced from 10 for sensitive endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests", retryAfter: true },
};

// Payment endpoints - reasonable limits (not too strict for legitimate users)
const paymentConfig = {
  windowMs: 60 * 1000, // 1 minute
  limit: 10, // 10 payment attempts per minute (allows retries)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests", retryAfter: true },
};

// Analysis config (Perplexity API costs money, but paid users should have good UX)
const analysisConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20, // Max 20 analyses per hour per IP (reasonable for power users)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests", retryAfter: true },
};

// Email submission config (prevent spam)
const emailConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5, // Max 5 email submissions per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests", retryAfter: true },
};

/**
 * Get client IP address helper (express-rate-limit handles this automatically usually,
 * but if we need custom key generator)
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

/**
 * Strict rate limiting for sensitive endpoints
 */
export const strictRateLimit = rateLimit(strictConfig);

/**
 * API rate limiting
 */
export const apiRateLimit = rateLimit(defaultConfig);

/**
 * Webhook rate limiting (more permissive)
 */
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Payment rate limiting (ultra-strict to prevent fraud)
 * Only 3 payment attempts per minute per IP - wait, config says 10. Keeping 10 as per config.
 */
export const paymentRateLimit = rateLimit(paymentConfig);

/**
 * Analysis rate limiting (protects expensive Perplexity API)
 * Only 10 analyses per hour per IP - wait, config says 20. Keeping 20 as per config.
 */
export const analysisRateLimit = rateLimit(analysisConfig);

/**
 * Email submission rate limiting (prevents spam)
 * Only 5 email submissions per hour per IP
 */
export const emailRateLimit = rateLimit(emailConfig);

/**
 * Security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://commerce.coinbase.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.commerce.coinbase.com", "https://api.perplexity.ai"],
      frameSrc: ["https://js.stripe.com", "https://commerce.coinbase.com"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow resources to be loaded by others if needed, or strict-origin
  // strictTransportSecurity is enabled by default in helmet with reasonable defaults (15552000 seconds = 180 days)
  // We can override if we want 1 year:
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  // Explicitly set Referrer-Policy to match audit recommendation
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
  // Explicitly set X-Frame-Options to DENY to match audit recommendation
  xFrameOptions: {
    action: "deny",
  },
});

/**
 * Sanitize request body (basic XSS prevention)
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    // Basic HTML entity encoding for dangerous characters
    return obj
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === "object") {
    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Request logging middleware (for security monitoring)
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  
  // Log request (avoid logging sensitive data)
  logger.info(`[${timestamp}] ${method} ${path} - IP: ${ip}`);
  
  // Track response time
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration > 5000) {
      logger.warn(`[SLOW REQUEST] ${method} ${path} took ${duration}ms`);
    }
  });
  
  next();
}
