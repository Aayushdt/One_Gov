import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import { Shield, GraduationCap, Banknote, AlertTriangle, ChevronRight, Car, ShieldAlert, Landmark, HeartHandshake } from 'lucide-react';
import { DataCategory } from '../types';

const CATEGORY_DEFINITIONS: Record<DataCategory, { label: string; purpose: string; dataShared: string; source: string; icon: React.ReactNode; warning?: string }> = {
  IDENTITY: {
    label: 'Identity & Demographics',
    purpose: 'Verify applicant identity and match token with National UID registry.',
    dataShared: 'Full Name, Date of Birth, Gender, Masked UID Token',
    source: 'UIDAI Identity Silo',
    icon: <Shield size={18} />,
  },
  EDUCATION: {
    label: 'Higher Education Academic Record',
    purpose: 'Confirm active university enrollment and CGPA standing.',
    dataShared: 'Institution Name, Enrollment Status, Course Program, Academic Year',
    source: 'National Academic Depository (NAD)',
    icon: <GraduationCap size={18} />,
  },
  INCOME: {
    label: 'Income Tax Assessment Band',
    purpose: 'Validate household income ceiling for benefit qualification.',
    dataShared: 'Eligibility Band Only (LOW / MEDIUM / HIGH) — Raw salary is strictly stripped.',
    source: 'Income Tax CBDT Silo',
    icon: <Banknote size={18} />,
    warning: 'Data Minimization Active: Your exact salary amount is never exposed or transferred to the scheme.',
  },
  TRANSPORT: {
    label: 'Driving Licence & Vehicle Record',
    purpose: 'Verify driving licence validity class and pending traffic penalties.',
    dataShared: 'DL Status (VALID/EXPIRED), Clean Driving Record Boolean, Unpaid Challans Count',
    source: 'Parivahan RTO Silo',
    icon: <Car size={18} />,
  },
  POLICE: {
    label: 'Police Character & Crime Verification',
    purpose: 'Verify criminal background and clearance status from national records.',
    dataShared: 'Clearance Status (CLEARED/PENDING/ADVERSE), Incident Count',
    source: 'Police CCTNS National Registry',
    icon: <ShieldAlert size={18} />,
  },
  BANKING: {
    label: 'Core Banking e-KYC & DBT Link',
    purpose: 'Confirm Aadhaar-seeded bank account for Direct Benefit Transfer.',
    dataShared: 'Bank Name, Masked Account, KYC Verification Status, DBT Enabled Boolean',
    source: 'NPCI Core Banking Integration',
    icon: <Landmark size={18} />,
  },
  WELFARE: {
    label: 'Public Distribution & Social Welfare',
    purpose: 'Verify BPL status and existing social assistance enrolments.',
    dataShared: 'Ration Card Number, BPL Status, Active Subsidies List',
    source: 'National Food Security Silo',
    icon: <HeartHandshake size={18} />,
  },
  MUNICIPAL: {
    label: 'Municipal Property & Residence',
    purpose: 'Verify residence address and municipal property tax clearance.',
    dataShared: 'Property ID, Zone, Tax Clearance Boolean',
    source: 'Municipal Land Registry',
    icon: <Shield size={18} />,
  },
};

