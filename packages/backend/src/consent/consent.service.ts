import { DataCategory, ConsentStatus } from '@prisma/client';
import { prisma } from '../config/db';
import { notificationService } from '../notifications/notification.service';

export class ConsentService {
  /**
   * Grants consent for specified categories.
   * Supports optional maxUses (single-use or scoped consent) and guardianId (guardian consent).
   */
  async grantConsent(params: {
    runId: string;
    citizenId: string;
    purpose: string;
    categories: DataCategory[];
    requestedBy: string;
    durationHours: number;
    maxUses?: number | null;
    guardianId?: string | null;
  }) {
    const expiresAt = new Date(Date.now() + params.durationHours * 60 * 60 * 1000);

    return prisma.$transaction(
      params.categories.map((category) =>
        prisma.consentArtefact.upsert({
          where: { workflowRunId_category: { workflowRunId: params.runId, category } },
          create: {
            citizenId: params.citizenId,
            category,
            purpose: params.purpose,
            requestedBy: params.requestedBy,
            grantedAt: new Date(),
            expiresAt,
            status: ConsentStatus.ACTIVE,
            workflowRunId: params.runId,
            maxUses: params.maxUses ?? null,
            useCount: 0,
            guardianId: params.guardianId ?? null,
          },
          update: {
            status: ConsentStatus.ACTIVE,
            grantedAt: new Date(),
            expiresAt,
            revokedAt: null,
            maxUses: params.maxUses ?? null,
            useCount: 0,
            guardianId: params.guardianId ?? null,
          },
        })
      )
    );
  }

  /**
   * Checks whether consent is active and atomically increments useCount.
   * Concurrency-safe: uses atomic UPDATE ... RETURNING to prevent race conditions on maxUses.
   */
  async checkActive(
    runId: string,
    category: DataCategory
  ): Promise<{ allowed: boolean; artefactId?: string; reason?: string; artefact?: any }> {
    // Atomic update incrementing useCount if active, not expired, and within maxUses
    const updatedRows: any[] = await prisma.$queryRawUnsafe(
      `UPDATE "ConsentArtefact"
       SET "useCount" = "useCount" + 1
       WHERE "workflowRunId" = $1
         AND "category"::text = $2
         AND "status" = 'ACTIVE'
         AND "expiresAt" > NOW()
         AND ("maxUses" IS NULL OR "useCount" < "maxUses")
       RETURNING *;`,
      runId,
      category
    );

    if (updatedRows.length > 0) {
      return { allowed: true, artefactId: updatedRows[0].id, artefact: updatedRows[0] };
    }

    // Zero rows updated: determine the exact cause
    const artefact = await prisma.consentArtefact.findUnique({
      where: { workflowRunId_category: { workflowRunId: runId, category } },
    });

    if (!artefact) {
      return { allowed: false, reason: 'NO_CONSENT_RECORD' };
    }
    if (artefact.status === ConsentStatus.REVOKED) {
      return { allowed: false, reason: 'CONSENT_REVOKED' };
    }
    if (artefact.status === ConsentStatus.EXPIRED || artefact.expiresAt <= new Date()) {
      if (artefact.status !== ConsentStatus.EXPIRED) {
        await prisma.consentArtefact.update({
          where: { id: artefact.id },
          data: { status: ConsentStatus.EXPIRED },
        });
      }
      return { allowed: false, reason: 'CONSENT_EXPIRED' };
    }
    if (artefact.maxUses !== null && artefact.useCount >= artefact.maxUses) {
      return { allowed: false, reason: 'USE_LIMIT_REACHED' };
    }

    return { allowed: false, reason: 'CONSENT_INACTIVE' };
  }

