import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { prisma } from './config/db';
import { authRoutes } from './gateway/auth.routes';
import { workflowRoutes } from './gateway/workflow.routes';
import { consentRoutes } from './gateway/consent.routes';
import { auditRoutes } from './gateway/audit.routes';
import { startWorker } from './workflow/queue';

const app = Fastify({ logger: { level: 'info' } });

async function bootstrap() {
  await app.register(cors, {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  await app.register(jwt, { secret: process.env.JWT_SECRET ?? 'govlink_dev_secret' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(workflowRoutes, { prefix: '/api/workflow' });
  await app.register(consentRoutes, { prefix: '/api/consent' });
  await app.register(auditRoutes, { prefix: '/api/audit' });

  // Start BullMQ worker
  startWorker();

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`Backend ready on port ${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
