import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ConnectorRunner, ConsentViolationError, ConnectorError, SchemaValidationError } from '../runner';
import { consentService } from '../../consent/consent.service';
import { auditService } from '../../audit/audit.service';
import { DataCategory } from '@prisma/client';

describe('ConnectorRunner Unit Tests', () => {
  const dummyManifest: any = {
    id: 'm1',
    slug: 'identity-uidai',
    category: DataCategory.IDENTITY,
    baseUrl: 'http://mock-identity:4001',
    authMethod: 'none',
    authConfig: { pathTemplate: '/citizens/:id' },
    fieldSchema: {
      type: 'object',
      required: ['source', 'verified', 'fullName', 'dateOfBirth', 'gender', 'maskedId', 'docType'],
    },
    isActive: true,
  };

  beforeEach(() => {
    // Mock audit service to prevent real DB calls
    auditService.log = (async () => ({} as any)) as any;
  });

  it('Consent Denial Path: throws ConsentViolationError when consent is inactive/denied', async () => {
    // Mock consentService to return allowed: false
    consentService.checkActive = async () => ({
      allowed: false,
      reason: 'REVOKED_BY_CITIZEN',
    });

    const runner = new ConnectorRunner(dummyManifest);

    await assert.rejects(
      async () => {
        await runner.fetchAndNormalize('CIT-123', 'run-1', 'citizen-1', 1);
      },
      (err: any) => {
        assert.ok(err instanceof ConsentViolationError);
        assert.strictEqual(err.category, DataCategory.IDENTITY);
        assert.match(err.message, /REVOKED_BY_CITIZEN/);
        return true;
      }
    );
  });

  it('HTTP Failure Path: throws ConnectorError when department endpoint returns 500/404', async () => {
    consentService.checkActive = async () => ({ allowed: true });

    // Mock global fetch to return 503
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as any);

    try {
      const runner = new ConnectorRunner(dummyManifest);
      await assert.rejects(
        async () => {
          await runner.fetchAndNormalize('CIT-123', 'run-1', 'citizen-1', 1);
        },
        (err: any) => {
          assert.ok(err instanceof ConnectorError);
          assert.strictEqual(err.statusCode, 503);
          return true;
        }
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('Schema Validation Failure Path: throws SchemaValidationError when required fields are missing', async () => {
    consentService.checkActive = async () => ({ allowed: true });

    // Mock fetch to return response missing required fields
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        source: 'UIDAI',
        verified: true,
        // missing fullName, dateOfBirth, etc.
      }),
    } as any);

    try {
      const runner = new ConnectorRunner(dummyManifest);
      await assert.rejects(
        async () => {
          await runner.fetchAndNormalize('CIT-123', 'run-1', 'citizen-1', 1);
        },
        (err: any) => {
          assert.ok(err instanceof SchemaValidationError);
          assert.strictEqual(err.slug, 'identity-uidai');
          assert.match(err.message, /Missing required field: fullName/);
          return true;
        }
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('Success Path: fetches, validates schema, normalizes and strips PII from audit', async () => {
    consentService.checkActive = async () => ({ allowed: true });

    const rawPayload = {
      source: 'UIDAI',
      verified: true,
      fullName: 'Rahul Kumar',
      dateOfBirth: '1998-05-12',
      gender: 'MALE',
      maskedId: 'XXXX-XXXX-1234',
      docType: 'AADHAAR',
    };

    let loggedSuccessPayload: any = null;
    auditService.log = async (entry: any) => {
      if (entry.eventType === 'CONNECTOR_SUCCESS') {
        loggedSuccessPayload = entry.payload;
      }
      return {} as any;
    };

    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => rawPayload,
    } as any);

    try {
      const runner = new ConnectorRunner(dummyManifest);
      const cdm = await runner.fetchAndNormalize('CIT-123', 'run-1', 'citizen-1', 1);

      assert.strictEqual(cdm.name, 'Rahul Kumar');
      assert.strictEqual(cdm.verified, true);
      assert.deepStrictEqual(loggedSuccessPayload, {
        department: 'IDENTITY-UIDAI',
        cdmVerified: true,
        cdmCategory: DataCategory.IDENTITY,
      });
    } finally {
      global.fetch = originalFetch;
    }
  });
});
