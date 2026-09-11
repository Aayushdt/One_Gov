// Common Data Model — the normalized output every connector must return.
// Data minimization is enforced here by design: Income never carries rawIncome.

export interface IdentityRecord {
  verified: boolean;
  source: string;
  name: string;
  dob: string; // ISO 8601
}

export interface EducationRecord {
  verified: boolean;
  source: string;
  institution: string;
  enrollmentStatus: 'ACTIVE' | 'INACTIVE' | 'UNKNOWN';
}

export interface IncomeRecord {
  verified: boolean;
  source: string;
  eligibilityBand: 'LOW' | 'MEDIUM' | 'HIGH';
  meetsThreshold: boolean;
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
  verified: boolean;
  verifiedAt: string;
  source: string;
}

export interface EducationRaw {
  studentId: string;
  institutionName: string;
  enrollmentStatus: string;
  courseLevel: string;
  academicYear: string;
  source: string;
}

export interface RevenueRaw {
  externalId: string;
  incomeRange: string; // NEVER forwarded beyond this type
  incomeBand: 'LOW' | 'MEDIUM' | 'HIGH';
  taxYear: string;
  source: string;
}
