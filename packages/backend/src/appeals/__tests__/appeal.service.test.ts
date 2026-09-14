import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../config/db';
import { appealService } from '../appeal.service';

const testCitizenId = 'citizen-test-appeal-1';
const otherCitizenId = 'citizen-test-appeal-2';

const eligibleRunId = 'run-test-appeal-eligible';
const ineligibleRunId = 'run-test-appeal-ineligible';

before(async () => {
  // Create test citizens
  await prisma.citizen.upsert({
    where: { id: testCitizenId },
    create: {
      id: testCitizenId,
      email: 'appeal.test1@govlink.demo',
      name: 'Appeal Tester 1',
      onegovId: 'OG-2026-TEST-APP1',
      passwordHash: 'dummy',
    },
    update: {},
  });

  await prisma.citizen.upsert({
    where: { id: otherCitizenId },
    create: {
      id: otherCitizenId,
      email: 'appeal.test2@govlink.demo',
      name: 'Appeal Tester 2',
      onegovId: 'OG-2026-TEST-APP2',
      passwordHash: 'dummy',
    },
    update: {},
  });

  // Create eligible run
  await prisma.workflowRun.upsert({
    where: { id: eligibleRunId },
    create: {
      id: eligibleRunId,
      citizenId: testCitizenId,
      serviceType: 'SCHOLARSHIP',
      state: 'SUBMITTED',
      eligibleResult: true,
    },
    update: {},
  });

  // Create ineligible run
  await prisma.workflowRun.upsert({
    where: { id: ineligibleRunId },
    create: {
      id: ineligibleRunId,
      citizenId: testCitizenId,
      serviceType: 'SCHOLARSHIP',
      state: 'SUBMITTED',
      eligibleResult: false,
      failureReason: 'INCOME_EXCEEDS_THRESHOLD',
    },
    update: {},
  });
});

after(async () => {
  try {
    await prisma.notification.deleteMany({
      where: { citizenId: { in: [testCitizenId, otherCitizenId] } },
    });
    await prisma.appeal.deleteMany({
      where: { citizenId: { in: [testCitizenId, otherCitizenId] } },
    });
    await prisma.workflowRun.deleteMany({
      where: { citizenId: { in: [testCitizenId, otherCitizenId] } },
    });
    await prisma.citizen.deleteMany({
      where: { id: { in: [testCitizenId, otherCitizenId] } },
    });
  } catch (err) {
    // Ignore cleanup error
  }
});

describe('Appeals / Reconsideration Flow Tests', () => {
  let createdAppealId: string;

  it('should reject appeal submission if workflow run is already eligible', async () => {
    await assert.rejects(
      async () => {
        await appealService.createAppeal({
          runId: eligibleRunId,
          citizenId: testCitizenId,
          disputedCategory: 'INCOME',
          reason: 'I want to appeal even though I passed',
        });
      },
      /Cannot file an appeal for an already eligible application/
    );
  });

  it('should reject appeal submission if citizen does not own the workflow run', async () => {
    await assert.rejects(
      async () => {
        await appealService.createAppeal({
          runId: ineligibleRunId,
          citizenId: otherCitizenId,
          disputedCategory: 'INCOME',
          reason: 'Not my run',
        });
      },
      /Run not found or unauthorized/
    );
  });

  it('should allow citizen to submit appeal for an ineligible workflow run', async () => {
    const appeal = await appealService.createAppeal({
      runId: ineligibleRunId,
      citizenId: testCitizenId,
      disputedCategory: 'INCOME',
      reason: 'The income certificate includes non-taxable agricultural income which should be exempt',
      evidenceUrl: 'https://docs.example.gov.in/evidence/123.pdf',
    });

    assert.ok(appeal.id);
    assert.equal(appeal.status, 'SUBMITTED');
    assert.equal(appeal.disputedCategory, 'INCOME');
    assert.equal(appeal.citizenId, testCitizenId);
    createdAppealId = appeal.id;
  });

  it('should allow admin to update appeal status to UPHELD', async () => {
    const updated = await appealService.updateStatus(
      createdAppealId,
      'UPHELD',
      'Exemption verified per circular 2026/04. Approved for re-submission.'
    );

    assert.equal(updated.status, 'UPHELD');
    assert.ok(updated.resolvedAt);
    assert.match(updated.adminNote || '', /Exemption verified/);
  });

  it('should trigger workflow re-run for UPHELD appeal', async () => {
    const result = await appealService.triggerRerun(createdAppealId);

    assert.ok(result.newRun);
    assert.equal(result.newRun.citizenId, testCitizenId);
    assert.equal(result.newRun.serviceType, 'SCHOLARSHIP');
    assert.equal(result.newRun.state, 'AWAITING_CONSENT');
  });
});
