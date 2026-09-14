import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import { prisma } from './config/db';
import { authRoutes } from './gateway/auth.routes';
import { workflowRoutes } from './gateway/workflow.routes';
import { consentRoutes } from './gateway/consent.routes';
import { auditRoutes } from './gateway/audit.routes';
import { demoRoutes } from './gateway/demo.routes';
import { healthRoutes } from './gateway/health.routes';
import { registryRoutes } from './gateway/registry.routes';
import { opsRoutes } from './gateway/ops.routes';
import { notificationRoutes } from './gateway/notification.routes';
import { certificateRoutes } from './gateway/certificate.routes';
import { exportRoutes } from './gateway/export.routes';
import { appealRoutes } from './gateway/appeal.routes';
import { grievanceRoutes } from './gateway/grievance.routes';
import { certificateService } from './certificates/certificate.service';

const app = Fastify({ logger: { level: 'info' } });

async function bootstrap() {
  await app.register(cors, {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  // Gzip/Brotli compression (Item 6: Low-Bandwidth Tolerance)
  await app.register(compress, { global: true });

  // Global Inbound Rate Limiter (Item 12: 100 req/min per IP)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    allowList: (req) => req.url.startsWith('/health') || req.headers['x-admin-role'] === 'ADMIN',
  });

  await app.register(jwt, { secret: process.env.JWT_SECRET ?? 'govlink_dev_secret' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Public certificate verification route (Item 7)
  app.get<{ Querystring: { token: string } }>('/api/verify/certificate', async (req, reply) => {
    if (!req.query.token) return reply.status(400).send({ valid: false, reason: 'TOKEN_REQUIRED' });
    return certificateService.verify(req.query.token);
  });

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(demoRoutes, { prefix: '/api/auth' });
  await app.register(workflowRoutes, { prefix: '/api/workflow' });
  await app.register(consentRoutes, { prefix: '/api/consent' });
  await app.register(auditRoutes, { prefix: '/api/audit' });
  await app.register(healthRoutes, { prefix: '/api/health' });
  await app.register(registryRoutes, { prefix: '/api/registry' });
  await app.register(opsRoutes, { prefix: '/api/ops' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(certificateRoutes, { prefix: '/api/certificate' });
  await app.register(exportRoutes, { prefix: '/api/export' });
  await app.register(appealRoutes, { prefix: '/api/appeals' });
  await app.register(grievanceRoutes, { prefix: '/api/grievances' });

  // Note: BullMQ worker has been decoupled into standalone worker process (packages/worker)

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Backend ready on port ${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
