// Common Data Model — the normalized output every connector must return.
// Data minimization is enforced here by design: Income never carries rawIncome.

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
  enrollmentStatus: 'ACTIVE' | 'INACTIVE' | 'UNKNOWN';
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

export interface CommonDataModel {
  identity?: IdentityRecord;
  education?: EducationRecord;
  income?: IncomeRecord;
}

// Raw dept response types (used only inside connectors)
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
  incomeRange: string; // NEVER forwarded beyond this type
  incomeBand: 'LOW' | 'MEDIUM' | 'HIGH';
  taxYear: string;
  panMasked?: string;
  filingStatus?: string;
  source: string;
}
