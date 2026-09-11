import { DataCategory } from '@prisma/client';
import { IdentityRecord, EducationRecord, IncomeRecord, IdentityRaw, EducationRaw, RevenueRaw } from '../models/cdm';
import { consentService } from '../consent/consent.service';
import { auditService } from '../audit/audit.service';

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

// ─── Identity Connector ────────────────────────────────────────────────────

export class IdentityConnector {
  readonly departmentId = 'identity-dept';
  readonly dataCategory = DataCategory.IDENTITY;
  private readonly baseUrl = process.env.IDENTITY_API_URL ?? 'http://mock-identity:4001';

  async fetchAndNormalize(externalId: string, runId: string, citizenId: string): Promise<IdentityRecord> {
    const consent = await consentService.checkActive(runId, DataCategory.IDENTITY);
    if (!consent.allowed) throw new ConsentViolationError(DataCategory.IDENTITY, consent.reason ?? 'unknown');

    await auditService.log({ citizenId, eventType: 'CONNECTOR_CALLED', actor: 'system', payload: { department: 'IDENTITY', externalId, runId, attempt: 1 } });

    const res = await fetch(`${this.baseUrl}/citizens/${externalId}`);
    if (!res.ok) {
      await auditService.log({ citizenId, eventType: 'CONNECTOR_FAILED', actor: 'system', payload: { department: 'IDENTITY', statusCode: res.status, externalId } });
      throw new ConnectorError(res.status, 'IDENTITY');
    }
    const raw = (await res.json()) as IdentityRaw;
    const cdm = this.normalize(raw);
    await auditService.log({ citizenId, eventType: 'CONNECTOR_SUCCESS', actor: 'system', payload: { department: 'IDENTITY', cdmFragment: cdm } });
    return cdm;
  }

  normalize(raw: IdentityRaw): IdentityRecord {
    return {
      verified: raw.verified,
      source: raw.source,
      name: raw.fullName,
      dob: raw.dateOfBirth,
      gender: raw.gender,
      maskedId: raw.maskedId,
      docType: raw.docType,
    };
  }
}

// ─── Education Connector ───────────────────────────────────────────────────

export class EducationConnector {
  readonly departmentId = 'education-dept';
  readonly dataCategory = DataCategory.EDUCATION;
  private readonly baseUrl = process.env.EDUCATION_API_URL ?? 'http://mock-education:4002';

  async fetchAndNormalize(externalId: string, runId: string, citizenId: string): Promise<EducationRecord> {
    const consent = await consentService.checkActive(runId, DataCategory.EDUCATION);
    if (!consent.allowed) throw new ConsentViolationError(DataCategory.EDUCATION, consent.reason ?? 'unknown');

    await auditService.log({ citizenId, eventType: 'CONNECTOR_CALLED', actor: 'system', payload: { department: 'EDUCATION', externalId, runId } });

    const res = await fetch(`${this.baseUrl}/students/${externalId}`);
    if (!res.ok) {
      await auditService.log({ citizenId, eventType: 'CONNECTOR_FAILED', actor: 'system', payload: { department: 'EDUCATION', statusCode: res.status } });
      throw new ConnectorError(res.status, 'EDUCATION');
    }
    const raw = (await res.json()) as EducationRaw;
    const cdm = this.normalize(raw);
    await auditService.log({ citizenId, eventType: 'CONNECTOR_SUCCESS', actor: 'system', payload: { department: 'EDUCATION', cdmFragment: cdm } });
    return cdm;
  }

  normalize(raw: EducationRaw): EducationRecord {
    const status = raw.enrollmentStatus === 'ACTIVE' ? 'ACTIVE' : raw.enrollmentStatus === 'INACTIVE' ? 'INACTIVE' : 'UNKNOWN';
    return {
      verified: true,
      source: raw.source,
      institution: raw.institutionName,
      enrollmentStatus: status,
      program: raw.program,
      academicYear: raw.academicYear,
      cgpa: raw.cgpa,
    };
  }
}

// ─── Revenue Connector ────────────────────────────────────────────────────

export class RevenueConnector {
  readonly departmentId = 'revenue-dept';
  readonly dataCategory = DataCategory.INCOME;
  private readonly baseUrl = process.env.REVENUE_API_URL ?? 'http://mock-revenue:4003';

  async fetchAndNormalize(externalId: string, runId: string, citizenId: string, attempt: number): Promise<IncomeRecord> {
    const consent = await consentService.checkActive(runId, DataCategory.INCOME);
    if (!consent.allowed) throw new ConsentViolationError(DataCategory.INCOME, consent.reason ?? 'unknown');

    await auditService.log({ citizenId, eventType: 'CONNECTOR_CALLED', actor: 'system', payload: { department: 'REVENUE', externalId, runId, attempt } });

    const res = await fetch(`${this.baseUrl}/taxpayers/${externalId}`);
    if (!res.ok) {
      await auditService.log({ citizenId, eventType: 'CONNECTOR_FAILED', actor: 'system', payload: { department: 'REVENUE', statusCode: res.status, attempt } });
      throw new ConnectorError(res.status, 'REVENUE');
    }
    const raw = (await res.json()) as RevenueRaw;
    // DATA MINIMIZATION: normalize() strips incomeRange — only band/boolean cross to CDM
    const cdm = this.normalize(raw);
    await auditService.log({ citizenId, eventType: 'CONNECTOR_SUCCESS', actor: 'system', payload: { department: 'REVENUE', cdmFragment: cdm } });
    return cdm;
  }

  normalize(raw: RevenueRaw): IncomeRecord {
    // ⛔ raw.incomeRange is deliberately NOT included in the return value
    return {
      verified: true,
      source: raw.source,
      eligibilityBand: raw.incomeBand,
      meetsThreshold: raw.incomeBand === 'LOW',
      taxYear: raw.taxYear,
      panMasked: raw.panMasked,
      filingStatus: raw.filingStatus,
    };
  }
}

export const identityConnector = new IdentityConnector();
export const educationConnector = new EducationConnector();
export const revenueConnector = new RevenueConnector();
