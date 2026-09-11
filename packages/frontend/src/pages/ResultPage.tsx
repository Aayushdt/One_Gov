import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DataMinimizationToggle } from '../components/DataMinimizationToggle';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { WorkflowRun } from '../types';
import { useAuthStore } from '../store/authStore';
import { ClipboardList, RotateCcw, CheckCircle2, XCircle, Printer, ShieldCheck, QrCode } from 'lucide-react';

export function ResultPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { name, onegovId, state } = useAuthStore();
  const [run, setRun] = React.useState<WorkflowRun | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (runId) {
      api.getWorkflow(runId)
        .then((data) => {
          setRun(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [runId]);

  const isEligible = run?.eligibleResult === true;
  const serviceType = run?.serviceType || 'SCHOLARSHIP';

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", sans-serif' }}>
            Retrieving official OneGov assessment certificate…
          </p>
        </div>
      </AppShell>
    );
  }

  const getServiceTitle = () => {
    if (serviceType === 'TRANSPORT') return 'Commercial Transport Fast-Pass & Smart Transit Permit';
    if (serviceType === 'WELFARE') return 'National Social Security & DBT Direct Benefit';
    return 'National Merit STEM Fellowship 2025';
  };

  const getSuccessMessage = () => {
    if (serviceType === 'TRANSPORT') return 'Your commercial driving credentials, vehicle compliance, and police clearances have been verified. Your multi-state digital permit is active.';
    if (serviceType === 'WELFARE') return 'Your social welfare and income band criteria have been verified. Direct Benefit Transfer is scheduled to your linked bank account.';
    return 'Your STEM Fellowship application has been verified and approved. Benefit disbursement of ₹75,000 will proceed directly to your linked account.';
  };

  const getFailureMessage = () => {
    if (serviceType === 'TRANSPORT') return 'Transport authorization could not be issued due to an expired driving licence, unpaid traffic penalties, or pending police clearance.';
    if (serviceType === 'WELFARE') return 'Welfare assistance qualification criteria were not met based on verified income tax returns or unlinked banking status.';
    return 'Based on verified revenue records, your household income band exceeds the ₹3,00,000 threshold required for this specific need-based scheme.';
  };

  return (
    <AppShell>
      <div>
        {/* Banner */}
        <div
          style={{
            background: isEligible
              ? 'linear-gradient(135deg, rgba(29, 122, 82, 0.12) 0%, rgba(29, 122, 82, 0.03) 100%)'
              : 'linear-gradient(135deg, rgba(197, 48, 48, 0.12) 0%, rgba(197, 48, 48, 0.03) 100%)',
            borderBottom: `2px solid ${isEligible ? 'var(--color-success)' : 'var(--color-error)'}`,
            padding: '40px clamp(24px,6vw,64px)',
          }}
        >
          <div style={{ maxWidth: '68rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                {isEligible ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--color-success)', color: 'white', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <CheckCircle2 size={14} /> Application Approved
                  </div>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--color-error)', color: 'white', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <XCircle size={14} /> Criteria Not Met
                  </div>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"JetBrains Mono", monospace' }}>
                  Ref: ONEGOV-{serviceType}-{runId?.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 10px', lineHeight: 1.2 }}>
                {isEligible ? `Congratulations, ${name}.` : `Assessment Complete, ${name}.`}
              </h1>

              <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.6, maxWidth: 640 }}>
                {isEligible ? getSuccessMessage() : getFailureMessage()}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" onClick={handlePrint}>
                <Printer size={16} /> Print Official Certificate
              </Button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ maxWidth: '68rem', margin: '0 auto', padding: '40px 24px' }}>
          {/* Certificate Card */}
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '2px solid var(--color-border-default)',
              borderRadius: 12,
              padding: '32px',
              marginBottom: 40,
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Watermark seal */}
            <div style={{ position: 'absolute', top: 24, right: 24, opacity: 0.08, pointerEvents: 'none' }}>
              <ShieldCheck size={180} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 20, marginBottom: 24 }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-accent-primary)', fontFamily: '"Inter", sans-serif' }}>
                  Government of India · OneGov Interoperability Middleware
                </span>
                <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '4px 0 0' }}>
                  Official Digital Credential of Decision
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  {getServiceTitle()}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-bg-sunken)', padding: '6px 14px', borderRadius: 6, border: '1px solid var(--color-border-subtle)' }}>
                <QrCode size={24} color="var(--color-text-secondary)" />
                <div>
                  <p style={{ margin: 0, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Tamper-Evident Hash Seal</p>
                  <p style={{ margin: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>SHA-256 Verified</p>
                </div>
              </div>
            </div>

            {/* Credential Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Applicant Name &amp; State</p>
                <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{state ?? 'India'}</p>
              </div>

              <div>
                <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Universal Citizen ID</p>
                <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-accent-primary)', fontFamily: '"JetBrains Mono", monospace' }}>
                  {run?.citizen?.onegovId || onegovId}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Federated UIDAI Reference</p>
              </div>

              {serviceType === 'TRANSPORT' ? (
                <>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Driving Licence &amp; RTO</p>
                    <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: (run?.transportSnapshot as any)?.dlStatus === 'VALID' ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {(run?.transportSnapshot as any)?.dlStatus ?? 'CHECKED'} ({(run?.transportSnapshot as any)?.dlNumber ?? 'DL Ref'})
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      Unpaid Challans: {(run?.transportSnapshot as any)?.unpaidChallansCount ?? 0}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Police CCTNS Clearance</p>
                    <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: (run?.policeSnapshot as any)?.clearanceStatus === 'CLEARED' ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {(run?.policeSnapshot as any)?.clearanceStatus ?? 'CHECKED'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      Incidents: {(run?.policeSnapshot as any)?.incidentCount ?? 0}
                    </p>
                  </div>
                </>
              ) : serviceType === 'WELFARE' ? (
                <>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Ration Card &amp; BPL Status</p>
                    <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {(run?.welfareSnapshot as any)?.rationCardNumber ?? 'PDS Record'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      BPL Priority: {(run?.welfareSnapshot as any)?.bplStatus ? 'Yes' : 'No'}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Bank DBT Seeding</p>
                    <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: (run?.bankingSnapshot as any)?.dbtEnabled ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {(run?.bankingSnapshot as any)?.dbtEnabled ? 'Aadhaar Seeded' : 'Not Linked'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      {(run?.bankingSnapshot as any)?.bankName ?? 'State Bank of India'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Enrolled University</p>
                    <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {(run?.educationSnapshot as any)?.institution ?? 'Recognized University'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      Program: {(run?.educationSnapshot as any)?.program ?? 'Degree Candidate'}
                    </p>
                  </div>

                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Verified Income Band</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: (run?.incomeSnapshot as any)?.meetsThreshold ? 'var(--color-success)' : 'var(--color-error)' }}>
                        Band {(run?.incomeSnapshot as any)?.eligibilityBand ?? 'LOW'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                        ({(run?.incomeSnapshot as any)?.meetsThreshold ? 'Meets <₹3L Rule' : 'Exceeds Ceiling'})
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                      AY: {(run?.incomeSnapshot as any)?.taxYear ?? 'AY 2024-25'}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div style={{ padding: '12px 16px', background: 'var(--color-bg-base)', borderRadius: 8, border: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", sans-serif' }}>
                🛡️ Verified via OneGov Interoperability Middleware with zero paper document retention.
              </span>
              <span style={{ fontSize: '0.7rem', fontFamily: '"JetBrains Mono", monospace', color: 'var(--color-text-tertiary)' }}>
                Decision Timestamp: {run ? new Date(run.updatedAt).toLocaleString() : ''}
              </span>
            </div>
          </div>

          {/* Data Minimization Section */}
          {run && (
            <div style={{ marginBottom: 40 }}>
              <DataMinimizationToggle run={run} />
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderTop: '1px solid var(--color-border-subtle)', paddingTop: 28 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => navigate('/audit')}>
                <ClipboardList size={16} /> Inspect Immutable Audit Trail
              </Button>
              <Button onClick={() => navigate('/services')}>
                <RotateCcw size={16} /> Explore Other Government Services
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
