import { FastifyInstance } from 'fastify';
import { prisma } from '../config/db';
import { certificateService } from '../certificates/certificate.service';

export async function certificateRoutes(app: FastifyInstance) {
  // Task 30: POST /api/certificate/:runId/issue — restricted to run owner or ADMIN
  app.post<{ Params: { runId: string } }>('/:runId/issue', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const me = request.user as any;

    // Ownership check: only the run owner or an ADMIN may issue a certificate
    const run = await prisma.workflowRun.findUnique({
      where: { id: request.params.runId },
      select: { citizenId: true },
    });
    if (!run) return reply.status(404).send({ error: 'NOT_FOUND' });
    if (run.citizenId !== me.citizenId && me.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' });
    }

    try {
      const result = await certificateService.issue(request.params.runId);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: 'ISSUE_FAILED', message: err.message });
    }
  });

  // Task 29: GET /api/certificate/:runId — restricted to run owner or ADMIN
  app.get<{ Params: { runId: string } }>('/:runId', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const me = request.user as any;

    const result = await certificateService.getByRunId(request.params.runId);
    if (!result) {
      return reply.status(404).send({ error: 'CERTIFICATE_NOT_FOUND' });
    }

    // Ownership check: only the certificate owner or an ADMIN may view
    const cert = result.certificate as any;
    if (cert.citizenId !== me.citizenId && me.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' });
    }

    return reply.send(result);
  });

  // GET /api/certificate/public/verify (public verification endpoint — no auth required)
  app.get<{ Querystring: { token: string } }>('/public/verify', async (request, reply) => {
    const { token } = request.query;
    if (!token) {
      return reply.status(400).send({ valid: false, reason: 'TOKEN_REQUIRED' });
    }

    const result = await certificateService.verify(token);
    return reply.send(result);
  });
}
