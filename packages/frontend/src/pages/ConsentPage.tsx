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
  const { name, onegovId, identityMap } = useAuthStore();
  const [serviceType, setServiceType] = React.useState<string>('SCHOLARSHIP');
  const [categories, setCategories] = React.useState<DataCategory[]>(['IDENTITY', 'EDUCATION', 'INCOME']);
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>({ IDENTITY: true, EDUCATION: true, INCOME: true });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Guardian consent state (Item 2)
  const [isMinor, setIsMinor] = React.useState(false);
  const [guardianOneGovId, setGuardianOneGovId] = React.useState('');
  const [guardianRelationship, setGuardianRelationship] = React.useState('PARENT');
  const [guardianAgreed, setGuardianAgreed] = React.useState(false);

  React.useEffect(() => {
    if (runId) {
      api.getWorkflow(runId).then((run) => {
        setServiceType(run.serviceType || 'SCHOLARSHIP');
        let cats: DataCategory[] = ['IDENTITY', 'EDUCATION', 'INCOME'];
        if (run.serviceType === 'TRANSPORT') {
          cats = ['IDENTITY', 'TRANSPORT', 'POLICE', 'BANKING', 'MUNICIPAL'];
        } else if (run.serviceType === 'WELFARE') {
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
  const canSubmit = allEnabled && (!isMinor || (guardianOneGovId.trim().length > 0 && guardianAgreed));

  const handleSubmit = async () => {
    if (!canSubmit || !runId) return;
    setLoading(true);
    setError('');
    try {
      await api.grantConsent(
        runId,
        categories,
        undefined,
        undefined,
        undefined,
        isMinor ? guardianOneGovId.trim() : undefined
      );
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

        {!identityMap && (
          <div style={{
            marginBottom: 20,
            padding: '12px 16px',
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <AlertTriangle size={16} color="#ca8a04" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
              <strong>Self-Registered Account:</strong> This account does not have an active IdentityMap linked to simulated department servers. Authorizing consent will run the workflow orchestration up to the identity verification stage, where the system will cleanly report that no federated government records exist.
            </p>
          </div>
        )}

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

        {/* Minor / Guardian Consent Declaration (Item 2) */}
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: isMinor ? 'var(--color-bg-surface)' : 'var(--color-bg-base)',
            border: `1px solid ${isMinor ? 'var(--color-accent-primary)' : 'var(--color-border-default)'}`,
            borderRadius: 'var(--radius-md, 8px)',
            transition: 'all var(--duration-base)',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'var(--color-text-primary)',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            <input
              type="checkbox"
              id="is-minor-toggle"
              checked={isMinor}
              onChange={(e) => setIsMinor(e.target.checked)}
              style={{ accentColor: 'var(--color-accent-primary)', width: 16, height: 16 }}
            />
            <span>Applicant is a Minor (&lt; 18 years of age) — Requires Guardian Consent</span>
          </label>

          {isMinor && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border-subtle)' }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", sans-serif' }}>
                Pursuant to statutory child privacy protections, parental or legal guardian consent is mandatory to process identity snapshots and data pipelines for minors.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
                <div>
                  <label htmlFor="guardian-id" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    Guardian OneGov ID
                  </label>
                  <input
                    id="guardian-id"
                    type="text"
                    placeholder="e.g. 1GOV-GDN-998811"
                    value={guardianOneGovId}
                    onChange={(e) => setGuardianOneGovId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--color-bg-base)',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: 4,
                      color: 'var(--color-text-primary)',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="guardian-rel" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    Relationship
                  </label>
                  <select
                    id="guardian-rel"
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--color-bg-base)',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: 4,
                      color: 'var(--color-text-primary)',
                      fontFamily: '"Inter", sans-serif',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="PARENT">Parent / Biological Guardian</option>
                    <option value="LEGAL_GUARDIAN">Court-Appointed Legal Guardian</option>
                    <option value="INSTITUTIONAL_SPONSOR">Institutional Caretaker / Sponsor</option>
                  </select>
                </div>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  fontFamily: '"Inter", sans-serif',
                  marginTop: 8,
                }}
              >
                <input
                  type="checkbox"
                  id="guardian-agree"
                  checked={guardianAgreed}
                  onChange={(e) => setGuardianAgreed(e.target.checked)}
                  style={{ accentColor: 'var(--color-accent-primary)', marginTop: 2 }}
                />
                <span>
                  I declare under penalty of law that I am the authorized legal guardian for this applicant, and I authorize the issuance of requested data categories.
                </span>
              </label>
            </div>
          )}
        </div>

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

        {isMinor && (!guardianOneGovId.trim() || !guardianAgreed) && (
          <div style={{ margin: '12px 0 0', padding: '10px 14px', background: 'var(--color-warning-bg)', borderLeft: '3px solid var(--color-accent-amber)', borderRadius: '0 4px 4px 0' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#7a5800', fontFamily: '"Inter", sans-serif' }}>
              Guardian OneGov ID and legal attestation are required for minor applicants before consent can be granted.
            </p>
          </div>
        )}

        {error && <p style={{ margin: '12px 0 0', fontSize: '0.875rem', color: 'var(--color-error)', fontFamily: '"Inter", sans-serif' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32, flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={() => navigate('/services')}>Cancel</Button>
          <Button disabled={!canSubmit || loading} onClick={handleSubmit}>
            {loading ? 'Authorizing Consent…' : 'Grant Consent & Initiate Pipeline'}
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
