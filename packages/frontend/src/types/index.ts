export type DataCategory = 'IDENTITY' | 'EDUCATION' | 'INCOME';
export type ConsentStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export type WorkflowState = 'AWAITING_CONSENT' | 'IDENTITY_VERIFY' | 'EDUCATION_VERIFY' | 'INCOME_VERIFY' | 'ELIGIBILITY_CALC' | 'SUBMITTED' | 'FAILED' | 'PENDING';

export interface ConsentArtefact {
  id: string;
  citizenId: string;
  category: DataCategory;
  purpose: string;
  requestedBy: string;
  grantedAt: string;
  expiresAt: string;
  status: ConsentStatus;
  revokedAt: string | null;
  workflowRunId: string;
}

export interface WorkflowRun {
  id: string;
  citizenId: string;
  state: WorkflowState;
  retryCount: number;
  lastError: string | null;
  failureReason: string | null;
  eligibleResult: boolean | null;
  createdAt: string;
  updatedAt: string;
  identitySnapshot: IdentityRecord | null;
  educationSnapshot: EducationRecord | null;
  incomeSnapshot: IncomeRecord | null;
  consents: ConsentArtefact[];
  stateHistory: StateHistoryEntry[];
}

export interface StateHistoryEntry {
  id: string;
  runId: string;
  fromState: WorkflowState;
  toState: WorkflowState;
  occurredAt: string;
}

export interface IdentityRecord {
  verified: boolean;
  source: string;
  name: string;
  dob: string;
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
}

export interface AuditEntry {
  id: string;
  seq: number;
  citizenId: string;
  eventType: string;
  actor: string;
  payload: Record<string, unknown>;
  payloadRaw: string;
  prevHash: string;
  hash: string;
  createdAt: string;
}
