import IORedis from 'ioredis';

export class RateLimitError extends Error {
  constructor(public slug: string, public retryAfterMs = 60000) {
    super(`Rate limit exceeded for connector '${slug}'. Retry after ${Math.ceil(retryAfterMs / 1000)}s`);
    this.name = 'RateLimitError';
  }
}

export class ConnectorRateLimiter {
  private redis: IORedis;

  constructor(redisClient?: IORedis) {
    this.redis = redisClient ?? new IORedis(process.env.REDIS_URL ?? 'redis://redis:6379', {
      maxRetriesPerRequest: null,
    });
  }

  /**
   * Sliding-window rate limiter using Redis sorted sets.
   * Scoped by connector slug and requester (citizenId or IP).
   */
  async checkAndConsume(
    slug: string,
    requesterId: string,
    limit = 100,
    windowSec = 60
  ): Promise<{ allowed: boolean; retryAfterMs?: number }> {
    const key = `govlink:rl:${slug}:${requesterId}`;
    const now = Date.now();
    const windowMs = windowSec * 1000;
    const clearBefore = now - windowMs;

    try {
      const results = await this.redis
        .multi()
        .zremrangebyscore(key, 0, clearBefore)
        .zcard(key)
        .exec();

      const currentCount = (results?.[1]?.[1] as number) ?? 0;

      if (currentCount >= limit) {
        return { allowed: false, retryAfterMs: windowMs };
      }

      await this.redis
        .multi()
        .zadd(key, now, `${now}-${Math.random().toString(36).substring(2, 8)}`)
        .expire(key, windowSec + 5)
        .exec();

      return { allowed: true };
    } catch (err) {
      // Fallback: If Redis has a transient error, fail open rather than block legit calls
      console.warn(`[RateLimiter] Redis error for ${slug}:`, (err as any).message);
      return { allowed: true };
    }
  }
}

export const rateLimiter = new ConnectorRateLimiter();
