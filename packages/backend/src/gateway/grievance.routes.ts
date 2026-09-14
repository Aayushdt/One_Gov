import { FastifyInstance } from 'fastify';
import { grievanceService } from '../grievances/grievance.service';

export async function grievanceRoutes(app: FastifyInstance) {
  // POST /api/grievances — citizen flags an audit log entry
  app.post<{
    Body: {
      auditEntryId: string;
      reason: string;
    };
  }>('/', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const citizenId = (request.user as any)?.citizenId;
    const { auditEntryId, reason } = request.body || {};

    if (!auditEntryId || !reason?.trim()) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'auditEntryId and reason are required',
      });
    }

    try {
      const grievance = await grievanceService.flagEntry({
        auditEntryId,
        citizenId,
        reason: reason.trim(),
      });
      return reply.status(201).send(grievance);
    } catch (err: any) {
      return reply.status(400).send({ error: 'FLAGGING_FAILED', message: err.message });
    }
  });

  // GET /api/grievances — list grievances (filtered for citizen or all for admin)
  app.get<{
    Querystring: {
      status?: string;
    };
  }>('/', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const user = request.user as any;
    const isAdmin = user?.role === 'ADMIN';

    const filter: { citizenId?: string; status?: string } = {};
    if (!isAdmin) {
      filter.citizenId = user.citizenId;
    }
    if (request.query.status) {
      filter.status = request.query.status;
    }

    const grievances = await grievanceService.listGrievances(filter);
    return reply.send({ grievances });
  });

  // PATCH /api/grievances/:id — admin resolves or dismisses grievance
  app.patch<{
    Params: { id: string };
    Body: { status: string; adminNote?: string };
  }>('/:id', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const user = request.user as any;
    if (user?.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'Admin role required' });
    }

    const { status, adminNote } = request.body || {};
    if (!status) {
      return reply.status(400).send({ error: 'BAD_REQUEST', message: 'status is required' });
    }

    try {
      const updated = await grievanceService.resolveFlag(request.params.id, status, adminNote);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: 'UPDATE_FAILED', message: err.message });
    }
  });
}
