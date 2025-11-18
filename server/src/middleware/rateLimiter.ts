import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export const rateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting in development if not enabled
    if (process.env.NODE_ENV === 'development' && process.env.RATE_LIMIT_ENABLED !== 'true') {
      return next();
    }

    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs
      };
      return next();
    }

    store[key].count++;

    if (store[key].count > options.max) {
      res.status(429).json({
        error: options.message || 'Too many requests, please try again later'
      });
      return;
    }

    next();
  };
};

// Pre-configured limiters
export const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP'
});

export const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts'
});

export const uploadLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many uploads'
});

export const postLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many posts created'
});

export const messageLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: 'Too many messages sent'
});
