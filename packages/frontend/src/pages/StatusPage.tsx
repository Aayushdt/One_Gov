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

const TERMINAL_STATES = new Set(['SUBMITTED', 'FAILED']);

export function StatusPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { name } = useAuthStore();
  const [run, setRun] = React.useState<WorkflowRun | null>(null);
  const [error, setError] = React.useState('');
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = React.useCallback(async () => {
    if (!runId) return;
    try {
      const data = await api.getWorkflow(runId);
      setRun(data);
      if (TERMINAL_STATES.has(data.state)) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (data.state === 'SUBMITTED') navigate(`/result/${runId}`);
      }
    } catch (e: any) { setError(e.message); }
  }, [runId, navigate]);

  React.useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchStatus]);

  if (error) return (
    <AppShell>
      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '48px 24px' }}>
        <p style={{ color: 'var(--color-error)', fontFamily: '"Inter", system-ui, sans-serif' }}>Error: {error}</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Application · In Progress</p>
          <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 1.25 }}>Processing your application</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
            {name} · Run <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8125rem' }}>{runId?.slice(0, 12)}…</span>
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border-subtle)', marginBottom: 32 }} />

        {/* Failed state */}
        {run?.state === 'FAILED' && (
          <div style={{ marginBottom: 32, paddingLeft: 20, borderLeft: '4px solid var(--color-error)' }}>
            <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-error)', margin: '0 0 12px' }}>Application failed</h2>
            <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.65 }}>
              {run.failureReason?.startsWith('CONSENT_REVOKED') ? `Income consent was revoked before verification completed.` : run.failureReason === 'MAX_RETRIES_EXCEEDED' ? 'Revenue service did not respond after 3 attempts.' : run.lastError ?? 'An unexpected error occurred.'}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button onClick={() => navigate('/services')}>Start New Application</Button>
              <Button variant="secondary" onClick={() => navigate('/audit')}>View Audit Trail</Button>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        {run && (
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            {/* Left — stepper */}
            <div style={{ flex: '1 1 400px' }}>
              <WorkflowStepper run={run} />
              <DataMinimizationToggle run={run} />
            </div>

            {/* Right — consent panel */}
            <div style={{ flex: '0 1 280px', paddingTop: 4, borderLeft: '1px solid var(--color-border-subtle)', paddingLeft: 32 }}>
              {run.consents.length > 0 ? (
                <ConsentRevokePanel artefacts={run.consents} runId={run.id} onRevoked={fetchStatus} />
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Loading consent status…</p>
              )}
            </div>
          </div>
        )}

        {!run && <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Loading application status…</p>}
      </div>
    </AppShell>
  );
}
