import { ConnectorManifest, DataCategory } from '@prisma/client';
import { consentService } from '../consent/consent.service';
import { auditService } from '../audit/audit.service';
import {
  IdentityRecord, EducationRecord, IncomeRecord, TransportRecord,
  PoliceRecord, BankingRecord, WelfareRecord, MunicipalRecord,
  IdentityRaw, EducationRaw, RevenueRaw, TransportRaw,
  PoliceRaw, BankingRaw, WelfareRaw, MunicipalRaw
} from '../models/cdm';

import { circuitBreaker, CircuitBreakerOpenError } from '../resilience/circuit-breaker';
import { rateLimiter, RateLimitError } from '../resilience/rate-limiter';
import { connectorMetrics } from '../metrics/connector.metrics';

export class ConsentViolationError extends Error {
  constructor(public category: DataCategory, public reason: string) {
    super(`Consent not active for category ${category}: ${reason}`);
    this.name = 'ConsentViolationError';
  }
}

export class ConnectorError extends Error {
  constructor(public statusCode: number, public department: string) {
    super(`Connector error from ${department}: HTTP ${statusCode}`);
    this.name = 'ConnectorError';
  }
}

export class SchemaValidationError extends Error {
  constructor(public slug: string, public errors: string[]) {
    super(`Schema validation failed for connector ${slug}: ${errors.join(', ')}`);
    this.name = 'SchemaValidationError';
  }
}

export { CircuitBreakerOpenError, RateLimitError };

export type NormalizeFn = (raw: any) => any;

export const NORMALIZERS = new Map<string, NormalizeFn>([
  ['identity-uidai', (raw: IdentityRaw): IdentityRecord => ({
    verified: raw.verified,
    source: raw.source,
    name: raw.fullName,
    dob: raw.dateOfBirth,
    gender: raw.gender,
    maskedId: raw.maskedId,
    docType: raw.docType,
  })],

  ['education-nad', (raw: EducationRaw): EducationRecord => {
    const status = raw.enrollmentStatus === 'ACTIVE' ? 'ACTIVE' : raw.enrollmentStatus === 'GRADUATED' ? 'GRADUATED' : 'INACTIVE';
    return {
      verified: true,
      source: raw.source,
      institution: raw.institutionName,
      enrollmentStatus: status,
      program: raw.program,
      academicYear: raw.academicYear,
      cgpa: raw.cgpa,
    };
  }],

  ['revenue-cbdt', (raw: RevenueRaw): IncomeRecord => ({
    verified: true,
    source: raw.source,
    eligibilityBand: raw.incomeBand,
    meetsThreshold: raw.incomeBand === 'LOW',
    taxYear: raw.taxYear,
    panMasked: raw.panMasked,
    filingStatus: raw.filingStatus,
  })],

  ['transport-rto', (raw: TransportRaw): TransportRecord => ({
    verified: true,
    source: raw.source,
    dlNumber: raw.dlNumber,
    dlStatus: raw.dlStatus,
    cleanDrivingRecord: raw.cleanDrivingRecord,
    unpaidChallansCount: raw.unpaidChallansCount,
    vehicleType: raw.vehicleType,
  })],

  ['police-cctns', (raw: PoliceRaw): PoliceRecord => ({
    verified: true,
    source: raw.source,
    clearanceStatus: raw.clearanceStatus,
    incidentCount: raw.incidentCount,
    jurisdictionStation: raw.jurisdictionStation,
  })],

  ['banking-dbt', (raw: BankingRaw): BankingRecord => ({
    verified: true,
    source: raw.source,
    bankName: raw.bankName,
    maskedAccount: raw.maskedAccount,
    kycStatus: raw.kycStatus,
    dbtEnabled: raw.dbtActive,
  })],

  ['welfare-pds', (raw: WelfareRaw): WelfareRecord => ({
    verified: true,
    source: raw.source,
    bplStatus: raw.bplCardHolder,
    rationCardNumber: raw.rationCardNumber,
    activeSubsidies: raw.activeSubsidies,
  })],

  ['municipal-property', (raw: MunicipalRaw): MunicipalRecord => ({
    verified: true,
    source: raw.source,
    propertyId: raw.propertyId,
    propertyTaxClearance: raw.propertyTaxClearance,
    zone: raw.zone,
  })],
]);

export class ConnectorRunner {
  constructor(public manifest: ConnectorManifest) {}

