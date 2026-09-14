import { FastifyInstance } from 'fastify';
import { appealService } from '../appeals/appeal.service';
import { DataCategory } from '@prisma/client';

export async function appealRoutes(app: FastifyInstance) {
  // POST /api/appeals — citizen submits an appeal
  app.post<{
    Body: {
      runId: string;
      disputedCategory: DataCategory;
      reason: string;
      evidenceUrl?: string;
    };
  }>('/', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const citizenId = (request.user as any)?.citizenId;
    const { runId, disputedCategory, reason, evidenceUrl } = request.body || {};

    if (!runId || !disputedCategory || !reason) {
      return reply.status(400).send({
        error: 'BAD_REQUEST',
        message: 'runId, disputedCategory, and reason are required',
      });
    }

    try {
      const appeal = await appealService.createAppeal({
        runId,
        citizenId,
        disputedCategory,
        reason,
        evidenceUrl,
      });
      return reply.status(201).send(appeal);
    } catch (err: any) {
      return reply.status(400).send({ error: 'APPEAL_CREATION_FAILED', message: err.message });
    }
  });

  // GET /api/appeals — list appeals (filtered for citizen, or admin view)
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

    const appeals = await appealService.listAppeals(filter);
    return reply.send({ appeals });
  });

  // GET /api/appeals/:id — view single appeal
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const user = request.user as any;
    const isAdmin = user?.role === 'ADMIN';

    try {
      const appeal = await appealService.getAppeal(request.params.id, user.citizenId, isAdmin);
      if (!appeal) {
        return reply.status(404).send({ error: 'NOT_FOUND' });
      }
      return reply.send(appeal);
    } catch (err: any) {
      if (err.message === 'Forbidden') {
        return reply.status(403).send({ error: 'FORBIDDEN' });
      }
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: err.message });
    }
  });

  // PATCH /api/appeals/:id/status — admin updates appeal status
  app.patch<{
    Params: { id: string };
    Body: { status: string; adminNote?: string };
  }>('/:id/status', async (request, reply) => {
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
      const updated = await appealService.updateStatus(request.params.id, status, adminNote);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: 'UPDATE_FAILED', message: err.message });
    }
  });

  // POST /api/appeals/:id/rerun — admin triggers workflow re-run on UPHELD appeal
  app.post<{ Params: { id: string } }>('/:id/rerun', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const user = request.user as any;
    if (user?.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'Admin role required' });
    }

    try {
      const result = await appealService.triggerRerun(request.params.id);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: 'RERUN_FAILED', message: err.message });
    }
  });
}
