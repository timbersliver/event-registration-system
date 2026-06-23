import Redis from 'ioredis';

const REDIS_CACHE_EXPIRY = 60 * 60 * 24; // 24 hours

class CacheService {
  private redis: Redis | null = null;
  private isAvailable: boolean = false;

  constructor() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.warn('[Cache] Redis connection failed after 3 retries. Cache disabled.');
            this.isAvailable = false;
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.isAvailable = true;
        console.log('[Cache] Redis connected');
      });

      this.redis.on('error', (err) => {
        this.isAvailable = false;
        console.warn('[Cache] Redis error:', err.message);
      });

      this.redis.on('close', () => {
        this.isAvailable = false;
      });

      // Attempt connection
      this.redis.connect().catch((err) => {
        console.warn('[Cache] Redis connection failed:', err.message);
        this.isAvailable = false;
      });
    } catch (err) {
      console.warn('[Cache] Redis initialization failed. Cache disabled.');
      this.isAvailable = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable || !this.redis) return null;
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, expirySeconds: number = REDIS_CACHE_EXPIRY): Promise<void> {
    if (!this.isAvailable || !this.redis) return;
    try {
      await this.redis.setex(key, expirySeconds, JSON.stringify(value));
    } catch {
      // silently fail
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable || !this.redis) return;
    try {
      await this.redis.del(key);
    } catch {
      // silently fail
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.isAvailable || !this.redis) return;
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch {
      // silently fail
    }
  }
}

export const cacheService = new CacheService();
