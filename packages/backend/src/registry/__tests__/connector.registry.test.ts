import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ConnectorRegistry } from '../connector.registry';
import { DataCategory } from '@prisma/client';

describe('ConnectorRegistry Unit Tests', () => {
  const mockManifests = [
    {
      id: 'm1',
      slug: 'identity-uidai',
      category: DataCategory.IDENTITY,
      baseUrl: 'http://mock-identity:4001',
      authMethod: 'none',
      authConfig: {},
      fieldSchema: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'm2',
      slug: 'revenue-cbdt',
      category: DataCategory.INCOME,
      baseUrl: 'http://mock-revenue:4003',
      authMethod: 'none',
      authConfig: {},
      fieldSchema: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockService = {
    id: 's1',
    serviceType: 'SCHOLARSHIP',
    displayName: 'STEM Scholarship',
    steps: [],
    eligibilityRules: {},
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('Cache Hit: loads from DB on first call, serves from cache on subsequent call within TTL', async () => {
    let dbCallCount = 0;
    const mockPrisma: any = {
      connectorManifest: {
        findMany: async () => {
          dbCallCount++;
          return mockManifests;
        },
      },
      serviceDefinition: {
        findUnique: async () => mockService,
      },
    };

    const registry = new ConnectorRegistry(mockPrisma, 5000);

    const c1 = await registry.getConnector('identity-uidai');
    assert.strictEqual(c1?.slug, 'identity-uidai');
    assert.strictEqual(dbCallCount, 1, 'First call should query DB');

    const c2 = await registry.getConnector('identity-uidai');
    assert.strictEqual(c2?.slug, 'identity-uidai');
    assert.strictEqual(dbCallCount, 1, 'Second call within TTL should be a cache hit (no new DB call)');
  });

  it('Cache Miss / Expiration: queries DB after TTL expires', async () => {
    let dbCallCount = 0;
    const mockPrisma: any = {
      connectorManifest: {
        findMany: async () => {
          dbCallCount++;
          return mockManifests;
        },
      },
    };

    // Very short TTL of 10ms
    const registry = new ConnectorRegistry(mockPrisma, 10);

    await registry.getConnector('identity-uidai');
    assert.strictEqual(dbCallCount, 1);

    // Wait for TTL to expire
    await new Promise((r) => setTimeout(r, 25));

    await registry.getConnector('identity-uidai');
    assert.strictEqual(dbCallCount, 2, 'Call after TTL expiry should query DB again');
  });

  it('DB-Unavailable Fallback: retains and serves cached manifest if DB query throws', async () => {
    let shouldFail = false;
    const mockPrisma: any = {
      connectorManifest: {
        findMany: async () => {
          if (shouldFail) {
            throw new Error('Connection refused to PostgreSQL');
          }
          return mockManifests;
        },
      },
    };

    // TTL 10ms
    const registry = new ConnectorRegistry(mockPrisma, 10);

    // Populate initial cache
    const initial = await registry.getConnector('revenue-cbdt');
    assert.strictEqual(initial?.slug, 'revenue-cbdt');

    // Wait for TTL expiry
    await new Promise((r) => setTimeout(r, 25));

    // Simulate DB outage
    shouldFail = true;

    // Call should not crash, but return stale cached value
    const fallback = await registry.getConnector('revenue-cbdt');
    assert.strictEqual(fallback?.slug, 'revenue-cbdt', 'Should gracefully fall back to cached data');
  });
});
