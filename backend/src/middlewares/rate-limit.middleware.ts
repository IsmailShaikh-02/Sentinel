// src/middlewares/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';

// Strict limiter for authentication to prevent brute-force attacks
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 5, // Limit each client IP to 5 FAILED attempts per window
  skipSuccessfulRequests: true, // Do not count 2xx responses against the limit
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    error: 'Too many authentication attempts. Please try again after 10 minutes.',
  },
});

// General limiter for public or heavy routes
export const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 200, // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please slow down.',
  },
});