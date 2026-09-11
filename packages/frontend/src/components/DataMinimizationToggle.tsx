import React from 'react';
import { WorkflowRun } from '../types';

const IDENTITY_RAW_FIELDS = [
  { key: 'name', label: 'Full Name', rawLabel: 'fullName', inCDM: true },
  { key: 'dob', label: 'Date of Birth', rawLabel: 'dateOfBirth', inCDM: true },
  { key: 'verified', label: 'Verified', rawLabel: 'verified', inCDM: true },
  { key: 'source', label: 'Source System', rawLabel: 'source', inCDM: true },
];

const EDUCATION_RAW_FIELDS = [
  { key: 'institution', label: 'Institution', rawLabel: 'institutionName', inCDM: true },
  { key: 'enrollmentStatus', label: 'Enrollment Status', rawLabel: 'enrollmentStatus', inCDM: true },
  { key: 'source', label: 'Source System', rawLabel: 'source', inCDM: true },
];

const INCOME_RAW_FIELDS = [
  { key: 'incomeRange', label: 'Income Range', rawLabel: 'incomeRange', inCDM: false },
  { key: 'eligibilityBand', label: 'Eligibility Band', rawLabel: 'incomeBand', inCDM: true },
  { key: 'meetsThreshold', label: 'Meets Threshold', rawLabel: 'meetsThreshold', inCDM: true },
  { key: 'source', label: 'Source System', rawLabel: 'source', inCDM: true },
];

interface Props { run: WorkflowRun }

function FieldRow({ label, value, stripped }: { label: string; value?: string | boolean | number; stripped?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: stripped ? 'var(--color-border-default)' : 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', textDecoration: stripped ? 'line-through' : 'none' }}>
        {label}
      </span>
      {stripped ? (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-amber)', fontFamily: '"Inter", system-ui, sans-serif', fontStyle: 'italic' }}>field not transmitted</span>
      ) : (
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{String(value ?? '—')}</span>
      )}
    </div>
  );
}

function DeptBlock({ title, fields, snapshot, rawView }: { title: string; fields: typeof IDENTITY_RAW_FIELDS; snapshot: Record<string, unknown>; rawView: boolean }) {
  return (
    <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16, marginTop: 16 }}>
      <p style={{ margin: '0 0 12px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
        {title}
      </p>
      {fields.map(f => {
        if (!rawView && !f.inCDM) {
          return <FieldRow key={f.key} label={f.label} stripped />;
        }
        return <FieldRow key={f.key} label={rawView ? f.rawLabel : f.key} value={snapshot[f.key] as string | boolean | number ?? snapshot[f.rawLabel] as string | boolean | number} />;
      })}
    </div>
  );
}

export function DataMinimizationToggle({ run }: Props) {
  const [rawView, setRawView] = React.useState(true);

  const hasIdentity = !!run.identitySnapshot;
  const hasEducation = !!run.educationSnapshot;
  const hasIncome = !!run.incomeSnapshot;

  if (!hasIdentity && !hasEducation && !hasIncome) return null;

  return (
    <div style={{ marginTop: 24, padding: 20, background: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
          Data Minimization Review
        </p>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1.5px solid var(--color-border-default)' }}>
          {(['raw', 'cdm'] as const).map((v) => (
            <button key={v} onClick={() => setRawView(v === 'raw')}
              style={{ padding: '6px 14px', fontSize: '0.8125rem', fontWeight: 600, fontFamily: '"Inter", system-ui, sans-serif', cursor: 'pointer', border: 'none', transition: 'all var(--duration-fast)', background: (v === 'raw') === rawView ? 'var(--color-accent-primary)' : 'transparent', color: (v === 'raw') === rawView ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)' }}>
              {v === 'raw' ? 'Raw Dept Record' : 'What Service Received'}
            </button>
          ))}
        </div>
      </div>

      {hasIdentity && <DeptBlock title="Identity Department" fields={IDENTITY_RAW_FIELDS} snapshot={run.identitySnapshot as any} rawView={rawView} />}
      {hasEducation && <DeptBlock title="Education Department" fields={EDUCATION_RAW_FIELDS} snapshot={run.educationSnapshot as any} rawView={rawView} />}
      {hasIncome && (
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16, marginTop: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Revenue Department</p>
          {!rawView && (
            <div style={{ padding: '8px 12px', background: 'var(--color-warning-bg)', borderLeft: '3px solid var(--color-accent-amber)', borderRadius: '0 4px 4px 0', marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#7a5800', fontFamily: '"Inter", system-ui, sans-serif' }}>
                ⚠ The raw income figure (<strong>incomeRange</strong>) was stripped by the Revenue connector and never reached this service. Only the eligibility band was transmitted.
              </p>
            </div>
          )}
          {INCOME_RAW_FIELDS.map(f => {
            if (!rawView && !f.inCDM) return <FieldRow key={f.key} label={f.label} stripped />;
            const val = (run.incomeSnapshot as any)?.[f.key] ?? (run.incomeSnapshot as any)?.[f.rawLabel];
            return <FieldRow key={f.key} label={rawView ? f.rawLabel : f.key} value={rawView && f.key === 'incomeRange' ? val ?? '(stored in connector only)' : val} />;
          })}
        </div>
      )}
    </div>
  );
}
