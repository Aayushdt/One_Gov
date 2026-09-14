import IORedis from 'ioredis';
import { connectorMetrics } from '../metrics/connector.metrics';

export class CircuitBreakerOpenError extends Error {
  constructor(public slug: string, public retryAfterMs: number) {
    super(`Circuit breaker is OPEN for connector '${slug}'. Fast-failing request. Retry after ${Math.ceil(retryAfterMs)}ms`);
    this.name = 'CircuitBreakerOpenError';
  }
}

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Failures before opening circuit (default: 3)
  resetTimeoutMs?: number;   // Time in open state before allowing half-open probe (default: 5000ms)
  redisClient?: IORedis;
}

export class CircuitBreaker {
  private redis: IORedis;
  private failureThreshold: number;
  private resetTimeoutMs: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 5000;
    this.redis = options.redisClient ?? new IORedis(process.env.REDIS_URL ?? 'redis://redis:6379', {
      maxRetriesPerRequest: null,
    });
  }

  private getKey(slug: string): string {
    return `govlink:cb:${slug}`;
  }

  private getProbeLockKey(slug: string): string {
    return `govlink:cb:${slug}:probe_lock`;
  }

  /**
   * Reads current circuit state from Redis.
   */
  async getState(slug: string): Promise<{ state: 'closed' | 'open' | 'half-open'; failCount: number; lastFailAt: number }> {
    const key = this.getKey(slug);
    const data = await this.redis.hgetall(key);
    if (!data || !data.state) {
      return { state: 'closed', failCount: 0, lastFailAt: 0 };
    }
    return {
      state: data.state as any,
      failCount: parseInt(data.failCount || '0', 10),
      lastFailAt: parseInt(data.lastFailAt || '0', 10),
    };
  }

  /**
   * Resets the circuit breaker to closed state.
   */
  async reset(slug: string): Promise<void> {
    const key = this.getKey(slug);
    await this.redis.del(key);
    await this.redis.del(this.getProbeLockKey(slug));
  }

  /**
   * Manually forces circuit to open state (useful for tests and incident response).
   */
  async forceOpen(slug: string): Promise<void> {
    const key = this.getKey(slug);
    await this.redis.hset(key, {
      state: 'open',
      failCount: this.failureThreshold,
      lastFailAt: Date.now(),
    });
  }

  /**
   * Executes the wrapped function protected by the circuit breaker.
   */
  async call<T>(slug: string, fn: () => Promise<T>): Promise<T> {
    const key = this.getKey(slug);
    const probeLockKey = this.getProbeLockKey(slug);
    const now = Date.now();

    const info = await this.getState(slug);

    if (info.state === 'open') {
      const elapsed = now - info.lastFailAt;
      if (elapsed < this.resetTimeoutMs) {
        // Fast-fail: circuit is OPEN and reset timeout has not elapsed
        throw new CircuitBreakerOpenError(slug, this.resetTimeoutMs - elapsed);
      }

      // Reset timeout has elapsed — attempt to acquire probe lock for HALF-OPEN test
      // Atomic SET NX with TTL guarantees exactly one concurrent probe
      const acquiredLock = await this.redis.set(probeLockKey, '1', 'PX', this.resetTimeoutMs, 'NX');
      if (!acquiredLock) {
        // Another job already acquired the half-open probe lock! Fail fast.
        throw new CircuitBreakerOpenError(slug, this.resetTimeoutMs);
      }

      // Acquired probe lock: transition to half-open
      await this.redis.hset(key, 'state', 'half-open');

      try {
        const result = await fn();
        // Probe succeeded! Close circuit and release lock
        await this.reset(slug);
        return result;
      } catch (err) {
        // Probe failed! Trip back to open
        await this.redis.hset(key, {
          state: 'open',
          failCount: info.failCount + 1,
          lastFailAt: Date.now(),
        });
        await this.redis.del(probeLockKey);
        await connectorMetrics.recordEvent(slug, 'CIRCUIT_OPEN');
        throw err;
      }
    }

    if (info.state === 'half-open') {
      // If half-open and no lock (or other request), fail fast
      const hasLock = await this.redis.get(probeLockKey);
      if (hasLock) {
        throw new CircuitBreakerOpenError(slug, this.resetTimeoutMs);
      }
    }

    // State is closed: execute call
    try {
      const result = await fn();
      if (info.failCount > 0) {
        await this.redis.hset(key, 'failCount', 0);
      }
      return result;
    } catch (err) {
      const newFailCount = info.failCount + 1;
      if (newFailCount >= this.failureThreshold) {
        await this.redis.hset(key, {
          state: 'open',
          failCount: newFailCount,
          lastFailAt: Date.now(),
        });
        await connectorMetrics.recordEvent(slug, 'CIRCUIT_OPEN');
      } else {
        await this.redis.hset(key, {
          state: 'closed',
          failCount: newFailCount,
          lastFailAt: Date.now(),
        });
      }
      throw err;
    }
  }
}

export const circuitBreaker = new CircuitBreaker();
