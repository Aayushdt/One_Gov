import { DataCategory } from '@prisma/client';
import {
  IdentityRecord, EducationRecord, IncomeRecord, TransportRecord, PoliceRecord, BankingRecord, WelfareRecord, MunicipalRecord,
  IdentityRaw, EducationRaw, RevenueRaw, TransportRaw, PoliceRaw, BankingRaw, WelfareRaw, MunicipalRaw
} from '../models/cdm';
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

// ─── 1. Identity Connector (UIDAI / Aadhaar) ────────────────────────────────

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

// ─── 2. Education Connector (Higher Education / NAD) ────────────────────────

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
  }
}

// ─── 3. Revenue Connector (Income Tax / PAN) ────────────────────────────────

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
    // DATA MINIMIZATION: normalize() strips raw income numbers
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

// ─── 4. Transport Connector (RTO / Parivahan) ──────────────────────────────

export class TransportConnector {
  readonly departmentId = 'transport-dept';
  readonly dataCategory = DataCategory.TRANSPORT;
  private readonly baseUrl = process.env.REVENUE_API_URL ?? 'http://mock-revenue:4003';

  async fetchAndNormalize(externalId: string, runId: string, citizenId: string): Promise<TransportRecord> {
    const consent = await consentService.checkActive(runId, DataCategory.TRANSPORT);
    if (!consent.allowed) throw new ConsentViolationError(DataCategory.TRANSPORT, consent.reason ?? 'unknown');

    await auditService.log({ citizenId, eventType: 'CONNECTOR_CALLED', actor: 'system', payload: { department: 'TRANSPORT', externalId, runId } });

    const res = await fetch(`${this.baseUrl}/transport/${externalId}`);
    if (!res.ok) {
      await auditService.log({ citizenId, eventType: 'CONNECTOR_FAILED', actor: 'system', payload: { department: 'TRANSPORT', statusCode: res.status } });
      throw new ConnectorError(res.status, 'TRANSPORT');
    }
    const raw = (await res.json()) as TransportRaw;
    const cdm = this.normalize(raw);
    await auditService.log({ citizenId, eventType: 'CONNECTOR_SUCCESS', actor: 'system', payload: { department: 'TRANSPORT', cdmFragment: cdm } });
    return cdm;
  }

  normalize(raw: TransportRaw): TransportRecord {
    return {
      verified: true,
      source: raw.source,
      dlNumber: raw.dlNumber,
      dlStatus: raw.dlStatus,
      cleanDrivingRecord: raw.cleanDrivingRecord,
      unpaidChallansCount: raw.unpaidChallansCount,
      vehicleType: raw.vehicleType,
    };
  }
}

// ─── 5. Police Connector (CCTNS National Crime Records) ─────────────────────

export class PoliceConnector {
  readonly departmentId = 'police-dept';
  readonly dataCategory = DataCategory.POLICE;
  private readonly baseUrl = process.env.IDENTITY_API_URL ?? 'http://mock-identity:4001';

  async fetchAndNormalize(externalId: string, runId: string, citizenId: string): Promise<PoliceRecord> {
    const consent = await consentService.checkActive(runId, DataCategory.POLICE);
    if (!consent.allowed) throw new ConsentViolationError(DataCategory.POLICE, consent.reason ?? 'unknown');

    await auditService.log({ citizenId, eventType: 'CONNECTOR_CALLED', actor: 'system', payload: { department: 'POLICE', externalId, runId } });

    const res = await fetch(`${this.baseUrl}/police/${externalId}`);
    if (!res.ok) {
      await auditService.log({ citizenId, eventType: 'CONNECTOR_FAILED', actor: 'system', payload: { department: 'POLICE', statusCode: res.status } });
      throw new ConnectorError(res.status, 'POLICE');
    }
    const raw = (await res.json()) as PoliceRaw;
    const cdm = this.normalize(raw);
    await auditService.log({ citizenId, eventType: 'CONNECTOR_SUCCESS', actor: 'system', payload: { department: 'POLICE', cdmFragment: cdm } });
    return cdm;
  }

  normalize(raw: PoliceRaw): PoliceRecord {
    return {
      verified: true,
      source: raw.source,
      clearanceStatus: raw.clearanceStatus,
      incidentCount: raw.incidentCount,
      jurisdictionStation: raw.jurisdictionStation,
    };
  }
}

// ─── 6. Banking Connector (Core Banking / DBT / KYC) ───────────────────────

export class BankingConnector {
  readonly departmentId = 'banking-dept';
  readonly dataCategory = DataCategory.BANKING;
  private readonly baseUrl = process.env.REVENUE_API_URL ?? 'http://mock-revenue:4003';

