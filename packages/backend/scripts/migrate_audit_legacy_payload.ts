#!/usr/bin/env ts-node
/**
 * scripts/migrate_audit_legacy_payload.ts
 *
 * ONE-TIME MIGRATION — run once after the Prisma migration that adds
 * `legacyPayload Boolean @default(false)` to AuditEntry.
 *
 * What this does:
 *   Marks every existing CONNECTOR_SUCCESS AuditEntry as legacyPayload = true,
 *   indicating it was written before the PII-strip fix (2026-09-14) and may
 *   contain a full CDM fragment (name, dob, dlNumber, rationCardNumber, etc.)
 *   inside payloadRaw.
 *
 * What this does NOT do:
 *   - Does NOT rewrite payloadRaw or payload JSON columns.
 *   - Does NOT recompute hashes.
 *   - Does NOT break the audit chain. verifyChain() re-hashes payloadRaw as-is,
 *     so the existing hashes remain valid after this migration.
 *
 * Why not rewrite the payloads?
 *   Rewriting payloadRaw for any entry would invalidate its hash AND cascade-break
 *   every subsequent entry in that citizen's chain (since each hash includes
 *   prevHash from the prior entry). The only safe approach is to grandfather
 *   existing entries in place and flag them for human awareness.
 *
 * Idempotent: safe to run multiple times. Already-flagged rows are not touched.
 *
 * Usage:
 *   cd packages/backend
 *   npx ts-node scripts/migrate_audit_legacy_payload.ts
 */

import { prisma } from '../src/config/db';

async function main() {
  console.log('Starting legacy audit payload migration...');
  console.log('This marks all existing CONNECTOR_SUCCESS entries as legacyPayload = true.');
  console.log('payloadRaw and hashes are NOT modified. The chain remains valid.\n');

  // Count affected rows before updating
  const affectedCount = await prisma.auditEntry.count({
    where: {
      eventType: 'CONNECTOR_SUCCESS',
      legacyPayload: false,
    },
  });

  console.log(`Found ${affectedCount} CONNECTOR_SUCCESS entries to mark as legacy.`);

  if (affectedCount === 0) {
    console.log('No entries to update. Migration already applied or no data exists. Exiting.');
    return;
  }

  // Mark all pre-fix CONNECTOR_SUCCESS entries as legacy
  const result = await prisma.auditEntry.updateMany({
    where: {
      eventType: 'CONNECTOR_SUCCESS',
      legacyPayload: false,
    },
    data: {
      legacyPayload: true,
    },
  });

  console.log(`\nUpdated ${result.count} entries to legacyPayload = true.`);

  // Verify: remaining CONNECTOR_SUCCESS entries with legacyPayload = false
  // are entries written AFTER this script ran — correctly using the stripped format.
  const remainingUnflagged = await prisma.auditEntry.count({
    where: {
      eventType: 'CONNECTOR_SUCCESS',
      legacyPayload: false,
    },
  });

  if (remainingUnflagged > 0) {
    console.warn(
      `\nWARNING: ${remainingUnflagged} CONNECTOR_SUCCESS entries still have legacyPayload = false.` +
      '\nIf the backend was running during migration, these used the new stripped format. Safe.' +
      '\nIf the backend was NOT running, re-check that the connectors.ts fix was deployed first.'
    );
  } else {
    console.log('\nAll existing CONNECTOR_SUCCESS entries are now marked legacyPayload = true.');
    console.log('New entries (legacyPayload = false) use the stripped payload and contain no CDM data.');
  }

  // Spot-check the chain on the first citizen found
  const firstCitizen = await prisma.auditEntry.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { citizenId: true },
  });

  if (firstCitizen) {
    console.log(`\nSpot-checking audit chain for citizen ${firstCitizen.citizenId}...`);
    const { createHash } = await import('crypto');
    const GENESIS_HASH = '0'.repeat(64);

    const entries = await prisma.auditEntry.findMany({
      where: { citizenId: firstCitizen.citizenId },
      orderBy: { seq: 'asc' },
    });

    let valid = true;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const expectedPrevHash = i === 0 ? GENESIS_HASH : entries[i - 1].hash;
      const recomputed = createHash('sha256')
        .update(entry.prevHash + entry.seq.toString() + entry.payloadRaw)
        .digest('hex');

      if (recomputed !== entry.hash || entry.prevHash !== expectedPrevHash) {
        console.error(`  \u274c Chain BROKEN at seq ${entry.seq} (eventType: ${entry.eventType})`);
        valid = false;
        break;
      }
    }

    if (valid) {
      console.log(`  \u2705 Chain valid \u2014 ${entries.length} entries verified. payloadRaw was not modified.`);
    }
  }

  console.log('\nMigration complete.');
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
