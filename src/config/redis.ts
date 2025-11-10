import Redis from 'ioredis';
import env from './env';
import logger from './logger';

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

redis.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redis.on('error', (error) => {
  logger.error('❌ Redis connection error:', error);
});

redis.on('ready', () => {
  logger.info('Redis is ready to accept commands');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

export const disconnectRedis = async () => {
  try {
    await redis.quit();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Error disconnecting Redis:', error);
  }
};

/**
 * Cache helper utilities
 */
export const cacheUtils = {
  /**
   * Get or set a value with a callback
   */
  async getOrSet<T>(key: string, ttl: number, fetchFn: () => Promise<T>): Promise<T> {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }

    const fresh = await fetchFn();
    await redis.setex(key, ttl, JSON.stringify(fresh));
    return fresh;
  },

  /**
   * Set JSON value with TTL
   */
  async setJSON(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  /**
   * Get JSON value
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Failed to parse JSON for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Delete keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },
};

/**
 * Cache key generators
 */
export const cacheKeys = {
  equipment: {
    list: (filters: string) => `equipment:list:${filters}`,
    detail: (id: string) => `equipment:detail:${id}`,
    categories: () => `equipment:categories`,
    availability: (id: string, dates: string) => `equipment:availability:${id}:${dates}`,
  },
  reports: {
    dashboard: () => `reports:dashboard`,
    revenue: (period: string) => `reports:revenue:${period}`,
    utilization: () => `reports:utilization`,
  },
  customer: {
    stats: (id: string) => `customer:stats:${id}`,
    bookings: (id: string, filters: string) => `customer:bookings:${id}:${filters}`,
  },
};

export default redis;
