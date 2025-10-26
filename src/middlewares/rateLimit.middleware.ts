import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import { RateLimitError } from '../utils/errorHandler';
import { RATE_LIMITS } from '../utils/constants';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

const defaultOptions: RateLimitOptions = {
  windowMs: RATE_LIMITS.PUBLIC.windowMs,
  max: RATE_LIMITS.PUBLIC.max,
  keyPrefix: 'rl:',
};

export const rateLimit = (options: Partial<RateLimitOptions> = {}) => {
  const opts = { ...defaultOptions, ...options };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `${opts.keyPrefix}${identifier}`;

      const current = await redis.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= opts.max) {
        const ttl = await redis.ttl(key);
        res.setHeader('X-RateLimit-Limit', opts.max.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', (Date.now() + ttl * 1000).toString());
        throw new RateLimitError('Rate limit exceeded. Please try again later.');
      }

      const newCount = count + 1;
      const ttlSeconds = Math.ceil(opts.windowMs / 1000);

      if (count === 0) {
        await redis.setex(key, ttlSeconds, newCount.toString());
      } else {
        await redis.incr(key);
      }

      res.setHeader('X-RateLimit-Limit', opts.max.toString());
      res.setHeader('X-RateLimit-Remaining', (opts.max - newCount).toString());
      res.setHeader(
        'X-RateLimit-Reset',
        (Date.now() + (await redis.ttl(key)) * 1000).toString()
      );

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const publicRateLimit = rateLimit({
  windowMs: RATE_LIMITS.PUBLIC.windowMs,
  max: RATE_LIMITS.PUBLIC.max,
  keyPrefix: 'rl:public:',
});

export const authRateLimit = rateLimit({
  windowMs: RATE_LIMITS.AUTHENTICATED.windowMs,
  max: RATE_LIMITS.AUTHENTICATED.max,
  keyPrefix: 'rl:auth:',
});

export const adminRateLimit = rateLimit({
  windowMs: RATE_LIMITS.ADMIN.windowMs,
  max: RATE_LIMITS.ADMIN.max,
  keyPrefix: 'rl:admin:',
});
