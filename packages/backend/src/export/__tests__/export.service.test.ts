import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../../config/db';
import { exportService } from '../export.service';

describe('Citizen Data Export & Portability Tests (GDPR/DPDP Art. 20)', () => {
  const testCitizenId = 'citizen-test-export';

  before(async () => {
    await prisma.citizen.upsert({
      where: { id: testCitizenId },
      update: {},
      create: {
        id: testCitizenId,
        onegovId: 'OG-EXPORT-9999',
        email: 'export.test@govlink.demo',
        passwordHash: 'dummy',
        name: 'Export Test Citizen',
        state: 'Delhi',
      },
    });

    await prisma.workflowRun.create({
      data: {
        citizenId: testCitizenId,
        serviceType: 'SCHOLARSHIP',
        state: 'SUBMITTED',
        eligibleResult: true,
      },
    });
  });

  after(async () => {
    try {
      await prisma.dataExportRequest.deleteMany({ where: { citizenId: testCitizenId } });
      await prisma.notification.deleteMany({ where: { citizenId: testCitizenId } });
      await prisma.workflowRun.deleteMany({ where: { citizenId: testCitizenId } });
      await prisma.citizen.deleteMany({ where: { id: testCitizenId } });
    } catch {}
  });

  it('should compile a complete data portability bundle and mark request as READY', async () => {
    const exportReq = await exportService.requestExport(testCitizenId);

    assert.ok(exportReq.id);
    assert.strictEqual(exportReq.status, 'READY');
    assert.ok(exportReq.fileSize && exportReq.fileSize > 0);
    assert.ok(exportReq.downloadUrl);

    const bundle = exportReq.data as any;
    assert.ok(bundle);
    assert.strictEqual(bundle.formatVersion, '1.0.0');
    assert.strictEqual(bundle.profile.name, 'Export Test Citizen');
    assert.strictEqual(bundle.workflows.length, 1);
    assert.strictEqual(bundle.workflows[0].serviceType, 'SCHOLARSHIP');

    // Verify list
    const list = await exportService.listCitizenExports(testCitizenId);
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].id, exportReq.id);
  });
});
