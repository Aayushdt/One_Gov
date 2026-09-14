import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import IORedis from 'ioredis';
import { ConnectorRateLimiter, RateLimitError } from '../rate-limiter';
import { ConnectorRunner } from '../../connectors/runner';
import { consentService } from '../../consent/consent.service';
import { auditService } from '../../audit/audit.service';
import { DataCategory } from '@prisma/client';

describe('Rate Limiter & API Key Injection Unit Tests', () => {
  let redis: IORedis;
  const testSlug = 'rate-limit-test-slug';

  before(() => {
    redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
    auditService.log = (async () => ({} as any)) as any;
    consentService.checkActive = async () => ({ allowed: true });
  });

  after(async () => {
    if (redis) {
      await redis.del(`govlink:rl:${testSlug}:citizen-rl-test`);
      await redis.quit();
    }
  });

  it('Rate Limiting: allows calls within threshold and denies calls beyond limit', async () => {
    await redis.del(`govlink:rl:${testSlug}:citizen-rl-test`);
    const limiter = new ConnectorRateLimiter(redis);

    // Limit 3 requests in 10-second window
    const r1 = await limiter.checkAndConsume(testSlug, 'citizen-rl-test', 3, 10);
    assert.strictEqual(r1.allowed, true);

    const r2 = await limiter.checkAndConsume(testSlug, 'citizen-rl-test', 3, 10);
    assert.strictEqual(r2.allowed, true);

    const r3 = await limiter.checkAndConsume(testSlug, 'citizen-rl-test', 3, 10);
    assert.strictEqual(r3.allowed, true);

    // 4th call should be blocked
    const r4 = await limiter.checkAndConsume(testSlug, 'citizen-rl-test', 3, 10);
    assert.strictEqual(r4.allowed, false, 'Call exceeding limit must not be allowed');
    assert.ok(r4.retryAfterMs && r4.retryAfterMs > 0);
  });

  it('API Key Header Injection: outbound fetch receives configured apiKey and headerName', async () => {
    let capturedHeaders: any = null;
    const originalFetch = global.fetch;

    global.fetch = async (_url: any, options: any) => {
      capturedHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          source: 'TEST',
          verified: true,
          fullName: 'Test User',
          dateOfBirth: '2000-01-01',
          gender: 'MALE',
          maskedId: 'XXXX-1234',
          docType: 'AADHAAR',
        }),
      } as any;
    };

    const manifestWithApiKey: any = {
      id: 'm-key',
      slug: 'identity-with-key',
      category: DataCategory.IDENTITY,
      baseUrl: 'http://mock-identity:4001',
      authMethod: 'api-key',
      authConfig: {
        apiKey: 'secret-govlink-token-123',
        headerName: 'X-Custom-Gov-Key',
        pathTemplate: '/citizens/:id',
      },
      fieldSchema: { type: 'object', required: ['verified'] },
      isActive: true,
    };

    try {
      const runner = new ConnectorRunner(manifestWithApiKey);
      await runner.fetchAndNormalize('CIT-999', 'run-test-key', 'citizen-key-test', 1);

      assert.ok(capturedHeaders, 'Outbound fetch must pass headers');
      assert.strictEqual(capturedHeaders['X-Custom-Gov-Key'], 'secret-govlink-token-123');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