  async fetchAndNormalize(externalId: string, runId: string, citizenId: string): Promise<BankingRecord> {
    const consent = await consentService.checkActive(runId, DataCategory.BANKING);
    if (!consent.allowed) throw new ConsentViolationError(DataCategory.BANKING, consent.reason ?? 'unknown');

    await auditService.log({ citizenId, eventType: 'CONNECTOR_CALLED', actor: 'system', payload: { department: 'BANKING', externalId, runId } });

    const res = await fetch(`${this.baseUrl}/banking/${externalId}`);
    if (!res.ok) {
      await auditService.log({ citizenId, eventType: 'CONNECTOR_FAILED', actor: 'system', payload: { department: 'BANKING', statusCode: res.status } });
      throw new ConnectorError(res.status, 'BANKING');
    }
    const raw = (await res.json()) as BankingRaw;
    const cdm = this.normalize(raw);
    await auditService.log({ citizenId, eventType: 'CONNECTOR_SUCCESS', actor: 'system', payload: { department: 'BANKING', cdmFragment: cdm } });
    return cdm;
  }

  normalize(raw: BankingRaw): BankingRecord {
    return {
      verified: true,
      source: raw.source,
      bankName: raw.bankName,
      maskedAccount: raw.maskedAccount,
      kycStatus: raw.kycStatus,
      dbtEnabled: raw.dbtActive,
    };
  }
}

// ─── 7. Welfare Connector (Public Distribution System / DBT) ────────────────

export class WelfareConnector {
  readonly departmentId = 'welfare-dept';
  readonly dataCategory = DataCategory.WELFARE;
  private readonly baseUrl = process.env.EDUCATION_API_URL ?? 'http://mock-education:4002';

  async fetchAndNormalize(externalId: string, runId: string, citizenId: string): Promise<WelfareRecord> {
    const consent = await consentService.checkActive(runId, DataCategory.WELFARE);
    if (!consent.allowed) throw new ConsentViolationError(DataCategory.WELFARE, consent.reason ?? 'unknown');

    await auditService.log({ citizenId, eventType: 'CONNECTOR_CALLED', actor: 'system', payload: { department: 'WELFARE', externalId, runId } });

    const res = await fetch(`${this.baseUrl}/welfare/${externalId}`);
    if (!res.ok) {
      await auditService.log({ citizenId, eventType: 'CONNECTOR_FAILED', actor: 'system', payload: { department: 'WELFARE', statusCode: res.status } });
      throw new ConnectorError(res.status, 'WELFARE');
    }
    const raw = (await res.json()) as WelfareRaw;
    const cdm = this.normalize(raw);
    await auditService.log({ citizenId, eventType: 'CONNECTOR_SUCCESS', actor: 'system', payload: { department: 'WELFARE', cdmFragment: cdm } });
    return cdm;
  }

  normalize(raw: WelfareRaw): WelfareRecord {
    return {
      verified: true,
      source: raw.source,
      bplStatus: raw.bplCardHolder,
      rationCardNumber: raw.rationCardNumber,
      activeSubsidies: raw.activeSubsidies,
    };
  }
}

// ─── 8. Municipal Connector (Property Registry / Land Records) ──────────────

export class MunicipalConnector {
  readonly departmentId = 'municipal-dept';
  readonly dataCategory = DataCategory.MUNICIPAL;
  private readonly baseUrl = process.env.IDENTITY_API_URL ?? 'http://mock-identity:4001';

  async fetchAndNormalize(externalId: string, runId: string, citizenId: string): Promise<MunicipalRecord> {
    const consent = await consentService.checkActive(runId, DataCategory.MUNICIPAL);
    if (!consent.allowed) throw new ConsentViolationError(DataCategory.MUNICIPAL, consent.reason ?? 'unknown');

    await auditService.log({ citizenId, eventType: 'CONNECTOR_CALLED', actor: 'system', payload: { department: 'MUNICIPAL', externalId, runId } });

    const res = await fetch(`${this.baseUrl}/municipal/${externalId}`);
    if (!res.ok) {
      await auditService.log({ citizenId, eventType: 'CONNECTOR_FAILED', actor: 'system', payload: { department: 'MUNICIPAL', statusCode: res.status } });
      throw new ConnectorError(res.status, 'MUNICIPAL');
    }
    const raw = (await res.json()) as MunicipalRaw;
    const cdm = this.normalize(raw);
    await auditService.log({ citizenId, eventType: 'CONNECTOR_SUCCESS', actor: 'system', payload: { department: 'MUNICIPAL', cdmFragment: cdm } });
    return cdm;
  }

  normalize(raw: MunicipalRaw): MunicipalRecord {
    return {
      verified: true,
      source: raw.source,
      propertyId: raw.propertyId,
      propertyTaxClearance: raw.propertyTaxClearance,
      zone: raw.zone,
    };
  }
}

export const identityConnector = new IdentityConnector();
export const educationConnector = new EducationConnector();
export const revenueConnector = new RevenueConnector();
export const transportConnector = new TransportConnector();
export const policeConnector = new PoliceConnector();
export const bankingConnector = new BankingConnector();
export const welfareConnector = new WelfareConnector();
export const municipalConnector = new MunicipalConnector();
