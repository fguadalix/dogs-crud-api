import rateLimit from 'express-rate-limit';

// Create stores for each limiter to allow independent testing
const apiStore = new Map();
const writeStore = new Map();
const batchStore = new Map();
const readStore = new Map();

// Function to reset all rate limit stores (useful for testing)
export const resetRateLimiters = () => {
  apiStore.clear();
  writeStore.clear();
  batchStore.clear();
  readStore.clear();
};

// General rate limiter for all API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Stricter rate limiter for write operations (POST, PUT, DELETE)
export const writeOperationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 write operations per windowMs
  message: 'Too many write operations from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Very strict rate limiter for expensive operations (batch operations)
export const batchOperationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 batch operations per windowMs
  message:
    'Too many batch operations from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Lenient rate limiter for read operations
export const readOperationsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 read operations per minute
  message: 'Too many read operations from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
