import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../../config/db';
import { consentService } from '../consent.service';
import { DataCategory, ConsentStatus } from '@prisma/client';

describe('Consent Concurrency & Purpose Binding Tests', () => {
  const testCitizenId = 'citizen-test-concurrency';
  const testRunId = 'run-test-concurrency-1';

  before(async () => {
    // Setup test citizen and workflow run
    await prisma.citizen.upsert({
      where: { id: testCitizenId },
      update: {},
      create: {
        id: testCitizenId,
        onegovId: 'OG-TEST-9999',
        email: 'concurrency.test@govlink.demo',
        passwordHash: 'dummy',
        name: 'Concurrency Test Citizen',
      },
    });

    await prisma.workflowRun.upsert({
      where: { id: testRunId },
      update: {},
      create: {
        id: testRunId,
        citizenId: testCitizenId,
        serviceType: 'SCHOLARSHIP',
      },
    });
  });

  after(async () => {
    try {
      await prisma.consentArtefact.deleteMany({ where: { workflowRunId: testRunId } });
      await prisma.workflowRun.deleteMany({ where: { id: testRunId } });
      await prisma.citizen.deleteMany({ where: { id: testCitizenId } });
    } catch {}
  });

  it('Simultaneous checkActive Test: 10 concurrent calls on maxUses=1 result in exactly 1 ALLOWED and 9 USE_LIMIT_REACHED', async () => {
    // 1. Create a single-use consent artefact (maxUses = 1)
    await prisma.consentArtefact.upsert({
      where: { workflowRunId_category: { workflowRunId: testRunId, category: DataCategory.IDENTITY } },
      update: {
        status: ConsentStatus.ACTIVE,
        useCount: 0,
        maxUses: 1,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
      create: {
        citizenId: testCitizenId,
        workflowRunId: testRunId,
        category: DataCategory.IDENTITY,
        purpose: 'Identity Verification for Scholarship',
        requestedBy: 'GovLink Engine',
        status: ConsentStatus.ACTIVE,
        useCount: 0,
        maxUses: 1,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
    });

    // 2. Fire 10 concurrent checkActive calls
    const calls = Array.from({ length: 10 }, () =>
      consentService.checkActive(testRunId, DataCategory.IDENTITY)
    );

    const results = await Promise.all(calls);

    const allowedCount = results.filter((r) => r.allowed === true).length;
    const limitReachedCount = results.filter((r) => r.allowed === false && r.reason === 'USE_LIMIT_REACHED').length;

    assert.strictEqual(
      allowedCount,
      1,
      `Expected exactly 1 call to be allowed, but ${allowedCount} calls were allowed`
    );
    assert.strictEqual(
      limitReachedCount,
      9,
      `Expected exactly 9 calls to receive USE_LIMIT_REACHED, but got ${limitReachedCount}`
    );

    // Verify useCount in DB is exactly 1
    const artefactInDb = await prisma.consentArtefact.findUnique({
      where: { workflowRunId_category: { workflowRunId: testRunId, category: DataCategory.IDENTITY } },
    });
    assert.strictEqual(artefactInDb?.useCount, 1);
  });

  it('Purpose Binding Test: matches consented purpose and rejects mismatched callerPurpose', async () => {
    await prisma.consentArtefact.upsert({
      where: { workflowRunId_category: { workflowRunId: testRunId, category: DataCategory.INCOME } },
      update: {
        status: ConsentStatus.ACTIVE,
        purpose: 'Scholarship Income Band Verification',
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
      create: {
        citizenId: testCitizenId,
        workflowRunId: testRunId,
        category: DataCategory.INCOME,
        purpose: 'Scholarship Income Band Verification',
        requestedBy: 'GovLink Engine',
        status: ConsentStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      },
    });

    // 1. Matching purpose should pass
    const matchRes = await consentService.checkPurposeBound(
      testRunId,
      DataCategory.INCOME,
      'Scholarship Income Band'
    );
    assert.strictEqual(matchRes.allowed, true);

    // 2. Mismatched purpose should fail
    const mismatchRes = await consentService.checkPurposeBound(
      testRunId,
      DataCategory.INCOME,
      'Commercial Loan Underwriting'
    );
    assert.strictEqual(mismatchRes.allowed, false);
    assert.match(mismatchRes.reason || '', /PURPOSE_MISMATCH/);
  });
});