  /**
   * Purpose Binding (Item 2): Validates that the caller's purpose matches the consented purpose.
   */
  async checkPurposeBound(
    runId: string,
    category: DataCategory,
    callerPurpose: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const artefact = await prisma.consentArtefact.findUnique({
      where: { workflowRunId_category: { workflowRunId: runId, category } },
    });

    if (!artefact) {
      return { allowed: false, reason: 'NO_CONSENT_RECORD' };
    }

    // Consented purpose check: normalized comparison
    const consented = (artefact.purpose || '').trim().toLowerCase();
    const caller = (callerPurpose || '').trim().toLowerCase();

    const SERVICE_SYNONYMS: Record<string, string[]> = {
      scholarship: ['scholarship', 'stem fellowship', 'national merit', 'fellowship', 'academic'],
      transport: ['transport', 'fast-pass', 'commercial transport', 'rto', 'driving'],
      welfare: ['welfare', 'social security', 'direct benefit', 'pds', 'subsidy'],
    };

    const synonyms = SERVICE_SYNONYMS[caller] || [caller];
    const matches =
      consented === caller ||
      consented.includes(caller) ||
      caller.includes(consented) ||
      synonyms.some((s) => consented.includes(s));

    if (!matches) {
      return {
        allowed: false,
        reason: `PURPOSE_MISMATCH: Consented for '${artefact.purpose}' but caller requested '${callerPurpose}'`,
      };
    }

    return { allowed: true };
  }

  /**
   * Renews consent by extending expiresAt without revoking.
   * Also triggers CONSENT_EXPIRING notification stub if within 7 days.
   */
  async renewConsent(runId: string, citizenId: string, extensionHours = 24) {
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + extensionHours * 60 * 60 * 1000);

    const updated = await prisma.consentArtefact.updateMany({
      where: { workflowRunId: runId, citizenId },
      data: {
        status: ConsentStatus.ACTIVE,
        expiresAt: newExpiresAt,
        revokedAt: null,
      },
    });

    // Check if within 7 days of expiry and trigger notification stub
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (newExpiresAt.getTime() - now.getTime() <= sevenDaysMs) {
      await notificationService.createNotification({
        citizenId,
        type: 'CONSENT_EXPIRING_SOON',
        title: 'Consent Validity Extended',
        body: `Your consent for workflow ${runId} was extended until ${newExpiresAt.toISOString()}`,
        metadata: { runId, expiresAt: newExpiresAt.toISOString() },
      });
    }

    return { count: updated.count, expiresAt: newExpiresAt };
  }

  /**
   * Revokes active consent for a workflow run.
   */
  async revokeConsent(runId: string, citizenId: string, category?: DataCategory) {
    const now = new Date();
    if (category) {
      await prisma.consentArtefact.updateMany({
        where: { workflowRunId: runId, citizenId, category, status: ConsentStatus.ACTIVE },
        data: { status: ConsentStatus.REVOKED, revokedAt: now },
      });
    } else {
      await prisma.consentArtefact.updateMany({
        where: { workflowRunId: runId, citizenId, status: ConsentStatus.ACTIVE },
        data: { status: ConsentStatus.REVOKED, revokedAt: now },
      });
    }

    try {
      await notificationService.emitNotification({
        citizenId,
        type: 'CONSENT_REVOKED',
        title: category ? `Consent Revoked: ${category}` : 'All Consents Revoked',
        body: `You have successfully revoked consent for ${category ?? 'all categories'} on application run ${runId.slice(0, 8)}...`,
        metadata: { runId, category },
      });
    } catch (e) {
      console.error('[ConsentService] Failed to emit revocation notification:', e);
    }
  }

  /**
   * Gets consent status for all categories in a workflow run.
   */
  async getConsentStatus(runId: string) {
    return prisma.consentArtefact.findMany({
      where: { workflowRunId: runId },
      orderBy: { category: 'asc' },
    });
  }

  /**
   * Lists all consent artefacts for a citizen across all workflow runs (Item 3).
   */
  async getAllCitizenConsents(citizenId: string) {
    return prisma.consentArtefact.findMany({
      where: { citizenId },
      include: {
        workflowRun: {
          select: {
            serviceType: true,
            createdAt: true,
            state: true,
          },
        },
      },
      orderBy: { grantedAt: 'desc' },
    });
  }
}

export const consentService = new ConsentService();
