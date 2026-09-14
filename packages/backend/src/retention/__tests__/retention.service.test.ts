import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../config/db';
import { retentionService } from '../retention.service';

const testCitizenId = 'citizen-test-retention-1';
const runWithoutAppealId = 'run-test-retention-no-appeal';
const runWithAppealId = 'run-test-retention-with-appeal';

before(async () => {
  await prisma.citizen.upsert({
    where: { id: testCitizenId },
    create: {
      id: testCitizenId,
      email: 'retention.test@govlink.demo',
      name: 'Retention Tester',
      onegovId: 'OG-2026-TEST-RET',
      passwordHash: 'dummy',
    },
    update: {},
  });

  // 1. Run with expired consent, NO appeal
  await prisma.workflowRun.upsert({
    where: { id: runWithoutAppealId },
    create: {
      id: runWithoutAppealId,
      citizenId: testCitizenId,
      serviceType: 'SCHOLARSHIP',
      state: 'SUBMITTED',
      eligibleResult: false,
      incomeSnapshot: { gross: 950000 },
      identitySnapshot: { name: 'Retention Tester' },
      retentionAppliedAt: null,
    },
    update: {
      incomeSnapshot: { gross: 950000 },
      identitySnapshot: { name: 'Retention Tester' },
      retentionAppliedAt: null,
    },
  });

  await prisma.consentArtefact.upsert({
    where: { workflowRunId_category: { workflowRunId: runWithoutAppealId, category: 'INCOME' } },
    create: {
      workflowRunId: runWithoutAppealId,
      citizenId: testCitizenId,
      category: 'INCOME',
      purpose: 'Retention test',
      requestedBy: 'SCHOLARSHIP',
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
    },
    update: {
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 3600 * 1000),
    },
  });

  // 2. Run with expired consent, WITH ACTIVE APPEAL
  await prisma.workflowRun.upsert({
    where: { id: runWithAppealId },
    create: {
      id: runWithAppealId,
      citizenId: testCitizenId,
      serviceType: 'SCHOLARSHIP',
      state: 'SUBMITTED',
      eligibleResult: false,
      incomeSnapshot: { gross: 1200000 },
      identitySnapshot: { name: 'Retention Tester' },
      retentionAppliedAt: null,
    },
    update: {
      incomeSnapshot: { gross: 1200000 },
      identitySnapshot: { name: 'Retention Tester' },
      retentionAppliedAt: null,
    },
  });

  await prisma.consentArtefact.upsert({
    where: { workflowRunId_category: { workflowRunId: runWithAppealId, category: 'INCOME' } },
    create: {
      workflowRunId: runWithAppealId,
      citizenId: testCitizenId,
      category: 'INCOME',
      purpose: 'Retention test appeal',
      requestedBy: 'SCHOLARSHIP',
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 3600 * 1000),
    },
    update: {
      status: 'EXPIRED',
      expiresAt: new Date(Date.now() - 3600 * 1000),
    },
  });

  // Active Appeal attached
  await prisma.appeal.create({
    data: {
      runId: runWithAppealId,
      citizenId: testCitizenId,
      disputedCategory: 'INCOME',
      reason: 'Disputing income assessment for retention protection',
      status: 'SUBMITTED',
    },
  });
});

after(async () => {
  try {
    await prisma.notification.deleteMany({ where: { citizenId: testCitizenId } });
    await prisma.appeal.deleteMany({ where: { citizenId: testCitizenId } });
    await prisma.consentArtefact.deleteMany({ where: { citizenId: testCitizenId } });
    await prisma.workflowRun.deleteMany({ where: { citizenId: testCitizenId } });
    await prisma.auditEntry.deleteMany({ where: { citizenId: testCitizenId } });
    await prisma.citizen.deleteMany({ where: { id: testCitizenId } });
  } catch (err) {
    // Ignore cleanup error
  }
});

describe('Data Retention & Appeal-Exclusion Tests (Item 13)', () => {
  it('should purge snapshots on expired run without appeal, but preserve run with active appeal', async () => {
    const result = await retentionService.applyRetention(0);

    assert.ok(result.cleanedRunsCount >= 1);
    assert.ok(result.excludedDueToAppeals >= 1);

    // Verify un-appealed run was purged
    const cleanedRun = await prisma.workflowRun.findUniqueOrThrow({
      where: { id: runWithoutAppealId },
    });
    assert.equal(cleanedRun.incomeSnapshot, null);
    assert.equal(cleanedRun.identitySnapshot, null);
    assert.ok(cleanedRun.retentionAppliedAt);

    // Verify appealed run was PROTECTED (snapshots retained)
    const protectedRun = await prisma.workflowRun.findUniqueOrThrow({
      where: { id: runWithAppealId },
    });
    assert.notEqual(protectedRun.incomeSnapshot, null);
    assert.notEqual(protectedRun.identitySnapshot, null);
    assert.equal(protectedRun.retentionAppliedAt, null);
  });
});
