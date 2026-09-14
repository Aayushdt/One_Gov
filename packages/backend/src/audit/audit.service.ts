import { createHash } from 'crypto';
import { prisma } from '../config/db';

// AUDIT CHAIN DESIGN NOTE (2026-09-14):
// payloadRaw is the exact string SHA-256 hashed into each chain link. It must
// never be modified after insertion — doing so breaks verifyChain() for all
// subsequent entries in that citizen's chain.
//
// PII in payloadRaw (pre-fix): Before 2026-09-14, CONNECTOR_SUCCESS events
// embedded the full normalized CDM fragment (name, dob, dlNumber, etc.) into
// payload/payloadRaw. This baked personal data into an immutable hash chain,
// conflicting with future erasure/retention requirements.
//
// Fix applied: connectors.ts now logs only { department, cdmVerified: true,
// cdmCategory } for CONNECTOR_SUCCESS. Existing affected entries are marked
// legacyPayload = true by scripts/migrate_audit_legacy_payload.ts. Their
// payloadRaw hashes remain valid and verifyChain() still passes for them.
// All new entries are legacyPayload = false and contain no PII in payloadRaw.

export type AuditEventType =
  | 'CITIZEN_LOGIN'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'CONNECTOR_CALLED'
  | 'CONNECTOR_SUCCESS'
  | 'CONNECTOR_FAILED'
  | 'WORKFLOW_STATE_CHANGE'
  | 'ELIGIBILITY_RESULT'
  | 'DATA_ACCESSED';

const GENESIS_HASH = '0'.repeat(64);

class AuditService {
  async log(params: { citizenId: string; eventType: AuditEventType; actor: string; payload: Record<string, unknown> }) {
    const payloadRaw = JSON.stringify(params.payload);

    return prisma.$transaction(async (tx) => {
      // Transaction advisory lock guarantees absolute serialization even for genesis entries
      // where row-level FOR UPDATE finds 0 rows.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${params.citizenId}))`;

      // Lock the citizen's last entry to prevent race conditions
      const lastEntries = await tx.$queryRaw<{ seq: number; hash: string }[]>`
        SELECT seq, hash FROM "AuditEntry"
        WHERE "citizenId" = ${params.citizenId}
        ORDER BY seq DESC
        LIMIT 1
        FOR UPDATE
      `;

      const lastEntry = lastEntries[0] ?? null;
      const prevHash = lastEntry?.hash ?? GENESIS_HASH;
      const seq = (lastEntry?.seq ?? 0) + 1;
      const hash = createHash('sha256').update(prevHash + seq.toString() + payloadRaw).digest('hex');

      return tx.auditEntry.create({
        data: {
          citizenId: params.citizenId,
          seq,
          eventType: params.eventType,
          actor: params.actor,
          payload: params.payload as any,
          payloadRaw,
          prevHash,
          hash,
          // legacyPayload defaults to false via schema column default.
          // After running the Prisma migration and `prisma generate`, this field
          // can be set explicitly here if needed. The column default is authoritative.
        },
      });
    });
  }

  async verifyChain(citizenId: string): Promise<{ valid: boolean; brokenAt?: number; totalEntries: number }> {
    const entries = await prisma.auditEntry.findMany({ where: { citizenId }, orderBy: { seq: 'asc' } });

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const expectedPrevHash = i === 0 ? GENESIS_HASH : entries[i - 1].hash;
      const recomputed = createHash('sha256').update(entry.prevHash + entry.seq.toString() + entry.payloadRaw).digest('hex');
      if (recomputed !== entry.hash || entry.prevHash !== expectedPrevHash) {
        return { valid: false, brokenAt: entry.seq, totalEntries: entries.length };
      }
    }
    return { valid: true, totalEntries: entries.length };
  }

  async getTrail(citizenId: string) {
    return prisma.auditEntry.findMany({ where: { citizenId }, orderBy: { seq: 'asc' } });
  }

  async tamperEntry(citizenId: string): Promise<{ tamperedSeq: number }> {
    const entries = await prisma.auditEntry.findMany({ where: { citizenId }, orderBy: { seq: 'asc' } });
    if (entries.length === 0) throw new Error('No entries to tamper');
    const target = entries.length >= 2 ? entries[1] : entries[0];

    const modifiedPayloadRaw = JSON.stringify({ ...(target.payload as object), _unauthorizedMutation: 'ADMIN_DIRECT_DB_EDIT', tamperedAt: new Date().toISOString() });
    await prisma.auditEntry.update({
      where: { id: target.id },
      data: {
        payloadRaw: modifiedPayloadRaw,
        payload: { ...(target.payload as object), _unauthorizedMutation: 'ADMIN_DIRECT_DB_EDIT' } as any,
      },
    });
    return { tamperedSeq: target.seq };
  }

  async restoreChain(citizenId: string): Promise<{ restored: boolean }> {
    const entries = await prisma.auditEntry.findMany({ where: { citizenId }, orderBy: { seq: 'asc' } });
    let runningPrevHash = GENESIS_HASH;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const cleanPayload = { ...(entry.payload as any) };
      delete cleanPayload._unauthorizedMutation;
      delete cleanPayload.tamperedAt;
      const cleanRaw = JSON.stringify(cleanPayload);
      const recomputedHash = createHash('sha256').update(runningPrevHash + entry.seq.toString() + cleanRaw).digest('hex');

      await prisma.auditEntry.update({
        where: { id: entry.id },
        data: {
          payload: cleanPayload,
          payloadRaw: cleanRaw,
          prevHash: runningPrevHash,
          hash: recomputedHash,
        },
      });
      runningPrevHash = recomputedHash;
    }
    return { restored: true };
  }
}

export const auditService = new AuditService();
