import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { auditService } from '../audit/audit.service';
import { notificationService } from '../notifications/notification.service';

export class RetentionService {
  /**
   * Evaluates expired/revoked workflow runs and purges departmental snapshot columns
   * in compliance with DPDP data minimization and retention rules.
   *
   * Appeal-aware (Item 13b):
   * Excludes any workflow run that has an active/pending Appeal (SUBMITTED or UNDER_REVIEW).
   */
  async applyRetention(retentionGraceDays = 0) {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - retentionGraceDays * 24 * 60 * 60 * 1000);

    // 1. Find candidates: Workflow runs not yet purged
    const candidates = await prisma.workflowRun.findMany({
      where: {
        retentionAppliedAt: null,
        // The run has at least one expired or revoked consent artefact, or was completed before cutoff
        OR: [
          {
            consents: {
              some: {
                OR: [
                  { status: 'REVOKED' },
                  { status: 'EXPIRED' },
                  { expiresAt: { lte: cutoffDate } },
                ],
              },
            },
          },
          {
            state: { in: ['SUBMITTED', 'FAILED'] },
            updatedAt: { lte: cutoffDate },
          },
        ],
      },
      include: {
        appeals: {
          where: {
            status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
          },
        },
        citizen: {
          select: { id: true, name: true },
        },
      },
    });

    // 2. Filter out any run with pending appeals (Item 13b appeal-exclusion clause)
    const eligibleRuns = candidates.filter((run) => run.appeals.length === 0);

    const cleanedRunIds: string[] = [];

    for (const run of eligibleRuns) {
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          identitySnapshot: Prisma.DbNull,
          educationSnapshot: Prisma.DbNull,
          incomeSnapshot: Prisma.DbNull,
          transportSnapshot: Prisma.DbNull,
          policeSnapshot: Prisma.DbNull,
          bankingSnapshot: Prisma.DbNull,
          welfareSnapshot: Prisma.DbNull,
          municipalSnapshot: Prisma.DbNull,
          retentionAppliedAt: now,
        },
      });

      cleanedRunIds.push(run.id);

      // Log in audit trail (PII-free)
      await auditService
        .log({
          citizenId: run.citizenId,
          eventType: 'DATA_ACCESSED',
          actor: 'SYSTEM_RETENTION_WORKER',
          payload: {
            action: 'RETENTION_PURGE_SNAPSHOTS',
            runId: run.id,
            serviceType: run.serviceType,
            purgedAt: now.toISOString(),
          },
        })
        .catch(() => {});

      // Notify citizen (Item 5 integration)
      try {
        await notificationService.emitNotification({
          citizenId: run.citizenId,
          type: 'RETENTION_APPLIED',
          title: 'Data Retention & Minimization Applied',
          body: `Departmental verification snapshots for ${run.serviceType} (run ${run.id.slice(0, 8)}) have been purged in accordance with DPDP retention policies.`,
          metadata: { runId: run.id },
        });
      } catch (err) {
        console.error('[RetentionService] Failed to notify citizen:', err);
      }
    }

    return {
      candidatesEvaluated: candidates.length,
      excludedDueToAppeals: candidates.length - eligibleRuns.length,
      cleanedRunsCount: cleanedRunIds.length,
      cleanedRunIds,
      executedAt: now.toISOString(),
    };
  }
}

export const retentionService = new RetentionService();
