import React from 'react';
import { WorkflowRun } from '../types';

const IDENTITY_RAW_FIELDS = [
  { key: 'name', label: 'Full Name', rawLabel: 'fullName', inCDM: true },
  { key: 'dob', label: 'Date of Birth', rawLabel: 'dateOfBirth', inCDM: true },
  { key: 'gender', label: 'Gender', rawLabel: 'gender', inCDM: true },
  { key: 'docType', label: 'Document Type', rawLabel: 'docType', inCDM: true },
  { key: 'maskedId', label: 'Citizen ID Token', rawLabel: 'maskedId', inCDM: true },
  { key: 'verified', label: 'Registry Verified', rawLabel: 'verified', inCDM: true },
  { key: 'source', label: 'Source System', rawLabel: 'source', inCDM: true },
];

const EDUCATION_RAW_FIELDS = [
  { key: 'institution', label: 'Recognized Institution', rawLabel: 'institutionName', inCDM: true },
  { key: 'program', label: 'Degree / Program', rawLabel: 'program', inCDM: true },
  { key: 'academicYear', label: 'Academic Standing', rawLabel: 'academicYear', inCDM: true },
  { key: 'cgpa', label: 'Cumulative CGPA', rawLabel: 'cgpa', inCDM: true },
  { key: 'enrollmentStatus', label: 'Enrollment Status', rawLabel: 'enrollmentStatus', inCDM: true },
  { key: 'source', label: 'Source System', rawLabel: 'source', inCDM: true },
];

const INCOME_RAW_FIELDS = [
  { key: 'incomeRange', label: 'Exact Gross Salary / Income Range', rawLabel: 'incomeRange', inCDM: false },
  { key: 'eligibilityBand', label: 'Categorized Income Band', rawLabel: 'incomeBand', inCDM: true },
  { key: 'meetsThreshold', label: 'Meets Policy Threshold (<₹3 LPA)', rawLabel: 'meetsThreshold', inCDM: true },
  { key: 'taxYear', label: 'Assessment Year', rawLabel: 'taxYear', inCDM: true },
  { key: 'panMasked', label: 'Tax ID (Masked)', rawLabel: 'panMasked', inCDM: true },
  { key: 'filingStatus', label: 'Filing Status', rawLabel: 'filingStatus', inCDM: true },
  { key: 'source', label: 'Source System', rawLabel: 'source', inCDM: true },
];

const TRANSPORT_RAW_FIELDS = [
  { key: 'dlNumber', label: 'Driving Licence Number', rawLabel: 'dlNumber', inCDM: true },
  { key: 'dlStatus', label: 'Licence Class Validity', rawLabel: 'dlStatus', inCDM: true },
  { key: 'cleanDrivingRecord', label: 'Clean Driving Record (No Pending Challans)', rawLabel: 'cleanDrivingRecord', inCDM: true },
  { key: 'unpaidChallansCount', label: 'Unpaid Challan Count', rawLabel: 'unpaidChallansCount', inCDM: true },
  { key: 'source', label: 'Source System', rawLabel: 'source', inCDM: true },
];

const POLICE_RAW_FIELDS = [
  { key: 'clearanceStatus', label: 'Police Verification Status', rawLabel: 'clearanceStatus', inCDM: true },
  { key: 'incidentCount', label: 'Active FIR / Incident Count', rawLabel: 'incidentCount', inCDM: true },
  { key: 'jurisdictionStation', label: 'Jurisdiction Police Station', rawLabel: 'jurisdictionStation', inCDM: true },
  { key: 'source', label: 'Source System', rawLabel: 'source', inCDM: true },
];

const BANKING_RAW_FIELDS = [
  { key: 'bankName', label: 'Designated Banking Institution', rawLabel: 'bankName', inCDM: true },
  { key: 'maskedAccount', label: 'Masked Account Reference', rawLabel: 'maskedAccount', inCDM: true },
  { key: 'kycStatus', label: 'RBI e-KYC Compliance', rawLabel: 'kycStatus', inCDM: true },
  { key: 'dbtEnabled', label: 'NPCI Aadhaar-DBT Link', rawLabel: 'dbtActive', inCDM: true },
  { key: 'source', label: 'Source System', rawLabel: 'source', inCDM: true },
];

const WELFARE_RAW_FIELDS = [
  { key: 'rationCardNumber', label: 'National Ration Card ID', rawLabel: 'rationCardNumber', inCDM: true },
  { key: 'bplStatus', label: 'Priority / BPL Household Status', rawLabel: 'bplCardHolder', inCDM: true },
  { key: 'source', label: 'Source System', rawLabel: 'source', inCDM: true },
];

const MUNICIPAL_RAW_FIELDS = [
  { key: 'propertyId', label: 'Property Registry ID', rawLabel: 'propertyId', inCDM: true },
  { key: 'zone', label: 'Municipal Urban Zone', rawLabel: 'zone', inCDM: true },
  { key: 'propertyTaxClearance', label: 'Property Tax Clearance', rawLabel: 'propertyTaxClearance', inCDM: true },
  { key: 'verified', label: 'Municipal Registry Verified', rawLabel: 'verified', inCDM: true },
  { key: 'source', label: 'Source System', rawLabel: 'source', inCDM: true },
];

interface Props {
  run: WorkflowRun;
}

function FieldRow({ label, value, stripped }: { label: string; value?: string | boolean | number; stripped?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: stripped ? 'var(--color-border-default)' : 'var(--color-text-secondary)',
          fontFamily: '"Inter", sans-serif',
          textDecoration: stripped ? 'line-through' : 'none',
        }}
      >
        {label}
      </span>
      {stripped ? (
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-accent-amber)',
            background: 'var(--color-warning-bg)',
            padding: '2px 8px',
            borderRadius: 4,
            fontFamily: '"Inter", sans-serif',
          }}
        >
          ⛔ STRIPPED AT CONNECTOR BOUNDARY
        </span>
      ) : (
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
          {value === true ? '✓ True / Verified' : value === false ? '✗ False' : String(value ?? '—')}
        </span>
      )}
    </div>
  );
}

