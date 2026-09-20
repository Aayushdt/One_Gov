import { FastifyInstance } from 'fastify';
import { DataCategory } from '@prisma/client';
import { consentService } from '../consent/consent.service';
import { auditService } from '../audit/audit.service';
import { workflowEngine } from '../workflow/engine';
import { prisma } from '../config/db';

export async function consentRoutes(app: FastifyInstance) {
  // Grant consent for a run
  app.post<{
    Body: {
      runId: string;
      categories: DataCategory[];
      purpose?: string;
      requestedBy?: string;
      durationHours?: number;
      maxUses?: number;
      guardianId?: string;
    };
  }>('/grant', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const user = req.user as any;
    let citizenId = user.citizenId;
    const { runId, categories, durationHours = 24, maxUses, guardianId } = req.body;

    // Guardian Consent check (Item 2)
    if (guardianId) {
      if (user.citizenId !== guardianId && !user.guardian_for?.includes(citizenId)) {
        return reply.status(403).send({ error: 'UNAUTHORIZED_GUARDIAN', message: 'You do not have guardian permission for this citizen' });
      }
    }

    // Resolve serviceType from the workflow run for accurate purpose labelling
    const workflowRun = await prisma.workflowRun.findUnique({
      where: { id: runId },
      select: { serviceType: true, citizenId: true },
    });
    const serviceType = workflowRun?.serviceType ?? 'SCHOLARSHIP';

    // Task 27: Ownership check — caller must own the workflow run (or be ADMIN)
    if (workflowRun && workflowRun.citizenId !== user.citizenId && user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'You do not own this workflow run.' });
    }

    if (workflowRun?.citizenId) {
      citizenId = workflowRun.citizenId;
    }

    const PURPOSE_MAP: Record<string, string> = {
      SCHOLARSHIP: 'Scholarship: National Merit STEM Fellowship Application 2025',
      TRANSPORT: 'Transport: Commercial Transport Fast-Pass Authorization',
      WELFARE: 'Welfare: Social Security & Direct Benefit Transfer Registration',
    };
    const REQUESTER_MAP: Record<string, string> = {
      SCHOLARSHIP: 'scholarship-service',
      TRANSPORT: 'transport-permit-service',
      WELFARE: 'welfare-benefit-service',
    };

    const purpose = req.body.purpose ?? PURPOSE_MAP[serviceType] ?? PURPOSE_MAP.SCHOLARSHIP;
    const requestedBy = req.body.requestedBy ?? REQUESTER_MAP[serviceType] ?? REQUESTER_MAP.SCHOLARSHIP;

    const artefacts = await consentService.grantConsent({
      runId,
      citizenId,
      purpose,
      categories,
      requestedBy,
      durationHours,
      maxUses: typeof maxUses === 'number' ? maxUses : null,
      guardianId: guardianId ?? null,
    });

    await auditService.log({
      citizenId,
      eventType: 'CONSENT_GRANTED',
      actor: user.citizenId,
      payload: {
        runId,
        categories,
        purpose,
        serviceType,
        maxUses: maxUses ?? null,
        guardianId: guardianId ?? null,
        expiresAt: artefacts[0]?.expiresAt,
      },
    });

    // Advance workflow now that consent is granted
    workflowEngine.advance(runId).catch(console.error);

    return { artefacts };
  });

  // Renew consent endpoint (Item 2 Step 4)
  app.post<{ Params: { runId: string }; Body: { extensionHours?: number } }>('/run/:runId/renew', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const { citizenId } = req.user as any;
    const { runId } = req.params;
    const { extensionHours = 24 } = req.body ?? {};

    const result = await consentService.renewConsent(runId, citizenId, extensionHours);
    await auditService.log({
      citizenId,
      eventType: 'CONSENT_GRANTED',
      actor: citizenId,
      payload: { runId, action: 'RENEW', extensionHours, expiresAt: result.expiresAt.toISOString() },
    });

    return reply.send({ success: true, ...result });
  });

  // Get all consent artefacts for citizen (Item 3)
  app.get('/citizen', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const { citizenId } = req.user as any;
    const artefacts = await consentService.getAllCitizenConsents(citizenId);
    return reply.send({ artefacts });
  });

  // Task 28: Get consent status for a run — restricted to run owner or ADMIN
  app.get<{ Params: { runId: string } }>('/run/:runId', async (req, reply) => {
    try { await req.jwtVerify(); } catch { return reply.status(401).send({ error: 'UNAUTHORIZED' }); }
    const { citizenId, role } = req.user as any;

    // Verify ownership before returning consent artefacts
    const run = await prisma.workflowRun.findUnique({
      where: { id: req.params.runId },
      select: { citizenId: true },
    });
    if (!run) return reply.status(404).send({ error: 'NOT_FOUND' });
    if (run.citizenId !== citizenId && role !== 'ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' });
    }

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

