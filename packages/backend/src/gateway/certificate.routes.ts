import { FastifyInstance } from 'fastify';
import { certificateService } from '../certificates/certificate.service';

export async function certificateRoutes(app: FastifyInstance) {
  // POST /api/certificate/:runId/issue
  app.post<{ Params: { runId: string } }>('/:runId/issue', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    try {
      const result = await certificateService.issue(request.params.runId);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: 'ISSUE_FAILED', message: err.message });
    }
  });

  // GET /api/certificate/:runId
  app.get<{ Params: { runId: string } }>('/:runId', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' });
    }

    const result = await certificateService.getByRunId(request.params.runId);
    if (!result) {
      return reply.status(404).send({ error: 'CERTIFICATE_NOT_FOUND' });
    }

    return reply.send(result);
  });

  // GET /api/verify/certificate (public verification endpoint)
  app.get<{ Querystring: { token: string } }>('/public/verify', async (request, reply) => {
    const { token } = request.query;
    if (!token) {
      return reply.status(400).send({ valid: false, reason: 'TOKEN_REQUIRED' });
    }

    const result = await certificateService.verify(token);
    return reply.send(result);
  });
}
