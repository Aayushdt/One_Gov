import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { WorkflowRun } from '../types';
import {
  Scale,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

export function AppealPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();

  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [existingAppeal, setExistingAppeal] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState<string>('INCOME');
  const [reason, setReason] = useState<string>('');
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    Promise.all([
      api.getWorkflow(runId).catch(() => null),
      api.getAppeals().catch(() => ({ appeals: [] })),
    ])
      .then(([runData, appealsData]) => {
        if (runData) setRun(runData);

        const found = appealsData?.appeals?.find((a: any) => a.runId === runId);
        if (found) {
          setExistingAppeal(found);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [runId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runId || !reason.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const appeal = await api.submitAppeal({
        runId,
        disputedCategory: category,
        reason: reason.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
      });
      setExistingAppeal(appeal);
    } catch (err: any) {
      setError(err.message || 'Failed to submit appeal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Loading application context…</p>
        </div>
      </AppShell>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPHELD':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid rgba(43,138,104,0.3)', fontWeight: 700, fontSize: '0.8rem' }}>
            <CheckCircle2 size={14} /> Appeal Upheld
          </span>
        );
      case 'DISMISSED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid rgba(196,58,34,0.3)', fontWeight: 700, fontSize: '0.8rem' }}>
            <AlertCircle size={14} /> Appeal Dismissed
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--color-bg-sunken)', color: 'var(--color-accent-primary)', border: '1px solid var(--color-border-subtle)', fontWeight: 700, fontSize: '0.8rem' }}>
            <Clock size={14} /> Under Review
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: '1px solid rgba(246,168,31,0.3)', fontWeight: 700, fontSize: '0.8rem' }}>
            <Clock size={14} /> Submitted
          </span>
        );
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: '52rem', margin: '0 auto', padding: '40px 24px' }}>
        {/* Back Link */}
        <button
          onClick={() => navigate(runId ? `/result/${runId}` : '/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            padding: 0,
            marginBottom: 24,
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> Back to Application Decision
        </button>

        {/* Header Card */}
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 12,
            padding: '28px 32px',
            marginBottom: 32,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'var(--color-warning-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-warning)',
              }}
            >
              <Scale size={22} />
            </div>
            <div>
              <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                Formal Administrative Appeal &amp; Dispute
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Contest an ineligible assessment if you believe upstream departmental source records are inaccurate.
              </p>
            </div>
          </div>

          {run && (
            <div
              style={{
                marginTop: 20,
                padding: '12px 16px',
                background: 'var(--color-bg-sunken)',
                borderRadius: 8,
                border: '1px solid var(--color-border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Target Service</span>
                <p style={{ margin: '2px 0 0', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{run.serviceType}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Assessment Result</span>
                <p style={{ margin: '2px 0 0', fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-error)' }}>Criteria Not Met</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>Run Reference</span>
                <p style={{ margin: '2px 0 0', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{run.id.slice(0, 8)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Existing Appeal View */}
        {existingAppeal ? (
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 12,
              padding: '32px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: 18, marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
                  Appeal Status Tracker
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)', fontFamily: '"JetBrains Mono", monospace' }}>
                  Dossier ID: {existingAppeal.id}
                </span>
              </div>
              {getStatusBadge(existingAppeal.status)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Disputed Department</span>
                <p style={{ margin: '4px 0 0', fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>{existingAppeal.disputedCategory}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Filing Date</span>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>{new Date(existingAppeal.submittedAt).toLocaleDateString()}</p>
              </div>
              {existingAppeal.resolvedAt && (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Resolution Date</span>
                  <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>{new Date(existingAppeal.resolvedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Appellant Ground for Dispute</span>
              <p style={{ margin: '6px 0 0', padding: '14px 16px', background: 'var(--color-bg-sunken)', borderRadius: 8, fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.6, border: '1px solid var(--color-border-subtle)' }}>
                {existingAppeal.reason}
              </p>
            </div>

            {existingAppeal.evidenceUrl && (
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Attached Supporting Evidence</span>
                <div style={{ marginTop: 6 }}>
                  <a
                    href={existingAppeal.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--color-accent-primary)', textDecoration: 'none', fontWeight: 600 }}
                  >
                    <ExternalLink size={14} /> View Supporting Document
                  </a>
                </div>
              </div>
            )}

            {existingAppeal.adminNote && (
              <div style={{ marginBottom: 24, padding: '16px', borderRadius: 8, background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-accent-primary)' }}>Administrative Officer Determination</span>
                <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                  {existingAppeal.adminNote}
                </p>
              </div>
            )}

            {existingAppeal.status === 'UPHELD' && (
              <div style={{ padding: '18px 20px', borderRadius: 8, background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-success)', fontWeight: 700, marginBottom: 6 }}>
                  <CheckCircle2 size={18} /> Reconsideration Granted
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  The administrative authority has upheld your dispute. An automated re-evaluation pipeline has been scheduled for your application.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            </div>
          </div>
        ) : (
          /* New Appeal Form */
          <form
            onSubmit={handleSubmit}
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 12,
              padding: '32px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
              File Official Dispute Dossier
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
              Please identify the specific department whose verification record you dispute and state the factual grounds.
            </p>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(197, 48, 48, 0.1)', border: '1px solid var(--color-error)', borderRadius: 8, color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: 20 }}>
                {error}
              </div>
            )}

            {/* Department Category */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Disputed Data Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border-default)',
                  background: 'var(--color-bg-sunken)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.9rem',
                }}
              >
                <option value="INCOME">Income &amp; Revenue (CBDT Tax Records)</option>
                <option value="IDENTITY">Identity Verification (UIDAI Aadhaar)</option>
                <option value="EDUCATION">Education &amp; Academic (NAD Academic Depot)</option>
                <option value="TRANSPORT">Transport &amp; Driving Licence (RTO MoRTH)</option>
                <option value="POLICE">Police &amp; Security Clearance (CCTNS)</option>
                <option value="BANKING">Banking &amp; DBT Mapping (NPCI PFMS)</option>
                <option value="WELFARE">Welfare &amp; PDS Ration Card (NFSA)</option>
                <option value="MUNICIPAL">Municipal &amp; Property Tax Registry</option>
              </select>
            </div>

            {/* Dispute Reason */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Grounds for Appeal &amp; Specific Corrections *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
                required
                placeholder="Detail why the retrieved data is inaccurate (e.g., 'Recent tax rectification filed on Form 15G exempting agricultural revenue from gross calculation; challan #2024/991 was paid and acknowledged by RTO on 12th July')."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border-default)',
                  background: 'var(--color-bg-sunken)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.9rem',
                  fontFamily: '"Inter", sans-serif',
                  lineHeight: 1.5,
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Evidence URL */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Supporting Evidence URL (Optional)
              </label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://digilocker.gov.in/share/doc-reference-key"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border-default)',
                  background: 'var(--color-bg-sunken)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.9rem',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 4, display: 'block' }}>
                Link to an official DigiLocker document, rectification acknowledgment, or gazette notification.
              </span>
            </div>

            {/* Submission Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button type="button" variant="secondary" onClick={() => navigate(runId ? `/result/${runId}` : '/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !reason.trim()}>
                {submitting ? 'Submitting Appeal…' : 'File Formal Dispute'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
