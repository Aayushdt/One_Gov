import { prisma } from '../config/db';
import { notificationService } from '../notifications/notification.service';

export interface FlagEntryParams {
  auditEntryId: string;
  citizenId: string;
  reason: string;
}

export class GrievanceService {
  /**
   * Citizen attaches a grievance flag to an audit log entry they dispute.
   */
  async flagEntry(params: FlagEntryParams) {
    const { auditEntryId, citizenId, reason } = params;

    const entry = await prisma.auditEntry.findUnique({
      where: { id: auditEntryId },
    });

    if (!entry || entry.citizenId !== citizenId) {
      throw new Error('Audit entry not found or unauthorized');
    }

    const grievance = await prisma.grievanceFlag.create({
      data: {
        auditEntryId,
        citizenId,
        reason,
        status: 'OPEN',
      },
      include: {
        auditEntry: {
          select: {
            seq: true,
            eventType: true,
            createdAt: true,
          },
        },
      },
    });

    // Notify citizen
    try {
      await notificationService.emitNotification({
        citizenId,
        type: 'GRIEVANCE_FILED',
        title: 'Audit Log Discrepancy Flagged',
        body: `Your grievance regarding log entry #${entry.seq} (${entry.eventType}) has been registered for administrative review.`,
        metadata: { grievanceId: grievance.id, auditEntryId, seq: entry.seq },
      });
    } catch (err) {
      console.error('[GrievanceService] Failed to notify citizen:', err);
    }

    return grievance;
  }

  /**
   * Admin resolves or dismisses a citizen grievance flag.
   */
  async resolveFlag(id: string, status: string, adminNote?: string) {
    const validStatuses = ['OPEN', 'RESOLVED', 'DISMISSED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Expected one of: ${validStatuses.join(', ')}`);
    }

    const resolved = ['RESOLVED', 'DISMISSED'].includes(status);
    const grievance = await prisma.grievanceFlag.update({
      where: { id },
      data: {
        status,
        adminNote,
        resolvedAt: resolved ? new Date() : null,
      },
      include: {
        auditEntry: {
          select: { seq: true, eventType: true },
        },
      },
    });

    if (resolved) {
      try {
        await notificationService.emitNotification({
          citizenId: grievance.citizenId,
          type: 'GRIEVANCE_RESOLVED',
          title: `Grievance #${grievance.id.slice(0, 8)} ${status}`,
          body: `Your discrepancy flag on log entry #${grievance.auditEntry.seq} has been ${status}.${adminNote ? ` Determination note: ${adminNote}` : ''}`,
          metadata: { grievanceId: grievance.id, status },
        });
      } catch (err) {
        console.error('[GrievanceService] Failed to notify citizen:', err);
      }
    }

    return grievance;
  }

  /**
   * List grievance flags with optional filtering.
   */
  async listGrievances(filter: { citizenId?: string; status?: string } = {}) {
    const where: any = {};
    if (filter.citizenId) where.citizenId = filter.citizenId;
    if (filter.status) where.status = filter.status;

    return prisma.grievanceFlag.findMany({
      where,
      orderBy: { flaggedAt: 'desc' },
      include: {
        auditEntry: {
          select: {
            id: true,
            seq: true,
            eventType: true,
            actor: true,
            createdAt: true,
          },
        },
      },
    });
  }
}

export const grievanceService = new GrievanceService();
