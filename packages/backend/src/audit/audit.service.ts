import { createHash } from 'crypto';
import { prisma } from '../config/db';

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
}

export const auditService = new AuditService();
