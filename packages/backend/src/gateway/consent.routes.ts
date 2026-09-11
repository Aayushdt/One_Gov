import { FastifyInstance } from 'fastify';
import { DataCategory } from '@prisma/client';
import { consentService } from '../consent/consent.service';
import { auditService } from '../audit/audit.service';
import { workflowEngine } from '../workflow/engine';

export async function consentRoutes(app: FastifyInstance) {
  // Grant consent for a run
  app.post<{ Body: { runId: string; categories: DataCategory[]; purpose?: string; requestedBy?: string; durationHours?: number } }>('/grant', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const { citizenId } = req.user as any;
    const { runId, categories, purpose = 'Scholarship Application 2025', requestedBy = 'scholarship-service', durationHours = 24 } = req.body;

    const artefacts = await consentService.grantConsent({ runId, citizenId, purpose, categories, requestedBy, durationHours });
    await auditService.log({ citizenId, eventType: 'CONSENT_GRANTED', actor: citizenId, payload: { runId, categories, purpose, expiresAt: artefacts[0]?.expiresAt } });

    // Advance workflow now that consent is granted
    workflowEngine.advance(runId).catch(console.error);

    return { artefacts };
  });

  // Get consent status for a run
  app.get<{ Params: { runId: string } }>('/run/:runId', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const artefacts = await consentService.getConsentStatus(req.params.runId);
    return { artefacts };
  });

  // Revoke consent (partial or full)
  app.patch<{ Params: { runId: string }; Body: { category?: DataCategory } }>('/run/:runId/revoke', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const { citizenId } = req.user as any;
    const { runId } = req.params;
    const { category } = req.body ?? {};

    await consentService.revokeConsent(runId, citizenId, category);
    await auditService.log({ citizenId, eventType: 'CONSENT_REVOKED', actor: citizenId, payload: { runId, category: category ?? 'ALL', revokedAt: new Date().toISOString() } });

    return { message: 'consent_revoked', category: category ?? 'ALL' };
  });
}
