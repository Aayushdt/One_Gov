import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Shield, GraduationCap, Banknote, Sparkles } from 'lucide-react';

const SERVICES = [
  {
    id: 'scholarship-2025',
    title: 'National Merit Scholarship 2025',
    category: 'Education & Welfare',
    award: '₹75,000 / annum',
    status: 'ACTIVE_APPLICATIONS_OPEN',
    description: 'Direct Benefit Transfer (DBT) scholarship for enrolled students with household income under ₹3 LPA. Verification happens via consent-based inter-agency data sharing.',
    departments: [
      { name: 'Identity Department', icon: <Shield size={12} />, purpose: 'Identity & Age verification' },
      { name: 'Education Department', icon: <GraduationCap size={12} />, purpose: 'Enrollment & Academic standing' },
      { name: 'Revenue Department', icon: <Banknote size={12} />, purpose: 'Income eligibility band validation' },
    ],
    highlight: true,
    isOpen: true,
  },
  {
    id: 'research-fellowship',
    title: 'Postgraduate STEM Innovation Fellowship',
    category: 'Higher Education & Research',
    award: '₹42,000 / month + Contingency',
    status: 'ROLLING_ADMISSIONS',
    description: 'Research grant for masters and doctoral candidates conducting scientific research at recognised national universities.',
    departments: [
      { name: 'Identity Department', icon: <Shield size={12} />, purpose: 'Aadhaar / Citizen ID validation' },
      { name: 'Education Department', icon: <GraduationCap size={12} />, purpose: 'Postgraduate enrolment verification' },
    ],
    isOpen: true,
  },
  {
    id: 'housing-grant',
    title: 'First-Time Graduate Housing Subsidy',
    category: 'Urban Welfare',
    award: '₹60,000 one-time rental voucher',
    status: 'ANNUAL_CYCLE',
    description: 'Relocation subsidy for recent university graduates transitioning to metropolitan employment zones.',
    departments: [
      { name: 'Identity Department', icon: <Shield size={12} />, purpose: 'Age & domicile confirmation' },
      { name: 'Revenue Department', icon: <Banknote size={12} />, purpose: 'First-time taxpayer status' },
    ],
    isOpen: true,
  },
];

export function ServicesPage() {
  const navigate = useNavigate();
  const { name, citizenId } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const handleApply = async () => {
    setLoading(true);
    try {
      const { runId } = await api.startWorkflow();
      navigate(`/apply/${runId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: '68rem', margin: '0 auto', padding: '48px 24px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
              Citizen Digital Services Catalog
            </span>
            <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2.25rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '8px 0 8px', lineHeight: 1.2 }}>
              Government Services &amp; Grants
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
              Welcome back, <strong style={{ color: 'var(--color-text-primary)' }}>{name}</strong> · Select a service to initiate verified data orchestration.
            </p>
          </div>

          <div style={{ padding: '12px 18px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 8px var(--color-success)' }} />
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: '"Inter", sans-serif' }}>
                Identity Federated
              </p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontFamily: '"JetBrains Mono", monospace' }}>
                Citizen ID: {citizenId}
              </p>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border-subtle)', marginBottom: 32 }} />

        {/* Services Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {SERVICES.map((srv) => (
            <div
              key={srv.id}
              style={{
                background: srv.highlight ? 'var(--color-bg-surface)' : 'var(--color-bg-base)',
                border: srv.highlight ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-subtle)',
                borderRadius: 12,
                padding: '28px',
                position: 'relative',
                boxShadow: srv.highlight ? 'var(--shadow-md)' : 'none',
                transition: 'transform var(--duration-fast), box-shadow var(--duration-fast)',
              }}
            >
              {srv.highlight && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    right: 24,
                    background: 'var(--color-accent-primary)',
                    color: 'white',
                    padding: '3px 12px',
                    borderRadius: 12,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  <Sparkles size={12} /> Flagship Hackathon Flow
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                <div style={{ flex: '1 1 500px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
                      {srv.category}
                    </span>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-border-default)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)', fontFamily: '"Inter", sans-serif' }}>
                      Benefit: {srv.award}
                    </span>
                  </div>

                  <h2 style={{ margin: '0 0 10px', fontSize: '1.35rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {srv.title}
                  </h2>

                  <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.6, maxWidth: 640 }}>
                    {srv.description}
                  </p>

                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
                      Required Inter-Agency Data Sources:
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {srv.departments.map((d) => (
                        <div
                          key={d.name}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            background: 'var(--color-bg-sunken)',
                            border: '1px solid var(--color-border-default)',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            color: 'var(--color-text-secondary)',
                            fontFamily: '"Inter", sans-serif',
                          }}
                        >
                          <span style={{ color: 'var(--color-accent-primary)' }}>{d.icon}</span>
                          <span style={{ fontWeight: 500 }}>{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', alignSelf: 'center', flexShrink: 0 }}>
                  {srv.id === 'scholarship-2025' ? (
                    <Button onClick={handleApply} disabled={loading} size="lg" style={{ whiteSpace: 'nowrap' }}>
                      {loading ? 'Initiating Pipeline…' : 'Apply with Consent'}
                      <ArrowRight size={16} />
                    </Button>
                  ) : (
                    <Button onClick={handleApply} variant="secondary" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
                      Apply via GovLink
                      <ArrowRight size={16} />
                    </Button>
                  )}
                  <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif', textAlign: 'right' }}>
                    Zero manual paper upload required
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
