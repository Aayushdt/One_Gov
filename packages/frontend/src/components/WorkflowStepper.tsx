import { WorkflowRun, WorkflowState } from '../types';
import { CheckCircle2, Circle, XCircle, Loader2, ShieldCheck, GraduationCap, Banknote, Award } from 'lucide-react';

const STEPS: { state: WorkflowState; label: string; agency: string; icon: any }[] = [
  { state: 'AWAITING_CONSENT', label: 'Consent Granted by Citizen', agency: 'Citizen Authorization', icon: ShieldCheck },
  { state: 'IDENTITY_VERIFY', label: 'Identity & Age Verification', agency: 'Identity Department Registry', icon: ShieldCheck },
  { state: 'EDUCATION_VERIFY', label: 'Enrolment & GPA Verification', agency: 'University Registrar Database', icon: GraduationCap },
  { state: 'INCOME_VERIFY', label: 'Income Band Check (Minimized)', agency: 'Revenue & Tax Department', icon: Banknote },
  { state: 'ELIGIBILITY_CALC', label: 'Policy Rule Evaluation', agency: 'Scholarship Decision Engine', icon: Award },
  { state: 'SUBMITTED', label: 'Official Decision Ready', agency: 'GovLink Core Orchestrator', icon: CheckCircle2 },
];

const ORDER: WorkflowState[] = ['AWAITING_CONSENT', 'IDENTITY_VERIFY', 'EDUCATION_VERIFY', 'INCOME_VERIFY', 'ELIGIBILITY_CALC', 'SUBMITTED'];

function getStepStatus(stepState: WorkflowState, currentState: WorkflowState, failed: boolean): 'done' | 'active' | 'pending_retry' | 'failed' | 'upcoming' {
  const stepIdx = ORDER.indexOf(stepState);
  const currentIdx = ORDER.indexOf(currentState === 'PENDING' ? 'INCOME_VERIFY' : currentState);
  if (failed && stepIdx === currentIdx) return 'failed';
  if (currentState === 'PENDING' && stepState === 'INCOME_VERIFY') return 'pending_retry';
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'upcoming';
}

export function WorkflowStepper({ run }: { run: WorkflowRun }) {
  const isFailed = run.state === 'FAILED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ margin: '0 0 2px', fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-primary)', fontFamily: '"Inter", sans-serif' }}>
          Real-Time Verification Pipeline
        </p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", sans-serif' }}>
          Interoperability middleware orchestrating department responses with zero data retention.
        </p>
      </div>

      {STEPS.map((step, i) => {
        const status = getStepStatus(step.state, run.state, isFailed);
        const isLast = i === STEPS.length - 1;

        const snapshot =
          step.state === 'IDENTITY_VERIFY'
            ? run.identitySnapshot
            : step.state === 'EDUCATION_VERIFY'
            ? run.educationSnapshot
            : step.state === 'INCOME_VERIFY'
            ? run.incomeSnapshot
            : null;

        const iconColor =
          status === 'done'
            ? 'var(--color-success)'
            : status === 'active'
            ? 'var(--color-accent-primary)'
            : status === 'pending_retry'
            ? 'var(--color-accent-amber)'
            : status === 'failed'
            ? 'var(--color-error)'
            : 'var(--color-border-default)';

        return (
          <div key={step.state} style={{ display: 'flex', gap: 16 }}>
            {/* Timeline column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ color: iconColor, display: 'flex', marginTop: 12 }}>
                {status === 'done' ? (
                  <CheckCircle2 size={22} color="var(--color-success)" />
                ) : status === 'failed' ? (
                  <XCircle size={22} color="var(--color-error)" />
                ) : status === 'pending_retry' || status === 'active' ? (
                  <Loader2 size={22} color="var(--color-accent-primary)" style={{ animation: 'spin 1.2s linear infinite' }} />
                ) : (
                  <Circle size={22} color="var(--color-border-default)" />
                )}
              </div>
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 40,
                    background: status === 'done' ? 'var(--color-success)' : 'var(--color-border-subtle)',
                    opacity: 0.6,
                    marginTop: 4,
                    marginBottom: 4,
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div style={{ paddingTop: 12, paddingBottom: isLast ? 0 : 16, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: status === 'upcoming' ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
                  {step.label}
                </p>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
                  · {step.agency}
                </span>
              </div>

              {status === 'done' && snapshot && (
                <div style={{ marginTop: 6, padding: '6px 10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 6, fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", sans-serif' }}>
                  {step.state === 'IDENTITY_VERIFY' && (
                    <span>
                      ✓ <strong>{(snapshot as any).name}</strong> · DOB: {(snapshot as any).dob} · {(snapshot as any).docType ?? 'Gov ID Verified'}
                    </span>
                  )}
                  {step.state === 'EDUCATION_VERIFY' && (
                    <span>
                      ✓ <strong>{(snapshot as any).institution}</strong> · {(snapshot as any).program ?? (snapshot as any).enrollmentStatus} · CGPA: {(snapshot as any).cgpa ?? 'Verified'}
                    </span>
                  )}
                  {step.state === 'INCOME_VERIFY' && (
                    <span>
                      ✓ Band: <strong>{(snapshot as any).eligibilityBand}</strong> · Threshold (&lt;₹3L): <strong>{(snapshot as any).meetsThreshold ? 'Eligible' : 'Exceeds'}</strong> · {(snapshot as any).taxYear ?? 'AY 24-25'}
                    </span>
                  )}
                </div>
              )}

              {status === 'pending_retry' && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--color-warning-bg)', borderLeft: '3px solid var(--color-accent-amber)', borderRadius: '0 6px 6px 0' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 600, color: '#7a5800', fontFamily: '"Inter", sans-serif' }}>
                    ⟳ Attempt {run.retryCount + 1}/3 — Revenue service upstream 503 fault detected. Automated BullMQ exponential backoff in progress…
                  </p>
                  <div style={{ height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '70%', background: 'var(--color-accent-amber)', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                </div>
              )}

              {status === 'failed' && isFailed && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--color-error-bg)', borderLeft: '3px solid var(--color-error)', borderRadius: '0 6px 6px 0' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-error)', fontFamily: '"Inter", sans-serif' }}>
                    {run.failureReason?.replace('CONSENT_REVOKED:', 'Access blocked: Consent revoked for ') ?? run.lastError ?? 'An orchestration error occurred.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:0.5 } 50% { opacity:1 } }
      `}</style>
    </div>
  );
}
