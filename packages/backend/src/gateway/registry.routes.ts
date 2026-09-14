import { FastifyInstance } from 'fastify';
import { connectorRegistry } from '../registry/connector.registry';
import { prisma } from '../config/db';

export async function registryRoutes(fastify: FastifyInstance) {
  // GET /api/registry/connectors — Lists all active registered connectors
  fastify.get('/connectors', async (_request, reply) => {
    const connectors = await connectorRegistry.getAllConnectors();
    return reply.send({
      count: connectors.length,
      connectors,
    });
  });

  // GET /api/registry/connectors/:slug — Get connector by slug
  fastify.get('/connectors/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const connector = await connectorRegistry.getConnector(slug);
    if (!connector) {
      return reply.code(404).send({ error: `Connector '${slug}' not found` });
    }
    return reply.send(connector);
  });

  // GET /api/registry/services — Lists all active service definitions
  fastify.get('/services', async (_request, reply) => {
    const services = await connectorRegistry.getAllServices();
    return reply.send({
      count: services.length,
      services,
    });
  });

  // GET /api/registry/services/:serviceType — Get service definition by type
  fastify.get('/services/:serviceType', async (request, reply) => {
    const { serviceType } = request.params as { serviceType: string };
    const service = await connectorRegistry.getServiceDefinition(serviceType.toUpperCase());
    if (!service) {
      return reply.code(404).send({ error: `Service definition '${serviceType}' not found` });
    }
    return reply.send(service);
  });

  // POST /api/registry/connectors — Register / Onboard a new connector (Admin only)
  fastify.post<{
    Body: {
      slug: string;
      category: any;
      baseUrl: string;
      authMethod?: any;
      authConfig?: Record<string, any>;
      fieldSchema?: Record<string, any>;
      timeoutMs?: number;
      maxRetries?: number;
      isActive?: boolean;
      skipHealthCheck?: boolean;
    };
  }>('/connectors', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const user = request.user as any;
    if (user?.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'Admin role required' });
    }

    const {
      slug,
      category,
      baseUrl,
      authMethod = 'NONE',
      authConfig = {},
      fieldSchema = {},
      timeoutMs = 5000,
      maxRetries = 3,
      isActive = true,
      skipHealthCheck = false,
    } = request.body || {};

    if (!slug || !category || !baseUrl) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'slug, category, and baseUrl are required',
      });
    }

    // Ping connector health endpoint
    if (!skipHealthCheck) {
      try {
        const healthUrl = `${baseUrl.replace(/\/$/, '')}/health`;
        const res = await fetch(healthUrl, {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
          return reply.status(400).send({
            error: 'CONNECTOR_HEALTH_CHECK_FAILED',
            message: `Health check at ${healthUrl} returned HTTP ${res.status}`,
          });
        }
      } catch (hErr: any) {
        return reply.status(400).send({
          error: 'CONNECTOR_HEALTH_CHECK_FAILED',
          message: `Could not reach health check at ${baseUrl}/health: ${hErr.message}`,
        });
      }
    }

    const mergedAuthConfig = {
      ...(typeof authConfig === 'object' && authConfig !== null ? authConfig : {}),
      timeoutMs,
      maxRetries,
    };

    const manifest = await prisma.connectorManifest.upsert({
      where: { slug },
      create: {
        slug,
        category,
        baseUrl,
        authMethod: String(authMethod).toLowerCase(),
        authConfig: mergedAuthConfig,
        fieldSchema: fieldSchema || {},
        isActive,
      },
      update: {
        category,
        baseUrl,
        authMethod: String(authMethod).toLowerCase(),
        authConfig: mergedAuthConfig,
        fieldSchema: fieldSchema || {},
        isActive,
      },
    });

    // Invalidate in-memory connector registry cache
    connectorRegistry.invalidateCache();

    return reply.status(201).send(manifest);
  });
}