function DeptBlock({ title, fields, snapshot, rawView }: { title: string; fields: any[]; snapshot: Record<string, unknown>; rawView: boolean }) {
  if (!snapshot) return null;
  return (
    <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16, marginTop: 16 }}>
      <p style={{ margin: '0 0 12px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
        {title}
      </p>
      {fields.map((f) => {
        if (!rawView && !f.inCDM) {
          return <FieldRow key={f.key} label={f.label} stripped />;
        }
        const val = (snapshot as any)?.[f.key] ?? (snapshot as any)?.[f.rawLabel];
        return <FieldRow key={f.key} label={rawView ? f.rawLabel : f.label} value={val} />;
      })}
    </div>
  );
}

export function DataMinimizationToggle({ run }: Props) {
  const [rawView, setRawView] = React.useState(false);

  const hasIdentity = !!run.identitySnapshot;
  const hasEducation = !!run.educationSnapshot;
  const hasIncome = !!run.incomeSnapshot;
  const hasTransport = !!run.transportSnapshot;
  const hasPolice = !!run.policeSnapshot;
  const hasBanking = !!run.bankingSnapshot;
  const hasWelfare = !!run.welfareSnapshot;
  const hasMunicipal = !!run.municipalSnapshot;

  if (!hasIdentity && !hasEducation && !hasIncome && !hasTransport && !hasPolice && !hasBanking && !hasWelfare && !hasMunicipal) return null;

  return (
    <div
      style={{
        marginTop: 24,
        padding: 24,
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 10,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-primary)', fontFamily: '"Inter", sans-serif' }}>
            Data Minimization &amp; Privacy Verification
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", sans-serif' }}>
            Inspect raw department database records vs the zero-knowledge normalized Common Data Model.
          </p>
        </div>

        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1.5px solid var(--color-border-default)', background: 'var(--color-bg-base)' }}>
          <button
            key="cdm"
            type="button"
            onClick={() => setRawView(false)}
            style={{
              padding: '8px 16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: '"Inter", sans-serif',
              cursor: 'pointer',
              border: 'none',
              transition: 'all var(--duration-fast)',
              background: !rawView ? 'var(--color-accent-primary)' : 'transparent',
              color: !rawView ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            🛡️ What OneGov Middleware Shared
          </button>
          <button
            key="raw"
            type="button"
            onClick={() => setRawView(true)}
            style={{
              padding: '8px 16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: '"Inter", sans-serif',
              cursor: 'pointer',
              border: 'none',
              transition: 'all var(--duration-fast)',
              background: rawView ? 'var(--color-accent-primary)' : 'transparent',
              color: rawView ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            📂 Raw Department Silo Data
          </button>
        </div>
      </div>

      {hasIdentity && <DeptBlock title="UIDAI Identity Department Record" fields={IDENTITY_RAW_FIELDS} snapshot={run.identitySnapshot as any} rawView={rawView} />}
      {hasEducation && <DeptBlock title="Higher Education (NAD) Registry Record" fields={EDUCATION_RAW_FIELDS} snapshot={run.educationSnapshot as any} rawView={rawView} />}
      {hasIncome && (
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16, marginTop: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
            Revenue Department (Income Tax CBDT) Record
          </p>
          {!rawView && (
            <div style={{ padding: '10px 14px', background: 'var(--color-warning-bg)', borderLeft: '3px solid var(--color-accent-amber)', borderRadius: '0 6px 6px 0', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--warning)', fontFamily: '"Inter", sans-serif', lineHeight: 1.5 }}>
                🔒 <strong>Zero-Knowledge Privacy Guard Enforced:</strong> The citizen's exact income amount (<strong>incomeRange</strong>) was stripped at the connector boundary. The service received only the qualifying categorical band (<strong>LOW</strong>).
              </p>
            </div>
          )}
          {INCOME_RAW_FIELDS.map((f) => {
            if (!rawView && !f.inCDM) return <FieldRow key={f.key} label={f.label} stripped />;
            const val = (run.incomeSnapshot as any)?.[f.key] ?? (run.incomeSnapshot as any)?.[f.rawLabel];
            return <FieldRow key={f.key} label={rawView ? f.rawLabel : f.label} value={rawView && f.key === 'incomeRange' ? val ?? '₹2,40,000 / yr (Raw Tax Return)' : val} />;
          })}
        </div>
      )}
      {hasTransport && <DeptBlock title="Parivahan RTO Driving & Transport Record" fields={TRANSPORT_RAW_FIELDS} snapshot={run.transportSnapshot as any} rawView={rawView} />}
      {hasPolice && <DeptBlock title="Police CCTNS National Clearance Record" fields={POLICE_RAW_FIELDS} snapshot={run.policeSnapshot as any} rawView={rawView} />}
      {hasBanking && <DeptBlock title="Core Banking & NPCI Aadhaar-Seeded Record" fields={BANKING_RAW_FIELDS} snapshot={run.bankingSnapshot as any} rawView={rawView} />}
      {hasWelfare && <DeptBlock title="Public Distribution System (PDS) Welfare Record" fields={WELFARE_RAW_FIELDS} snapshot={run.welfareSnapshot as any} rawView={rawView} />}
      {hasMunicipal && <DeptBlock title="Municipal Land Registry & Urban Property Record" fields={MUNICIPAL_RAW_FIELDS} snapshot={run.municipalSnapshot as any} rawView={rawView} />}
    </div>
  );
}
