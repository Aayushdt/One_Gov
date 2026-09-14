import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import IORedis from 'ioredis';
import { CircuitBreaker, CircuitBreakerOpenError } from '../../../backend/src/resilience/circuit-breaker';

describe('Circuit Breaker Concurrency Tests', () => {
  let redis: IORedis;
  const testSlug = 'test-revenue-slug';

  before(() => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  });

  after(async () => {
    if (redis) {
      await redis.del(`govlink:cb:${testSlug}`);
      await redis.del(`govlink:cb:${testSlug}:probe_lock`);
      await redis.quit();
    }
  });

  it('1. Probe Race Test: exactly one probe reaches upstream in half-open window, 2nd fails fast', async () => {
    // Reset any existing test key
    await redis.del(`govlink:cb:${testSlug}`);
    await redis.del(`govlink:cb:${testSlug}:probe_lock`);

    // Use a short reset timeout of 100ms for test speed
    const cb = new CircuitBreaker({
      failureThreshold: 2,
      resetTimeoutMs: 100,
      redisClient: redis,
    });

    // 1. Force failure past threshold to OPEN circuit
    try {
      await cb.call(testSlug, async () => { throw new Error('First failure'); });
    } catch {}
    try {
      await cb.call(testSlug, async () => { throw new Error('Second failure - trips circuit'); });
    } catch {}

    const stateAfterTrip = await cb.getState(testSlug);
    assert.strictEqual(stateAfterTrip.state, 'open', 'Circuit should be OPEN after threshold failures');

    // 2. Wait for the resetTimeout to elapse into the half-open window
    await new Promise((r) => setTimeout(r, 120));

    // 3. Fire two retry jobs simultaneously
    let probeCallsToUpstream = 0;
    let fastFailObserved = false;

    const probeFn = async () => {
      probeCallsToUpstream++;
      // Simulate slight network delay during probe
      await new Promise((r) => setTimeout(r, 50));
      return { ok: true };
    };

    const [job1Result, job2Result] = await Promise.allSettled([
      cb.call(testSlug, probeFn),
      cb.call(testSlug, probeFn),
    ]);

    // Check which one succeeded and which one fast-failed
    if (job1Result.status === 'rejected' && job1Result.reason instanceof CircuitBreakerOpenError) {
      fastFailObserved = true;
    }
    if (job2Result.status === 'rejected' && job2Result.reason instanceof CircuitBreakerOpenError) {
      fastFailObserved = true;
    }

    assert.strictEqual(
      probeCallsToUpstream,
      1,
      `Expected exactly 1 probe to reach upstream, but ${probeCallsToUpstream} calls reached it`
    );
    assert.strictEqual(
      fastFailObserved,
      true,
      'Second concurrent job must observe circuit as OPEN and fail fast'
    );
  });

  it('2. Multi-Process State Divergence Test: worker B reads OPEN state set by worker A via Redis', async () => {
    await redis.del(`govlink:cb:${testSlug}`);
    await redis.del(`govlink:cb:${testSlug}:probe_lock`);

    // Simulate two separate worker instances sharing the same Redis
    const workerRedisA = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
    const workerRedisB = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

    const workerA_CB = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 5000, redisClient: workerRedisA });
    const workerB_CB = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 5000, redisClient: workerRedisB });

    try {
      // Worker A experiences failure and opens the circuit
      try {
        await workerA_CB.call(testSlug, async () => {
          throw new Error('Upstream down for Worker A');
        });
      } catch {}

      const stateInRedis = await workerA_CB.getState(testSlug);
      assert.strictEqual(stateInRedis.state, 'open', 'Worker A should have written open state to Redis');

      // Worker B immediately attempts call — must read OPEN state from Redis and not bypass with stale cache
      let workerB_CalledUpstream = false;
      await assert.rejects(
        async () => {
          await workerB_CB.call(testSlug, async () => {
            workerB_CalledUpstream = true;
            return 'should not be reached';
          });
        },
        (err: any) => {
          assert.ok(err instanceof CircuitBreakerOpenError, 'Worker B must receive CircuitBreakerOpenError');
          assert.strictEqual(err.slug, testSlug);
          return true;
        }
      );

      assert.strictEqual(workerB_CalledUpstream, false, 'Worker B must not execute upstream call when circuit is OPEN');
    } finally {
      await workerRedisA.quit();
      await workerRedisB.quit();
    }
  });
});
