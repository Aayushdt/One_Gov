import { DataCategory, ConsentStatus } from '@prisma/client';
import { prisma } from '../config/db';

class ConsentService {
  async grantConsent(params: {
    runId: string;
    citizenId: string;
    purpose: string;
    categories: DataCategory[];
    requestedBy: string;
    durationHours: number;
  }) {
    const expiresAt = new Date(Date.now() + params.durationHours * 60 * 60 * 1000);

    // Create one row per category in a single transaction
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
          },
          update: {
            status: ConsentStatus.ACTIVE,
            grantedAt: new Date(),
            expiresAt,
            revokedAt: null,
          },
        })
      )
    );
  }

  async checkActive(runId: string, category: DataCategory): Promise<{ allowed: boolean; artefactId?: string; reason?: string }> {
    const artefact = await prisma.consentArtefact.findUnique({
      where: { workflowRunId_category: { workflowRunId: runId, category } },
    });

    if (!artefact) return { allowed: false, reason: 'NO_CONSENT_RECORD' };
    if (artefact.status === ConsentStatus.REVOKED) return { allowed: false, reason: 'CONSENT_REVOKED' };
    if (artefact.status === ConsentStatus.EXPIRED) return { allowed: false, reason: 'CONSENT_EXPIRED' };
    if (artefact.expiresAt < new Date()) {
      await prisma.consentArtefact.update({ where: { id: artefact.id }, data: { status: ConsentStatus.EXPIRED } });
      return { allowed: false, reason: 'CONSENT_EXPIRED' };
    }
    return { allowed: true, artefactId: artefact.id };
  }

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
  }

  async getConsentStatus(runId: string) {
    return prisma.consentArtefact.findMany({ where: { workflowRunId: runId }, orderBy: { category: 'asc' } });
  }
}

export const consentService = new ConsentService();
