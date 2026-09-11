import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import { Shield, GraduationCap, Banknote, AlertTriangle, ChevronRight } from 'lucide-react';

type Category = 'IDENTITY' | 'EDUCATION' | 'INCOME';

const CONSENT_ITEMS: { category: Category; label: string; purpose: string; dataShared: string; source: string; icon: React.ReactNode; warning?: string }[] = [
  { category: 'IDENTITY', label: 'Identity', purpose: 'Verify applicant eligibility and confirm government identity record.', dataShared: 'Name, Date of Birth, Verification status', source: 'Identity Department', icon: <Shield size={18} /> },
  { category: 'EDUCATION', label: 'Education', purpose: 'Confirm active enrollment at a recognised institution.', dataShared: 'Institution name, Enrollment status, Academic year', source: 'Education Department', icon: <GraduationCap size={18} /> },
  { category: 'INCOME', label: 'Income', purpose: 'Assess income eligibility band for the scholarship threshold.', dataShared: 'Eligibility band only (Low/Medium/High)', source: 'Revenue Department', icon: <Banknote size={18} />, warning: 'Your actual income amount is never transmitted — only the eligibility band is shared with the scholarship service.' },
];

export function ConsentPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { name } = useAuthStore();
  const [enabled, setEnabled] = React.useState<Record<Category, boolean>>({ IDENTITY: true, EDUCATION: true, INCOME: true });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const allEnabled = Object.values(enabled).every(Boolean);

  const handleSubmit = async () => {
    if (!allEnabled || !runId) return;
    setLoading(true);
    setError('');
    try {
      await api.grantConsent(runId, ['IDENTITY', 'EDUCATION', 'INCOME']);
      navigate(`/status/${runId}`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to grant consent. Please try again.');
    } finally { setLoading(false); }
  };

  const toggleCat = (cat: Category) => setEnabled(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <AppShell>
      <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '48px 24px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Application · Step 1 of 3</p>
          <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 12px', lineHeight: 1.25 }}>Review &amp; Grant Data Consent</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.65 }}>
            Before we fetch your information, please review what will be accessed and why. You may withdraw consent at any time during the application.
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border-subtle)', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: 24 }}>
          <div style={{ padding: '10px 0', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"JetBrains Mono", monospace' }}>Run: {runId?.slice(0, 12)}…</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>· Applicant: {name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>· Requester: Scholarship Service</span>
          </div>
        </div>

        {/* Consent items */}
        {CONSENT_ITEMS.map((item) => (
          <div key={item.category} style={{ borderBottom: '1px solid var(--color-border-subtle)', padding: '20px 0' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* Toggle */}
              <button
                role="switch"
                aria-checked={enabled[item.category]}
                aria-label={`Toggle ${item.label} consent`}
                onClick={() => toggleCat(item.category)}
                style={{ flexShrink: 0, marginTop: 2, width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: enabled[item.category] ? 'var(--color-accent-primary)' : 'var(--color-border-default)', position: 'relative', transition: 'background var(--duration-base)' }}>
                <span style={{ position: 'absolute', top: 3, left: enabled[item.category] ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left var(--duration-base)', boxShadow: 'var(--shadow-sm)' }} />
              </button>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{item.icon}</span>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: '"Inter", system-ui, sans-serif' }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '2px 8px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 4, color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
                    {item.source}
                  </span>
                </div>
                <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.6 }}>{item.purpose}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Data: {item.dataShared}</p>

                {item.warning && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--color-warning-bg)', borderLeft: '3px solid var(--color-accent-amber)', borderRadius: '0 4px 4px 0' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#7a5800', fontFamily: '"Inter", system-ui, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={12} />{item.warning}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <p style={{ margin: '16px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Consent valid for 24 hours · Requester: scholarship-service</p>

        {!allEnabled && (
          <div style={{ margin: '16px 0 0', padding: '10px 14px', background: 'var(--color-error-bg)', borderLeft: '3px solid var(--color-error)', borderRadius: '0 4px 4px 0' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-error)', fontFamily: '"Inter", system-ui, sans-serif' }}>All three categories are required to apply for this scholarship.</p>
          </div>
        )}
        {error && <p style={{ margin: '12px 0 0', fontSize: '0.875rem', color: 'var(--color-error)', fontFamily: '"Inter", system-ui, sans-serif' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32, flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={() => navigate('/services')}>Cancel</Button>
          <Button disabled={!allEnabled || loading} onClick={handleSubmit}>
            {loading ? 'Granting consent…' : 'Grant Consent & Apply'}<ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
