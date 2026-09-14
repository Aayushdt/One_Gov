import { FastifyInstance } from 'fastify';
import IORedis from 'ioredis';
import { notificationService } from '../notifications/notification.service';

export async function notificationRoutes(app: FastifyInstance) {
  // GET /api/notifications/stream (Server-Sent Events)
  app.get('/stream', async (request, reply) => {
    let citizenId: string | null = null;
    const authHeader = request.headers.authorization;
    const tokenQuery = (request.query as any)?.token;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : tokenQuery;

    if (token) {
      try {
        const decoded = app.jwt.verify(token) as any;
        citizenId = decoded?.citizenId;
      } catch {
        // invalid token
      }
    }

    if (!citizenId) {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    // Prepare SSE connection
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');
    if (typeof reply.raw.flushHeaders === 'function') {
      reply.raw.flushHeaders();
    }

    reply.raw.write(': connected\n\n');

    const subscriber = new IORedis(process.env.REDIS_URL ?? 'redis://redis:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    const channel = `govlink:notifications:${citizenId}`;

    await subscriber.subscribe(channel).catch(() => {});

    subscriber.on('message', (_chan, message) => {
      try {
        reply.raw.write(`data: ${message}\n\n`);
      } catch {}
    });

    const pingInterval = setInterval(() => {
      try {
        reply.raw.write(': ping\n\n');
      } catch {}
    }, 15000);

    request.raw.on('close', async () => {
      clearInterval(pingInterval);
      try {
        await subscriber.unsubscribe(channel).catch(() => {});
        await subscriber.quit().catch(() => {});
      } catch {}
    });
  });
  // GET /api/notifications
  app.get<{
    Querystring: { unreadOnly?: string; limit?: string };
  }>('/', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const citizenId = (request.user as any)?.citizenId;
    if (!citizenId) {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const { unreadOnly, limit } = request.query;
    const notifications = await notificationService.getCitizenNotifications(citizenId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : 50,
    });
    const unreadCount = await notificationService.getUnreadCount(citizenId);

    return reply.send({ notifications, unreadCount });
  });

  // PATCH /api/notifications/:id/read
  app.patch<{
    Params: { id: string };
  }>('/:id/read', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const citizenId = (request.user as any)?.citizenId;
    if (!citizenId) {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const { id } = request.params;
    await notificationService.markRead(id, citizenId);

    return reply.send({ success: true });
  });

  // PATCH /api/notifications/read-all
  app.patch('/read-all', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const citizenId = (request.user as any)?.citizenId;
    if (!citizenId) {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    await notificationService.markAllRead(citizenId);

    return reply.send({ success: true });
  });

  // POST /api/notifications/test-scan (admin / trigger check)
  app.post('/test-scan', async (request, reply) => {
    const result = await notificationService.checkAndNotifyExpiringConsents();
    return reply.send(result);
  });
}
