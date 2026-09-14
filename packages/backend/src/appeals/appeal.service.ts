import { prisma } from '../config/db';
import { DataCategory } from '@prisma/client';
import { notificationService } from '../notifications/notification.service';
import { certificateService } from '../certificates/certificate.service';

export interface CreateAppealParams {
  runId: string;
  citizenId: string;
  disputedCategory: DataCategory;
  reason: string;
  evidenceUrl?: string;
}

export class AppealService {
  /**
   * Citizen creates an appeal against an ineligible workflow run.
   */
  async createAppeal(params: CreateAppealParams) {
    const { runId, citizenId, disputedCategory, reason, evidenceUrl } = params;

    const run = await prisma.workflowRun.findUnique({
      where: { id: runId },
    });

    if (!run || run.citizenId !== citizenId) {
      throw new Error('Run not found or unauthorized');
    }

    if (run.eligibleResult === true) {
      throw new Error('Cannot file an appeal for an already eligible application');
    }

    const appeal = await prisma.appeal.create({
      data: {
        runId,
        citizenId,
        disputedCategory,
        reason,
        evidenceUrl,
        status: 'SUBMITTED',
      },
      include: {
        run: {
          select: {
            serviceType: true,
            state: true,
            eligibleResult: true,
          },
        },
      },
    });

    // Notify citizen
    try {
      await notificationService.emitNotification({
        citizenId,
        type: 'APPEAL_SUBMITTED',
        title: 'Appeal Filed',
        body: `Your appeal regarding ${disputedCategory} for ${run.serviceType} has been submitted (ID: ${appeal.id.slice(0, 8)}).`,
        metadata: { appealId: appeal.id, runId },
      });
    } catch (err) {
      console.error('[AppealService] Failed to notify citizen:', err);
    }

    return appeal;
  }

  /**
   * Admin updates the appeal status (UNDER_REVIEW, UPHELD, DISMISSED) and optional note.
   */
  async updateStatus(id: string, status: string, adminNote?: string) {
    const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'UPHELD', 'DISMISSED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Expected one of: ${validStatuses.join(', ')}`);
    }

    const resolved = ['UPHELD', 'DISMISSED'].includes(status);
    const appeal = await prisma.appeal.update({
      where: { id },
      data: {
        status,
        adminNote,
        resolvedAt: resolved ? new Date() : null,
      },
      include: {
        run: {
          select: {
            serviceType: true,
          },
        },
      },
    });

    // Notify citizen if status resolved
    if (resolved) {
      try {
        await notificationService.emitNotification({
          citizenId: appeal.citizenId,
          type: 'APPEAL_RESOLVED',
          title: `Appeal ${status}: ${appeal.run.serviceType}`,
          body: `Your appeal has been marked ${status}.${adminNote ? ` Review note: ${adminNote}` : ''}`,
          metadata: { appealId: appeal.id, status, runId: appeal.runId },
        });
      } catch (err) {
        console.error('[AppealService] Failed to notify citizen:', err);
      }
    }

    return appeal;
  }

  /**
   * Trigger workflow re-run if appeal was UPHELD.
   * Revokes any certificate on the original run and creates a clean new WorkflowRun.
   */
  async triggerRerun(appealId: string) {
    const appeal = await prisma.appeal.findUniqueOrThrow({
      where: { id: appealId },
      include: { run: true },
    });

    if (appeal.status !== 'UPHELD') {
      throw new Error(`Cannot trigger rerun on an appeal with status: ${appeal.status}. Must be UPHELD.`);
    }

    // Revoke any previous certificate
    await certificateService.revoke(appeal.runId);

    // Create a new WorkflowRun for citizen
    const newRun = await prisma.workflowRun.create({
      data: {
        citizenId: appeal.citizenId,
        serviceType: appeal.run.serviceType,
        state: 'AWAITING_CONSENT',
      },
    });

    // Notify citizen to grant consent for the rerun
    try {
      await notificationService.emitNotification({
        citizenId: appeal.citizenId,
        type: 'WORKFLOW_RERUN_INITIATED',
        title: 'New Application Run Initiated',
        body: `A new application run for ${appeal.run.serviceType} has been initiated following your upheld appeal. Please grant consent to execute the verification pipeline.`,
        metadata: { appealId, originalRunId: appeal.runId, newRunId: newRun.id },
      });
    } catch (err) {
      console.error('[AppealService] Failed to notify citizen:', err);
    }

    return {
      appeal,
      newRun,
    };
  }

  /**
   * Get single appeal by ID.
   */
  async getAppeal(id: string, citizenId?: string, isAdmin = false) {
    const appeal = await prisma.appeal.findUnique({
      where: { id },
      include: {
        run: {
          select: {
            id: true,
            serviceType: true,
            state: true,
            eligibleResult: true,
            createdAt: true,
          },
        },
      },
    });

    if (!appeal) return null;
    if (!isAdmin && citizenId && appeal.citizenId !== citizenId) {
      throw new Error('Forbidden');
    }

    return appeal;
  }

  /**
   * List appeals with optional filtering.
   */
  async listAppeals(filter: { citizenId?: string; status?: string } = {}) {
    const where: any = {};
    if (filter.citizenId) where.citizenId = filter.citizenId;
    if (filter.status) where.status = filter.status;

    return prisma.appeal.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        run: {
          select: {
            id: true,
            serviceType: true,
            state: true,
            eligibleResult: true,
          },
        },
      },
    });
  }
}

export const appealService = new AppealService();