  /**
   * Validates response against JSON fieldSchema.
   */
  validateSchema(raw: any): void {
    if (!raw || typeof raw !== 'object') {
      throw new SchemaValidationError(this.manifest.slug, ['Response must be an object']);
    }
    const schema = this.manifest.fieldSchema as any;
    if (schema && Array.isArray(schema.required)) {
      const missing = schema.required.filter((prop: string) => raw[prop] === undefined);
      if (missing.length > 0) {
        throw new SchemaValidationError(this.manifest.slug, missing.map((m: string) => `Missing required field: ${m}`));
      }
    }
  }

  /**
   * Executes consent check, HTTP fetch, validation, and CDM normalization.
   */
  async fetchAndNormalize(
    externalId: string,
    runId: string,
    citizenId: string,
    attempt = 1,
    callerPurpose?: string
  ): Promise<any> {
    const consent = await consentService.checkActive(runId, this.manifest.category);
    if (!consent.allowed) {
      throw new ConsentViolationError(this.manifest.category, consent.reason ?? 'unknown');
    }

    // Purpose binding check (Item 2)
    if (callerPurpose) {
      const purposeCheck = await consentService.checkPurposeBound(runId, this.manifest.category, callerPurpose);
      if (!purposeCheck.allowed) {
        throw new ConsentViolationError(this.manifest.category, purposeCheck.reason ?? 'PURPOSE_MISMATCH');
      }
    }

    const deptName = this.manifest.slug.toUpperCase();
    await auditService.log({
      citizenId,
      eventType: 'CONNECTOR_CALLED',
      actor: 'system',
      payload: { department: deptName, externalId, runId, attempt },
    });

    const authConfig = (this.manifest.authConfig || {}) as any;

    // 1. Rate Limiting Check (Item 12)
    const rateLimit = typeof authConfig.rateLimit === 'number' ? authConfig.rateLimit : 100;
    const rlCheck = await rateLimiter.checkAndConsume(this.manifest.slug, citizenId, rateLimit);
    if (!rlCheck.allowed) {
      throw new RateLimitError(this.manifest.slug, rlCheck.retryAfterMs);
    }

    // 2. Metrics: Record RETRY if attempt > 1
    if (attempt > 1) {
      await connectorMetrics.recordEvent(this.manifest.slug, 'RETRY', undefined, undefined);
    }

    const envVar = authConfig.envVar;
    const baseUrl = (envVar && process.env[envVar]) ? process.env[envVar] : this.manifest.baseUrl;
    const pathTemplate = authConfig.pathTemplate || '/:id';
    const path = pathTemplate.replace(':id', encodeURIComponent(externalId));
    const url = `${baseUrl}${path}`;

    // 3. API Key Header Injection (Item 12)
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (authConfig.apiKey) {
      const headerName = authConfig.headerName || 'X-API-Key';
      headers[headerName] = authConfig.apiKey;
    }

    // 4. Circuit Breaker Call (Item 10)
    const res = await circuitBreaker.call(this.manifest.slug, async () => {
      const startTime = Date.now();
      try {
        const response = await fetch(url, { headers });
        const durationMs = Date.now() - startTime;
        if (!response.ok) {
          await connectorMetrics.recordEvent(this.manifest.slug, 'FAILURE', durationMs, response.status);
          await auditService.log({
            citizenId,
            eventType: 'CONNECTOR_FAILED',
            actor: 'system',
            payload: { department: deptName, statusCode: response.status, attempt, externalId },
          });
          throw new ConnectorError(response.status, deptName);
        }
        await connectorMetrics.recordEvent(this.manifest.slug, 'SUCCESS', durationMs, response.status);
        return response;
      } catch (err) {
        if (!(err instanceof ConnectorError)) {
          const durationMs = Date.now() - startTime;
          await connectorMetrics.recordEvent(this.manifest.slug, 'FAILURE', durationMs, 500);
        }
        throw err;
      }
    });

    const raw = await res.json();
    this.validateSchema(raw);

    const normalizer = NORMALIZERS.get(this.manifest.slug);
    const cdm = normalizer ? normalizer(raw) : raw;

    // PII-STRIP: only log verification status and category, no personal fields
    await auditService.log({
      citizenId,
      eventType: 'CONNECTOR_SUCCESS',
      actor: 'system',
      payload: {
        department: deptName,
        cdmVerified: true,
        cdmCategory: this.manifest.category,
      },
    });

    return cdm;
  }
}
