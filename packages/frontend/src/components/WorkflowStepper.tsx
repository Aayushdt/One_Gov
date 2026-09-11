import { WorkflowRun, WorkflowState } from '../types';
import { CheckCircle2, Circle, XCircle, Loader2, ShieldCheck, GraduationCap, Banknote, Award, Car, ShieldAlert, Landmark, HeartHandshake } from 'lucide-react';

const SERVICE_STEPS: Record<string, { state: WorkflowState; label: string; agency: string; icon: any }[]> = {
  SCHOLARSHIP: [
    { state: 'AWAITING_CONSENT', label: 'Citizen Consent Authorization', agency: 'Citizen Gateway', icon: ShieldCheck },
    { state: 'IDENTITY_VERIFY', label: 'Demographic & UID Verification', agency: 'UIDAI Identity Silo', icon: ShieldCheck },
    { state: 'EDUCATION_VERIFY', label: 'University Enrolment & CGPA', agency: 'Higher Education (NAD)', icon: GraduationCap },
    { state: 'INCOME_VERIFY', label: 'Income Band Check (Zero-Knowledge)', agency: 'Income Tax CBDT', icon: Banknote },
    { state: 'ELIGIBILITY_CALC', label: 'Merit-Cum-Means Policy Assessment', agency: 'OneGov Decision Engine', icon: Award },
    { state: 'SUBMITTED', label: 'Official Decision Ready', agency: 'OneGov Core Orchestrator', icon: CheckCircle2 },
  ],
  TRANSPORT: [
    { state: 'AWAITING_CONSENT', label: 'Citizen Consent Authorization', agency: 'Citizen Gateway', icon: ShieldCheck },
    { state: 'IDENTITY_VERIFY', label: 'Demographic & UID Verification', agency: 'UIDAI Identity Silo', icon: ShieldCheck },
    { state: 'TRANSPORT_VERIFY', label: 'Driving Licence & Challan Check', agency: 'Parivahan RTO Silo', icon: Car },
    { state: 'POLICE_VERIFY', label: 'Character & Crime Clearance', agency: 'Police CCTNS Registry', icon: ShieldAlert },
    { state: 'BANKING_VERIFY', label: 'e-KYC & FASTag Transit Wallet', agency: 'Core Banking NPCI', icon: Landmark },
    { state: 'ELIGIBILITY_CALC', label: 'Commercial Transit Endorsement', agency: 'OneGov Decision Engine', icon: Award },
    { state: 'SUBMITTED', label: 'Digital Permit Generated', agency: 'OneGov Core Orchestrator', icon: CheckCircle2 },
  ],
  WELFARE: [
    { state: 'AWAITING_CONSENT', label: 'Citizen Consent Authorization', agency: 'Citizen Gateway', icon: ShieldCheck },
    { state: 'IDENTITY_VERIFY', label: 'Demographic & UID Verification', agency: 'UIDAI Identity Silo', icon: ShieldCheck },
    { state: 'INCOME_VERIFY', label: 'Income Band Check (Zero-Knowledge)', agency: 'Income Tax CBDT', icon: Banknote },
    { state: 'WELFARE_VERIFY', label: 'Ration Card & Scheme Registry', agency: 'Public Welfare PDS', icon: HeartHandshake },
    { state: 'BANKING_VERIFY', label: 'Aadhaar-Seeded Bank Account', agency: 'Core Banking NPCI', icon: Landmark },
    { state: 'ELIGIBILITY_CALC', label: 'Direct Benefit Policy Evaluation', agency: 'OneGov Decision Engine', icon: Award },
    { state: 'SUBMITTED', label: 'Benefit Direct Deposit Scheduled', agency: 'OneGov Core Orchestrator', icon: CheckCircle2 },
  ],
};

function getRetryStep(run: WorkflowRun): WorkflowState {
  // The step that was active when PENDING was set is recorded in stateHistory
  if (run.stateHistory && run.stateHistory.length > 0) {
    const lastTransition = run.stateHistory[run.stateHistory.length - 1];
    if (lastTransition.toState === 'PENDING' || lastTransition.fromState === 'PENDING') {
      return lastTransition.fromState !== 'PENDING' ? lastTransition.fromState : 'INCOME_VERIFY';
    }
  }
  return 'INCOME_VERIFY'; // default fallback
}