export function ConsentPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { name, onegovId } = useAuthStore();
  const [serviceType, setServiceType] = React.useState<string>('SCHOLARSHIP');
  const [categories, setCategories] = React.useState<DataCategory[]>(['IDENTITY', 'EDUCATION', 'INCOME']);
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>({ IDENTITY: true, EDUCATION: true, INCOME: true });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (runId) {
      api.getWorkflow(runId).then((data) => {
        const sType = data.serviceType || 'SCHOLARSHIP';
        setServiceType(sType);

        let cats: DataCategory[] = ['IDENTITY', 'EDUCATION', 'INCOME'];
        if (sType === 'TRANSPORT') {
          cats = ['IDENTITY', 'TRANSPORT', 'POLICE', 'BANKING'];
        } else if (sType === 'WELFARE') {
          cats = ['IDENTITY', 'INCOME', 'WELFARE', 'BANKING'];
        }

        setCategories(cats);
        const initialEnabled: Record<string, boolean> = {};
        cats.forEach((c) => { initialEnabled[c] = true; });
        setEnabled(initialEnabled);
      }).catch(console.error);
    }
  }, [runId]);

  const allEnabled = categories.every((cat) => enabled[cat]);

  const handleSubmit = async () => {
    if (!allEnabled || !runId) return;
    setLoading(true);
    setError('');
    try {
      await api.grantConsent(runId, categories);
      navigate(`/status/${runId}`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to grant consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCat = (cat: DataCategory) => setEnabled((prev) => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <AppShell>
      <div style={{ maxWidth: '44rem', margin: '0 auto', padding: '40px 24px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
            Consent Management · Step 1 of 3
          </p>
          <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.85rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 10px', lineHeight: 1.25 }}>
            Review &amp; Authorize Data Consent
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.65 }}>
            OneGov enforces explicit, category-specific citizen consent before retrieving records from government silos. You may revoke consent at any moment.
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border-subtle)', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: 24 }}>
          <div style={{ padding: '10px 0', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"JetBrains Mono", monospace' }}>
              Run ID: {runId?.slice(0, 12)}…
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>· Applicant: <strong style={{ color: 'var(--color-text-primary)' }}>{name}</strong></span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"JetBrains Mono", monospace' }}>· UID: {onegovId}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-primary)', fontWeight: 600 }}>· Service: {serviceType}</span>
          </div>
        </div>

        {/* Consent items */}
        {categories.map((cat) => {
          const item = CATEGORY_DEFINITIONS[cat];
          return (
            <div key={cat} style={{ borderBottom: '1px solid var(--color-border-subtle)', padding: '18px 0' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Toggle */}
                <button
                  role="switch"
                  aria-checked={enabled[cat]}
                  aria-label={`Toggle ${item.label} consent`}
                  onClick={() => toggleCat(cat)}
                  style={{
                    flexShrink: 0,
                    marginTop: 2,
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: 'none',
                    cursor: 'pointer',
                    background: enabled[cat] ? 'var(--color-accent-primary)' : 'var(--color-border-default)',
                    position: 'relative',
                    transition: 'background var(--duration-base)',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: enabled[cat] ? 23 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'white',
                      transition: 'left var(--duration-base)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  />
                </button>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--color-accent-primary)' }}>{item.icon}</span>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: '"Inter", sans-serif' }}>
                        {item.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: 4,
                        color: 'var(--color-text-tertiary)',
                        fontFamily: '"Inter", sans-serif',
                      }}
                    >
                      {item.source}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.55 }}>
                    {item.purpose}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
                    Normalized CDM Payload: <code>{item.dataShared}</code>
                  </p>

                  {item.warning && (
                    <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--color-warning-bg)', borderLeft: '3px solid var(--color-accent-amber)', borderRadius: '0 4px 4px 0' }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#7a5800', fontFamily: '"Inter", sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={13} /> {item.warning}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <p style={{ margin: '16px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
          Consent valid for 24 hours · Cryptographic event logged to immutable per-citizen audit chain
        </p>

        {!allEnabled && (
          <div style={{ margin: '16px 0 0', padding: '10px 14px', background: 'var(--color-error-bg)', borderLeft: '3px solid var(--color-error)', borderRadius: '0 4px 4px 0' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-error)', fontFamily: '"Inter", sans-serif' }}>
              All requested data categories are required to complete verification for this scheme.
            </p>
          </div>
        )}

        {error && <p style={{ margin: '12px 0 0', fontSize: '0.875rem', color: 'var(--color-error)', fontFamily: '"Inter", sans-serif' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32, flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={() => navigate('/services')}>Cancel</Button>
          <Button disabled={!allEnabled || loading} onClick={handleSubmit}>
            {loading ? 'Authorizing Consent…' : 'Grant Consent & Initiate Pipeline'}
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
