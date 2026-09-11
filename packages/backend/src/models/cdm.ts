// Common Data Model (CDM) — Normalized multi-department data representations
// Data Minimization Principle: Raw numbers (raw salaries, detailed challan logs, full biometric hashes)
// are strictly stripped in connector normalizers; only verifiable boolean/band classifications cross to the CDM.

export interface IdentityRecord {
  verified: boolean;
  source: string;
  name: string;
  dob: string; // ISO 8601
  gender?: string;
  maskedId?: string;
  docType?: string;
}

export interface EducationRecord {
  verified: boolean;
  source: string;
  institution: string;
  enrollmentStatus: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'UNKNOWN';
  program?: string;
  academicYear?: string;
  cgpa?: string;
}

export interface IncomeRecord {
  verified: boolean;
  source: string;
  eligibilityBand: 'LOW' | 'MEDIUM' | 'HIGH';
  meetsThreshold: boolean;
  taxYear?: string;
  panMasked?: string;
  filingStatus?: string;
  // ⛔ rawIncome / incomeRange are NEVER present here — enforced by normalize()
}

export interface TransportRecord {
  verified: boolean;
  source: string;
  dlNumber: string;
  dlStatus: 'VALID' | 'EXPIRED' | 'SUSPENDED';
  cleanDrivingRecord: boolean;
  unpaidChallansCount: number;
  vehicleType?: string;
}

export interface PoliceRecord {
  verified: boolean;
  source: string;
  clearanceStatus: 'CLEARED' | 'PENDING' | 'ADVERSE';
  incidentCount: number;
  jurisdictionStation?: string;
}

export interface BankingRecord {
  verified: boolean;
  source: string;
  bankName: string;
  maskedAccount: string;
  kycStatus: 'VERIFIED' | 'OVERDUE' | 'FAILED';
  dbtEnabled: boolean;
}

export interface WelfareRecord {
  verified: boolean;
  source: string;
  bplStatus: boolean;
  rationCardNumber: string;
  activeSubsidies: string[];
}

export interface MunicipalRecord {
  verified: boolean;
  source: string;
  propertyId: string;
  propertyTaxClearance: boolean;
  zone: string;
}

export interface CommonDataModel {
  identity?: IdentityRecord;
  education?: EducationRecord;
  income?: IncomeRecord;
  transport?: TransportRecord;
  police?: PoliceRecord;
  banking?: BankingRecord;
  welfare?: WelfareRecord;
  municipal?: MunicipalRecord;
}

// ─── Raw Dept Response Types (used only inside Connectors before normalization) ─

export interface IdentityRaw {
  externalId: string;
  fullName: string;
  dateOfBirth: string;
  gender?: string;
  maskedId?: string;
  docType?: string;
  verified: boolean;
  verifiedAt: string;
  source: string;
}

export interface EducationRaw {
  studentId: string;
  institutionName: string;
  enrollmentStatus: string;
  courseLevel?: string;
  program?: string;
  academicYear?: string;
  cgpa?: string;
  source: string;
}

export interface RevenueRaw {
  externalId: string;
  incomeRange: string; // NEVER forwarded beyond this raw type
  incomeBand: 'LOW' | 'MEDIUM' | 'HIGH';
  taxYear: string;
  panMasked?: string;
  filingStatus?: string;
  source: string;
}

export interface TransportRaw {
  externalId: string;
  dlNumber: string;
  dlStatus: 'VALID' | 'EXPIRED' | 'SUSPENDED';
  vehicleRegistration?: string;
  vehicleType?: string;
  unpaidChallansCount: number;
  cleanDrivingRecord: boolean;
  source: string;
}

export interface PoliceRaw {
  externalId: string;
  clearanceStatus: 'CLEARED' | 'PENDING' | 'ADVERSE';
  incidentCount: number;
  jurisdictionStation: string;
  verificationDate: string;
  source: string;
}

export interface BankingRaw {
  externalId: string;
  bankName: string;
  maskedAccount: string;
  ifscCode: string;
  kycStatus: 'VERIFIED' | 'OVERDUE' | 'FAILED';
  dbtActive: boolean;
  source: string;
}

export interface WelfareRaw {
  externalId: string;
  rationCardNumber: string;
  bplCardHolder: boolean;
  activeSubsidies: string[];
  source: string;
}

export interface MunicipalRaw {
  externalId: string;
  propertyId: string;
  zone: string;
  propertyTaxClearance: boolean;
  source: string;
}
