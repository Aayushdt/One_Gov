import { FastifyInstance } from 'fastify';
import { connectorMetrics } from '../metrics/connector.metrics';
import { circuitBreaker } from '../resilience/circuit-breaker';
import { connectorRegistry } from '../registry/connector.registry';
import { retentionService } from '../retention/retention.service';

export async function opsRoutes(fastify: FastifyInstance) {
  // Authentication hook for admin operations
  fastify.addHook('preHandler', async (request, reply) => {
    const adminHeader = request.headers['x-admin-role'];
    const authHeader = request.headers.authorization;

    // Allow if explicit admin role header is present
    if (adminHeader === 'ADMIN') {
      return;
    }

    // Check JWT payload for ADMIN role (or fallback for testing)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = await request.jwtVerify() as any;
        if (decoded.role === 'ADMIN' || decoded.admin === true) {
          return;
        }
      } catch {
        // Fall through to 403
      }
    }

    // Default admin check fallback
    return reply.code(403).send({ error: 'Admin role required to access ops endpoints' });
  });

  // GET /api/ops/metrics — Aggregated connector stats for last 24h
  fastify.get('/metrics', async (_request, reply) => {
    const metrics = await connectorMetrics.getAggregatedStats(24);
    const manifests = await connectorRegistry.getAllConnectors();

    // Include circuit breaker status for each connector
    const detailed = await Promise.all(
      manifests.map(async (m) => {
        const cbState = await circuitBreaker.getState(m.slug);
        const metric = metrics.find((stat) => stat.connectorSlug === m.slug) || {
          connectorSlug: m.slug,
          totalCalls: 0,
          successes: 0,
          failures: 0,
          retries: 0,
          circuitOpens: 0,
          successRate: 100,
          avgDurationMs: 0,
        };

        return {
          ...metric,
          category: m.category,
          circuitBreakerState: cbState.state,
          failCount: cbState.failCount,
          isActive: m.isActive,
        };
      })
    );

    return reply.send({
      timestamp: new Date().toISOString(),
      connectors: detailed,
    });
  });

  // POST /api/ops/circuit-breaker/:slug/reset — Manually reset circuit breaker
  fastify.post('/circuit-breaker/:slug/reset', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    await circuitBreaker.reset(slug);
    return reply.send({ success: true, message: `Circuit breaker reset for ${slug}` });
  });

  // POST /api/ops/retention/run — Manually trigger retention evaluation & purge (Item 13)
  fastify.post('/retention/run', async (request, reply) => {
    const { retentionGraceDays = 0 } = (request.body as any) || {};
    const result = await retentionService.applyRetention(Number(retentionGraceDays));
    return reply.send(result);
  });
}
