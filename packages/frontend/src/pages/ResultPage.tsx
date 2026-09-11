import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DataMinimizationToggle } from '../components/DataMinimizationToggle';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { WorkflowRun } from '../types';
import { useAuthStore } from '../store/authStore';
import { ClipboardList, RotateCcw } from 'lucide-react';

export function ResultPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { name } = useAuthStore();
  const [run, setRun] = React.useState<WorkflowRun | null>(null);

  React.useEffect(() => {
    if (runId) api.getWorkflow(runId).then(setRun).catch(console.error);
  }, [runId]);

  const eligible = run?.eligibleResult;
  const isEligible = eligible === true;

  return (
    <AppShell>
      <div>
        {/* Result banner */}
        {run && (
          <div style={{ background: isEligible ? 'var(--color-success-bg)' : 'var(--color-error-bg)', borderLeft: `4px solid ${isEligible ? 'var(--color-success)' : 'var(--color-error)'}`, padding: '32px clamp(24px,6vw,64px)' }}>
            <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
              <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 12px', lineHeight: 1.15 }}>
                {isEligible ? `Congratulations, ${name?.split(' ')[0]}.` : `Application unsuccessful, ${name?.split(' ')[0]}.`}
              </h1>
              <p style={{ margin: '0 0 8px', fontSize: '1rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.65 }}>
                {isEligible ? 'You are eligible for the National Merit Scholarship 2025.' : 'Your income band does not meet the threshold for this scholarship.'}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"JetBrains Mono", monospace' }}>
                Run: {runId?.slice(0, 12)}… · Assessed at {run ? new Date(run.updatedAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '40px 24px' }}>
          {/* Data review */}
          {run && (
            <div style={{ marginBottom: 40 }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Data Review</p>
              <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.65, maxWidth: 560 }}>
                This shows the data used in your eligibility decision. Switch to "What Service Received" to see what the scholarship service actually had access to — demonstrating that sensitive fields were never transmitted.
              </p>
              <DataMinimizationToggle run={run} />
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--color-border-subtle)', marginBottom: 32 }} />

          {/* Next steps */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ margin: '0 0 12px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Next Steps</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.65, maxWidth: 560 }}>
              {isEligible ? 'A scholarship confirmation will be sent to your registered contact. You can view the complete audit trail of data accesses made during this application.' : 'You may apply for other scholarships or contact support if you believe this result is incorrect. The audit trail provides a full record of data accesses.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => navigate('/audit')}>
              <ClipboardList size={16} />View Audit Trail
            </Button>
            <Button onClick={() => navigate('/services')}>
              <RotateCcw size={16} />{isEligible ? 'Apply for Another' : 'Back to Services'}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
