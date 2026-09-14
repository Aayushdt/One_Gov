import { FastifyInstance } from 'fastify';
import { prisma } from '../config/db';
import { workflowEngine } from '../workflow/engine';
import { WorkflowState } from '@prisma/client';

export async function workflowRoutes(app: FastifyInstance) {
  // Start a new workflow run
  app.post<{ Body: { serviceType?: string } }>('/start', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const { citizenId } = req.user as any;
    const { serviceType = 'SCHOLARSHIP' } = req.body ?? {};

    const run = await prisma.workflowRun.create({
      data: {
        citizenId,
        serviceType,
        state: WorkflowState.AWAITING_CONSENT,
      },
    });

    return { runId: run.id, serviceType: run.serviceType };
  });

  // Get all workflow runs for citizen (Item 4)
  app.get('/citizen', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const { citizenId } = req.user as any;
    const runs = await prisma.workflowRun.findMany({
      where: { citizenId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        serviceType: true,
        state: true,
        eligibleResult: true,
        failureReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { runs };
  });

  // Get workflow status
  app.get<{ Params: { runId: string } }>('/:runId', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const run = await prisma.workflowRun.findUnique({
      where: { id: req.params.runId },
      include: {
        consents: true,
        stateHistory: { orderBy: { occurredAt: 'asc' } },
        citizen: {
          select: {
            id: true,
            onegovId: true,
            name: true,
            state: true,
            district: true,
            pincode: true,
            identityMap: true,
          }
        }
      },
    });
    if (!run) return reply.status(404).send({ error: 'NOT_FOUND' });
    return run;
  });

  // Advance workflow after consent granted
  app.post<{ Params: { runId: string } }>('/:runId/advance', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const run = await prisma.workflowRun.findUnique({ where: { id: req.params.runId } });
    if (!run) return reply.status(404).send({ error: 'NOT_FOUND' });

    // Fire and forget — client polls for updates
    workflowEngine.advance(run.id).catch(console.error);
    return { message: 'workflow_advancing' };
  });
}
