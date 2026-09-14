import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../config/db';
import { grievanceService } from '../grievance.service';

const testCitizenId = 'citizen-test-grievance-1';
const otherCitizenId = 'citizen-test-grievance-2';
let auditEntryId: string;

before(async () => {
  await prisma.citizen.upsert({
    where: { id: testCitizenId },
    create: {
      id: testCitizenId,
      email: 'grievance.test1@govlink.demo',
      name: 'Grievance Tester 1',
      onegovId: 'OG-2026-TEST-GRI1',
      passwordHash: 'dummy',
    },
    update: {},
  });

  await prisma.citizen.upsert({
    where: { id: otherCitizenId },
    create: {
      id: otherCitizenId,
      email: 'grievance.test2@govlink.demo',
      name: 'Grievance Tester 2',
      onegovId: 'OG-2026-TEST-GRI2',
      passwordHash: 'dummy',
    },
    update: {},
  });

  // Create an audit entry for citizen 1
  const entry = await prisma.auditEntry.create({
    data: {
      seq: 1,
      citizenId: testCitizenId,
      eventType: 'DATA_ACCESSED',
      actor: 'IDENTITY_CONNECTOR',
      payload: { note: 'Test entry' },
      payloadRaw: JSON.stringify({ note: 'Test entry' }),
      prevHash: 'GENESIS',
      hash: 'testhash123',
    },
  });

  auditEntryId = entry.id;
});

after(async () => {
  try {
    await prisma.notification.deleteMany({
      where: { citizenId: { in: [testCitizenId, otherCitizenId] } },
    });
    await prisma.grievanceFlag.deleteMany({
      where: { citizenId: { in: [testCitizenId, otherCitizenId] } },
    });
    await prisma.auditEntry.deleteMany({
      where: { citizenId: { in: [testCitizenId, otherCitizenId] } },
    });
    await prisma.citizen.deleteMany({
      where: { id: { in: [testCitizenId, otherCitizenId] } },
    });
  } catch (err) {
    // Ignore cleanup error
  }
});

describe('Citizen Grievance Flagging Tests (Item 13)', () => {
  let createdFlagId: string;

  it('should reject grievance flagging if citizen does not own the audit log entry', async () => {
    await assert.rejects(
      async () => {
        await grievanceService.flagEntry({
          auditEntryId,
          citizenId: otherCitizenId,
          reason: 'I do not own this entry',
        });
      },
      /Audit entry not found or unauthorized/
    );
  });

  it('should allow citizen to flag their own audit entry', async () => {
    const flag = await grievanceService.flagEntry({
      auditEntryId,
      citizenId: testCitizenId,
      reason: 'I dispute that this identity query occurred with my consent',
    });

    assert.ok(flag.id);
    assert.equal(flag.status, 'OPEN');
    assert.equal(flag.citizenId, testCitizenId);
    assert.equal(flag.auditEntryId, auditEntryId);
    createdFlagId = flag.id;
  });

  it('should allow admin to resolve the grievance flag', async () => {
    const updated = await grievanceService.resolveFlag(
      createdFlagId,
      'RESOLVED',
      'Audit verified against ConsentArtefact #412; citizen briefed on automated access schedule.'
    );

    assert.equal(updated.status, 'RESOLVED');
    assert.ok(updated.resolvedAt);
    assert.match(updated.adminNote || '', /ConsentArtefact #412/);
  });
});
