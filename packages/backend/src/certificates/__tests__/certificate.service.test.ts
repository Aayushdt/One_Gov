import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../../config/db';
import { certificateService } from '../certificate.service';

describe('Eligibility Certificate Verification & Signing Tests', () => {
  const testCitizenId = 'citizen-test-cert';
  const testRunId = 'run-test-cert-1';

  before(async () => {
    await prisma.citizen.upsert({
      where: { id: testCitizenId },
      update: {},
      create: {
        id: testCitizenId,
        onegovId: 'OG-CERT-9999',
        email: 'cert.test@govlink.demo',
        passwordHash: 'dummy',
        name: 'Certificate Test Citizen',
      },
    });

    await prisma.workflowRun.upsert({
      where: { id: testRunId },
      update: {
        eligibleResult: true,
      },
      create: {
        id: testRunId,
        citizenId: testCitizenId,
        serviceType: 'SCHOLARSHIP',
        eligibleResult: true,
      },
    });
  });

  after(async () => {
    try {
      await prisma.notification.deleteMany({ where: { citizenId: testCitizenId } });
      await prisma.eligibilityCertificate.deleteMany({ where: { runId: testRunId } });
      await prisma.workflowRun.deleteMany({ where: { id: testRunId } });
      await prisma.citizen.deleteMany({ where: { id: testCitizenId } });
    } catch {}
  });

  it('should issue a cryptographically signed Ed25519 certificate and verify it', async () => {
    const issued = await certificateService.issue(testRunId);
    assert.ok(issued.token);
    assert.ok(issued.certificate.signature);
    assert.strictEqual(issued.certificate.algorithm, 'Ed25519');

    // Verify token
    const verifyResult = await certificateService.verify(issued.token);
    assert.strictEqual(verifyResult.valid, true);
    assert.ok(verifyResult.payload);
    assert.strictEqual(verifyResult.payload?.runId, testRunId);
    assert.strictEqual(verifyResult.payload?.eligibleResult, true);
  });

  it('should reject a tampered certificate token', async () => {
    const issued = await certificateService.issue(testRunId);
    const decoded = JSON.parse(Buffer.from(issued.token, 'base64').toString('utf-8'));

    // Tamper with citizen name
    decoded.payload.citizenName = 'Malicious Actor';
    const tamperedToken = Buffer.from(JSON.stringify(decoded)).toString('base64');

    const result = await certificateService.verify(tamperedToken);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, 'SIGNATURE_INVALID');
  });

  it('should respect revoked certificates', async () => {
    const issued = await certificateService.issue(testRunId);

    // Mark as revoked in DB
    await prisma.eligibilityCertificate.update({
      where: { runId: testRunId },
      data: { revokedAt: new Date() },
    });

    const result = await certificateService.verify(issued.token);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.reason, 'CERTIFICATE_REVOKED');
  });
});
