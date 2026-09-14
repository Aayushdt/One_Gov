import { prisma } from '../config/db';
import { notificationService } from '../notifications/notification.service';

export class ExportService {
  /**
   * Initiates and compiles a full citizen data portability package (GDPR / DPDP Art. 20).
   */
  async requestExport(citizenId: string) {
    const exportReq = await prisma.dataExportRequest.create({
      data: {
        citizenId,
        status: 'PROCESSING',
      },
    });

    try {
      // 1. Fetch citizen profile
      const citizen = await prisma.citizen.findUniqueOrThrow({
        where: { id: citizenId },
        select: {
          id: true,
          onegovId: true,
          name: true,
          email: true,
          state: true,
          district: true,
          pincode: true,
          createdAt: true,
        },
      });

      // 2. Fetch all workflow runs, snapshots, state histories, certificates
      const workflows = await prisma.workflowRun.findMany({
        where: { citizenId },
        include: {
          consents: true,
          stateHistory: { orderBy: { occurredAt: 'asc' } },
          certificate: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // 3. Fetch all consent artefacts
      const consents = await prisma.consentArtefact.findMany({
        where: { citizenId },
        orderBy: { grantedAt: 'desc' },
      });

      // 4. Fetch full audit trail
      const auditTrail = await prisma.auditEntry.findMany({
        where: { citizenId },
        orderBy: { seq: 'asc' },
      });

      // 5. Fetch notifications
      const notifications = await prisma.notification.findMany({
        where: { citizenId },
        orderBy: { createdAt: 'desc' },
      });

      // 6. Compile data bundle
      const bundle = {
        formatVersion: '1.0.0',
        standard: 'GDPR / DPDP Citizen Data Portability',
        exportedAt: new Date().toISOString(),
        profile: citizen,
        workflows,
        consents,
        auditTrail,
        notifications,
      };

      const jsonString = JSON.stringify(bundle, null, 2);
      const fileSize = Buffer.byteLength(jsonString, 'utf-8');

      const updated = await prisma.dataExportRequest.update({
        where: { id: exportReq.id },
        data: {
          status: 'READY',
          data: bundle as any,
          fileSize,
          downloadUrl: `/api/export/${exportReq.id}/download`,
          completedAt: new Date(),
        },
      });

      // Notify citizen (Item 5 integration)
      try {
        await notificationService.emitNotification({
          citizenId,
          type: 'DATA_EXPORT_READY',
          title: 'Your Personal Data Export is Ready',
          body: `Your GDPR/DPDP personal data export (${(fileSize / 1024).toFixed(1)} KB) has been compiled and is ready for download.`,
          metadata: { exportId: exportReq.id, fileSize },
        });
      } catch (nErr) {
        console.error('[ExportService] Failed to notify citizen:', nErr);
      }

      return updated;
    } catch (err: any) {
      await prisma.dataExportRequest.update({
        where: { id: exportReq.id },
        data: {
          status: 'FAILED',
        },
      });
      throw err;
    }
  }

  /**
   * Retrieves a specific data export request for a citizen.
   */
  async getExport(exportId: string, citizenId: string) {
    return prisma.dataExportRequest.findFirst({
      where: { id: exportId, citizenId },
    });
  }

  /**
   * Lists historical data export requests for a citizen.
   */
  async listCitizenExports(citizenId: string) {
    return prisma.dataExportRequest.findMany({
      where: { citizenId },
      select: {
        id: true,
        status: true,
        downloadUrl: true,
        fileSize: true,
        createdAt: true,
        completedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const exportService = new ExportService();
