
import { WorkflowRun, WorkflowState } from '../types';
import { CheckCircle, Circle, XCircle, Loader } from 'lucide-react';

const STEPS: { state: WorkflowState; label: string; description?: string }[] = [
  { state: 'AWAITING_CONSENT', label: 'Consent Granted' },
  { state: 'IDENTITY_VERIFY', label: 'Identity Verification' },
  { state: 'EDUCATION_VERIFY', label: 'Education Verification' },
  { state: 'INCOME_VERIFY', label: 'Income Verification' },
  { state: 'ELIGIBILITY_CALC', label: 'Eligibility Calculation' },
  { state: 'SUBMITTED', label: 'Result Ready' },
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
      {STEPS.map((step, i) => {
        const status = getStepStatus(step.state, run.state, isFailed);
        const isLast = i === STEPS.length - 1;

        const iconColor = { done: 'var(--color-success)', active: 'var(--color-accent-primary)', pending_retry: 'var(--color-accent-amber)', failed: 'var(--color-error)', upcoming: 'var(--color-border-default)' }[status];

        const snapshot = step.state === 'IDENTITY_VERIFY' ? run.identitySnapshot
          : step.state === 'EDUCATION_VERIFY' ? run.educationSnapshot
          : step.state === 'INCOME_VERIFY' ? run.incomeSnapshot
          : null;

        return (
          <div key={step.state} style={{ display: 'flex', gap: 16 }}>
            {/* Timeline column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ color: iconColor, display: 'flex', marginTop: 16 }}>
                {status === 'done' ? <CheckCircle size={20} /> : status === 'failed' ? <XCircle size={20} /> : status === 'pending_retry' || status === 'active' ? <Loader size={20} className={status === 'active' || status === 'pending_retry' ? 'animate-spin' : ''} style={{ animation: (status === 'active' || status === 'pending_retry') ? 'spin 1.5s linear infinite' : 'none' }} /> : <Circle size={20} />}
              </div>
              {!isLast && (
                <div style={{ width: 2, flex: 1, minHeight: 32, background: status === 'done' ? 'var(--color-success)' : 'var(--color-border-subtle)', opacity: 0.5, marginTop: 4, marginBottom: 4 }} />
              )}
            </div>

            {/* Content */}
            <div style={{ paddingTop: 14, paddingBottom: isLast ? 0 : 8, flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: status === 'upcoming' ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
                {step.label}
              </p>
              {status === 'done' && snapshot && (
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
                  {step.state === 'IDENTITY_VERIFY' && `${(snapshot as any).name} · ${(snapshot as any).source}`}
                  {step.state === 'EDUCATION_VERIFY' && `${(snapshot as any).institution} · ${(snapshot as any).enrollmentStatus}`}
                  {step.state === 'INCOME_VERIFY' && `Band: ${(snapshot as any).eligibilityBand} · Meets threshold: ${(snapshot as any).meetsThreshold ? 'Yes' : 'No'}`}
                </p>
              )}
              {status === 'pending_retry' && (
                <div style={{ marginTop: 6 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: 'var(--color-accent-amber)', fontFamily: '"Inter", system-ui, sans-serif' }}>
                    ⟳ Attempt {run.retryCount + 1}/3 — Revenue service unavailable, retrying…
                  </p>
                  <div style={{ height: 2, background: 'var(--color-bg-sunken)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '60%', background: 'var(--color-accent-amber)', borderRadius: 1, animation: 'pulse 2s ease-in-out infinite' }} />
                  </div>
                </div>
              )}
              {status === 'failed' && isFailed && (
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-error)', fontFamily: '"Inter", system-ui, sans-serif' }}>
                  {run.failureReason?.replace('CONSENT_REVOKED:', 'Consent revoked: ') ?? run.lastError ?? 'An error occurred'}
                </p>
              )}
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:0.6 } 50% { opacity:1 } }
      `}</style>
    </div>
  );
}
