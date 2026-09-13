import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { WorkflowStepper } from '../components/WorkflowStepper';
import { ConsentRevokePanel } from '../components/ConsentRevokePanel';
import { DataMinimizationToggle } from '../components/DataMinimizationToggle';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { WorkflowRun } from '../types';
import { useAuthStore } from '../store/authStore';
import { CheckCircle2, ArrowRight, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

const TERMINAL_STATES = new Set(['SUBMITTED', 'FAILED']);

const SERVICE_COMPLETION_INFO: Record<string, { count: number; departments: string }> = {
  SCHOLARSHIP: {
    count: 3,
    departments: 'Identity, University Enrollment, and Income Band',
  },
  TRANSPORT: {
    count: 5,
    departments: 'Identity, Driving Licence, Police Clearance, Banking KYC, and Municipal Property',
  },
  WELFARE: {
    count: 4,
    departments: 'Identity, Income Band, Welfare Registry, and Bank DBT Seeding',
  },
};

export function StatusPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { name } = useAuthStore();
  const [run, setRun] = React.useState<WorkflowRun | null>(null);
  const [error, setError] = React.useState('');
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = React.useCallback(async () => {
    if (!runId) return;
    try {
      const data = await api.getWorkflow(runId);
      setRun(data);
      if (TERMINAL_STATES.has(data.state)) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (data.state === 'SUBMITTED' && countdown === null) {
          setCountdown(4);
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, [runId, countdown]);

  React.useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 1500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus]);

  React.useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      navigate(`/result/${runId}`);
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, runId, navigate]);

  if (error) {
    return (
      <AppShell>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ padding: '24px', background: 'var(--color-error-bg)', borderLeft: '4px solid var(--color-error)', borderRadius: '0 8px 8px 0' }}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--color-error)', fontFamily: '"Playfair Display", serif' }}>Unable to load application</h3>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{error}</p>
            <Button style={{ marginTop: 16 }} onClick={() => navigate('/services')}>Back to Services</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const isCompleted = run?.state === 'SUBMITTED';

  return (
    <AppShell>
      <div style={{ maxWidth: '68rem', margin: '0 auto', padding: '48px 24px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
              Multi-Agency Workflow Orchestration
            </span>
            <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '8px 0 8px', lineHeight: 1.25 }}>
              {isCompleted ? 'Application Verified & Assessed' : 'Verifying Department Records…'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
              Applicant: <strong>{name}</strong> · Tracking ID: <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8125rem' }}>{runId}</span>
            </p>
          </div>

          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: isCompleted ? 'var(--color-success-bg)' : 'var(--color-bg-surface)', border: `1px solid ${isCompleted ? 'var(--color-success)' : 'var(--color-border-default)'}`, borderRadius: 20 }}>
            {isCompleted ? (
              <>
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-success)', letterSpacing: '0.05em' }}>
                  Decision Ready
                </span>
              </>
            ) : run?.state === 'PENDING' ? (
              <>
                <RefreshCw size={14} color="var(--color-accent-amber)" className="animate-spin" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-accent-amber)', letterSpacing: '0.05em' }}>
                  Auto-Retry in Progress
                </span>
              </>
            ) : (
              <>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent-primary)', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-accent-primary)', letterSpacing: '0.05em' }}>
                  Live Interoperability Active
                </span>
              </>
            )}
          </div>
        </div>

        {/* Completion action banner */}
        {isCompleted && (
          <div
            style={{
              marginBottom: 32,
              padding: '20px 24px',
              background: 'linear-gradient(135deg, rgba(29, 122, 82, 0.08) 0%, rgba(29, 122, 82, 0.02) 100%)',
              border: '1.5px solid var(--color-success)',
              borderRadius: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              {(() => {
                const sType = run?.serviceType || 'SCHOLARSHIP';
                const info = SERVICE_COMPLETION_INFO[sType] || SERVICE_COMPLETION_INFO.SCHOLARSHIP;
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Sparkles size={18} color="var(--color-success)" />
                      <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: '"Playfair Display", Georgia, serif' }}>
                        All {info.count} Department Verifications Completed Successfully!
                      </h3>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", sans-serif' }}>
                      {info.departments} were processed and SHA-256 hash-chain audited.
                      {countdown !== null && ` Auto-opening certificate in ${countdown}s…`}
                    </p>
                  </>
                );
              })()}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button size="lg" onClick={() => navigate(`/result/${runId}`)}>
                View Official Decision &amp; Certificate <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Failed state */}
        {run?.state === 'FAILED' && (
          <div style={{ marginBottom: 32, padding: '24px', background: 'var(--color-error-bg)', borderLeft: '4px solid var(--color-error)', borderRadius: '0 8px 8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ShieldAlert size={20} color="var(--color-error)" />
              <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.35rem', fontWeight: 600, color: 'var(--color-error)', margin: 0 }}>
                {run.failureReason === 'UNLINKED_FEDERATION_RECORD'
                  ? 'Verification Halted — Department Federation Required'
                  : 'Workflow Blocked by Consent / Policy Guard'}
              </h2>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.65 }}>
              {run.failureReason === 'UNLINKED_FEDERATION_RECORD'
                ? 'Department Records Not Linked: This citizen account was self-registered and has no linked records in the federated IdentityMap (UIDAI Aadhaar, CBDT PAN, NAD Higher Education, etc.). In GovLink’s federated architecture, cross-department data minimization requires an active IdentityMap. To experience full end-to-end multi-agency verification, please sign in with one of the 50 Reference Personas using credentials from DEMO_CREDENTIALS.md.'
                : run.failureReason?.startsWith('CONSENT_REVOKED')
                ? `Data transfer was blocked immediately because consent for ${run.failureReason.split(':')[1]} was revoked by the applicant.`
                : run.failureReason === 'MAX_RETRIES_EXCEEDED'
                ? 'The simulated revenue service did not respond after 3 automated attempts.'
                : run.lastError ?? 'An unexpected error occurred during orchestration.'}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button onClick={() => navigate('/services')}>Start New Application</Button>
              <Button variant="secondary" onClick={() => navigate('/audit')}>Inspect Audit Chain</Button>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        {run && (
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            {/* Left — stepper & data minimization preview */}
            <div style={{ flex: '1 1 450px' }}>
              <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: 10, padding: 24, marginBottom: 24 }}>
                <WorkflowStepper run={run} />
              </div>

              <DataMinimizationToggle run={run} />
            </div>

            {/* Right — consent panel */}
            <div style={{ flex: '0 1 320px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 10, padding: 24, height: 'fit-content' }}>
              {run.consents.length > 0 ? (
                <ConsentRevokePanel artefacts={run.consents} runId={run.id} onRevoked={fetchStatus} />
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
                  Loading consent status…
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
