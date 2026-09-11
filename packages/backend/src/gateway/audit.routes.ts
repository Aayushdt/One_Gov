import { FastifyInstance } from 'fastify';
import { auditService } from '../audit/audit.service';
import { prisma } from '../config/db';

export async function auditRoutes(app: FastifyInstance) {
  // Get audit trail
  app.get<{ Params: { citizenId: string } }>('/:citizenId', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const me = req.user as any;
    if (me.citizenId !== req.params.citizenId) return reply.status(403).send({ error: 'FORBIDDEN' });
    const entries = await auditService.getTrail(req.params.citizenId);
    return { entries };
  });

  // Verify chain integrity
  app.get<{ Params: { citizenId: string } }>('/:citizenId/verify', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const me = req.user as any;
    if (me.citizenId !== req.params.citizenId) return reply.status(403).send({ error: 'FORBIDDEN' });
    const result = await auditService.verifyChain(req.params.citizenId);
    return result;
  });

  // Tamper demo endpoint
  app.post<{ Params: { citizenId: string } }>('/:citizenId/tamper', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const me = req.user as any;
    if (me.citizenId !== req.params.citizenId) return reply.status(403).send({ error: 'FORBIDDEN' });
    const result = await auditService.tamperEntry(req.params.citizenId);
    return result;
  });

  // Restore chain endpoint
  app.post<{ Params: { citizenId: string } }>('/:citizenId/restore', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const me = req.user as any;
    if (me.citizenId !== req.params.citizenId) return reply.status(403).send({ error: 'FORBIDDEN' });
    const result = await auditService.restoreChain(req.params.citizenId);
    return result;
  });
}