function getStepStatus(stepState: WorkflowState, currentState: WorkflowState, order: WorkflowState[], failed: boolean, retryStep: WorkflowState): 'done' | 'active' | 'pending_retry' | 'failed' | 'upcoming' {
  const stepIdx = order.indexOf(stepState);
  const resolvedCurrent = currentState === 'PENDING' ? retryStep : currentState;
  const currentIdx = order.indexOf(resolvedCurrent);
  if (failed && stepIdx === currentIdx) return 'failed';
  if (currentState === 'PENDING' && stepState === retryStep) return 'pending_retry';
  if (stepIdx < currentIdx || currentState === 'SUBMITTED') return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'upcoming';
}

export function WorkflowStepper({ run }: { run: WorkflowRun }) {
  const isFailed = run.state === 'FAILED';
  const serviceType = run.serviceType || 'SCHOLARSHIP';
  const steps = SERVICE_STEPS[serviceType] || SERVICE_STEPS.SCHOLARSHIP;
  const order = steps.map((s) => s.state);
  const retryStep = getRetryStep(run);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ margin: '0 0 2px', fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-primary)', fontFamily: '"Inter", sans-serif' }}>
          Federated Verification Pipeline ({serviceType})
        </p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", sans-serif' }}>
          OneGov orchestrates department responses live with strict data minimization.
        </p>
      </div>

      {steps.map((step, i) => {
        const status = getStepStatus(step.state, run.state, order, isFailed, retryStep);
        const isLast = i === steps.length - 1;

        const snapshot =
          step.state === 'IDENTITY_VERIFY'
            ? run.identitySnapshot
            : step.state === 'EDUCATION_VERIFY'
            ? run.educationSnapshot
            : step.state === 'INCOME_VERIFY'
            ? run.incomeSnapshot
            : step.state === 'TRANSPORT_VERIFY'
            ? run.transportSnapshot
            : step.state === 'POLICE_VERIFY'
            ? run.policeSnapshot
            : step.state === 'BANKING_VERIFY'
            ? run.bankingSnapshot
            : step.state === 'WELFARE_VERIFY'
            ? run.welfareSnapshot
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
                    minHeight: 36,
                    background: status === 'done' ? 'var(--color-success)' : 'var(--color-border-subtle)',
                    opacity: 0.6,
                    marginTop: 4,
                    marginBottom: 4,
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div style={{ paddingTop: 12, paddingBottom: isLast ? 0 : 14, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: status === 'upcoming' ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)', fontFamily: '"Inter", sans-serif' }}>
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
                  {step.state === 'TRANSPORT_VERIFY' && (
                    <span>
                      ✓ DL: <strong>{(snapshot as any).dlNumber}</strong> · Status: <strong>{(snapshot as any).dlStatus}</strong> · Unpaid Challans: {(snapshot as any).unpaidChallansCount}
                    </span>
                  )}
                  {step.state === 'POLICE_VERIFY' && (
                    <span>
                      ✓ Clearance: <strong>{(snapshot as any).clearanceStatus}</strong> · Station: {(snapshot as any).jurisdictionStation ?? 'City Police'}
                    </span>
                  )}
                  {step.state === 'BANKING_VERIFY' && (
                    <span>
                      ✓ Bank: <strong>{(snapshot as any).bankName}</strong> · KYC: <strong>{(snapshot as any).kycStatus}</strong> · DBT Active: {(snapshot as any).dbtEnabled ? 'Yes' : 'No'}
                    </span>
                  )}
                  {step.state === 'WELFARE_VERIFY' && (
                    <span>
                      ✓ Ration Card: <strong>{(snapshot as any).rationCardNumber}</strong> · BPL Priority: {(snapshot as any).bplStatus ? 'Yes' : 'No'}
                    </span>
                  )}
                </div>
              )}

              {status === 'pending_retry' && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--color-warning-bg)', borderLeft: '3px solid var(--color-accent-amber)', borderRadius: '0 6px 6px 0' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 600, color: '#7a5800', fontFamily: '"Inter", sans-serif' }}>
                    ⟳ Attempt {run.retryCount + 1}/3 — Upstream department returned 503. BullMQ exponential backoff retry in progress…
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
