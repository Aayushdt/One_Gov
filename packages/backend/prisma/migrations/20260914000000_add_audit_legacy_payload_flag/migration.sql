-- Migration: add_audit_legacy_payload_flag
-- Generated: 2026-09-14
-- Purpose: Add legacyPayload column to AuditEntry to distinguish entries
-- written before the PII-strip fix from entries written after it.
-- See: packages/backend/src/connectors/connectors.ts (PII-STRIP FIX comment)
-- See: packages/backend/scripts/migrate_audit_legacy_payload.ts (one-time data migration)

ALTER TABLE "AuditEntry" ADD COLUMN "legacyPayload" BOOLEAN NOT NULL DEFAULT false;
