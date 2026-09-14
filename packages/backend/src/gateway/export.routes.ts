import { FastifyInstance } from 'fastify';
import { exportService } from '../export/export.service';

export async function exportRoutes(app: FastifyInstance) {
  // POST /api/export/request
  app.post('/request', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const citizenId = (request.user as any)?.citizenId;
    try {
      const result = await exportService.requestExport(citizenId);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({ error: 'EXPORT_FAILED', message: err.message });
    }
  });

  // GET /api/export/my
  app.get('/my', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const citizenId = (request.user as any)?.citizenId;
    const exports = await exportService.listCitizenExports(citizenId);
    return reply.send({ exports });
  });

  // GET /api/export/:exportId
  app.get<{ Params: { exportId: string } }>('/:exportId', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const citizenId = (request.user as any)?.citizenId;
    const exportReq = await exportService.getExport(request.params.exportId, citizenId);
    if (!exportReq) {
      return reply.status(404).send({ error: 'NOT_FOUND' });
    }

    return reply.send(exportReq);
  });

  // GET /api/export/:exportId/download
  app.get<{ Params: { exportId: string } }>('/:exportId/download', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const citizenId = (request.user as any)?.citizenId;
    const exportReq = await exportService.getExport(request.params.exportId, citizenId);
    if (!exportReq || !exportReq.data) {
      return reply.status(404).send({ error: 'EXPORT_DATA_NOT_FOUND' });
    }

    reply.header(
      'Content-Disposition',
      `attachment; filename="onegov-data-export-${exportReq.id.slice(0, 8)}.json"`
    );
    reply.header('Content-Type', 'application/json');
    return reply.send(exportReq.data);
  });
}
