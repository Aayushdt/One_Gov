import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Shield, GraduationCap, Banknote, Sparkles, Car, ShieldAlert, Landmark, Building, HeartHandshake } from 'lucide-react';

const CONNECTED_SILOS = [
  { name: 'UIDAI Identity', code: 'AADHAAR', icon: <Shield size={13} />, status: 'ONLINE', color: 'var(--dept-1)' },
  { name: 'Income Tax CBDT', code: 'PAN', icon: <Banknote size={13} />, status: 'ONLINE', color: 'var(--dept-2)' },
  { name: 'Higher Education NAD', code: 'EDU', icon: <GraduationCap size={13} />, status: 'ONLINE', color: 'var(--dept-3)' },
  { name: 'Parivahan RTO', code: 'DL', icon: <Car size={13} />, status: 'ONLINE', color: 'var(--dept-4)' },
  { name: 'Police CCTNS', code: 'POLICE', icon: <ShieldAlert size={13} />, status: 'ONLINE', color: 'var(--dept-5)' },
  { name: 'Core Banking NPCI', code: 'DBT', icon: <Landmark size={13} />, status: 'ONLINE', color: 'var(--dept-6)' },
  { name: 'Public Welfare PDS', code: 'RATION', icon: <HeartHandshake size={13} />, status: 'ONLINE', color: 'var(--dept-7)' },
  { name: 'Municipal Land Records', code: 'PROP', icon: <Building size={13} />, status: 'ONLINE', color: 'var(--dept-8)' },
];

const SERVICES = [
  {
    id: 'SCHOLARSHIP',
    title: 'National Merit STEM Fellowship 2025',
    category: 'Higher Education & Research',
    award: '₹75,000 / annum Direct Grant',
    status: 'APPLICATIONS_OPEN',
    description: 'Direct Benefit Transfer (DBT) grant for enrolled undergraduate and postgraduate students with household income band <= ₹3 LPA. Verifies demographics, student status, and tax band with zero document upload.',
    departments: [
      { name: 'UIDAI Identity Department', icon: <Shield size={12} />, purpose: 'Demographics & age validation' },
      { name: 'Higher Education (NAD)', icon: <GraduationCap size={12} />, purpose: 'Enrolment & CGPA standing' },
      { name: 'Revenue (CBDT/PAN)', icon: <Banknote size={12} />, purpose: 'Data-minimized income band' },
    ],
    highlight: true,
  },
  {
    id: 'TRANSPORT',
    title: 'Commercial Transport Fast-Pass & Smart Transit',
    category: 'Road Transport & Logistics',
    award: 'All-India Commercial Endorsement + FASTag Waiver',
    status: 'INSTANT_VERIFICATION',
    description: 'Instant multi-state commercial driving authorization with unified traffic compliance. Verifies valid Driving Licence, zero unpaid challans, police character clearance, and active banking KYC.',
    departments: [
      { name: 'UIDAI Identity Department', icon: <Shield size={12} />, purpose: 'Biometric UID tokenization' },
      { name: 'Parivahan RTO', icon: <Car size={12} />, purpose: 'Driving licence validity & challans' },
      { name: 'Police CCTNS', icon: <ShieldAlert size={12} />, purpose: 'Criminal background & FIR check' },
      { name: 'Core Banking NPCI', icon: <Landmark size={12} />, purpose: 'e-KYC & Transit wallet link' },
    ],
    highlight: false,
  },
  {
    id: 'WELFARE',
    title: 'Social Security & Direct Benefit Transfer (DBT)',
    category: 'Public Welfare & Social Justice',
    award: '₹12,000 / annum Direct Subsidy + Ration Link',
    status: 'ACTIVE_ROLLOUT',
    description: 'Unified social protection assistance for priority households. Verifies low income band or BPL ration card status, accompanied by automated NPCI Aadhaar-seeded bank account routing.',
    departments: [
      { name: 'UIDAI Identity Department', icon: <Shield size={12} />, purpose: 'Aadhaar demographic matching' },
      { name: 'Revenue (Income Tax)', icon: <Banknote size={12} />, purpose: 'Income band eligibility' },
      { name: 'Public Welfare (PDS)', icon: <HeartHandshake size={12} />, purpose: 'Ration card & active schemes' },
      { name: 'Core Banking NPCI', icon: <Landmark size={12} />, purpose: 'Aadhaar-seeded DBT deposit' },
    ],
    highlight: false,
  },
];

export function ServicesPage() {
  const navigate = useNavigate();
  const { name, onegovId, state, identityMap } = useAuthStore();
  const [loadingService, setLoadingService] = React.useState<string | null>(null);
  const [servicesList, setServicesList] = React.useState(SERVICES);

  React.useEffect(() => {
    api.getServices()
      .then((res) => {
        if (res.services && res.services.length > 0) {
          const merged = res.services.map((dyn: any) => {
            const existing = SERVICES.find(s => s.id === dyn.serviceType);
            if (existing) {
              return existing;
            }
            return {
              id: dyn.serviceType,
              title: dyn.displayName || dyn.serviceType,
              category: 'Government Public Scheme',
              award: 'Direct Benefit Verification',
              status: 'APPLICATIONS_OPEN',
              description: `Automated multi-department eligibility verification across ${dyn.steps?.length || 0} federated data categories with zero physical paperwork.`,
              departments: (dyn.steps || []).map((step: any) => ({
                name: step.connectorSlug,
                icon: <Shield size={12} />,
                purpose: `Verifies ${step.category} data category`
              })),
              highlight: false,
            };
          });
          setServicesList(merged);
        }
      })
      .catch(() => {
        // Fallback to default SERVICES list
      });
  }, []);

  const handleApply = async (serviceId: string) => {
    setLoadingService(serviceId);
    try {
      const { runId } = await api.startWorkflow(serviceId);
      navigate(`/apply/${runId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingService(null);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: '68rem', margin: '0 auto', padding: '40px 24px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 28 }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
              OneGov Universal Citizen Portal
            </span>
            <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2.25rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '6px 0 8px', lineHeight: 1.2 }}>
              Government Services &amp; Schemes
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
              Welcome, <strong style={{ color: 'var(--color-text-primary)' }}>{name}</strong> {state ? `(${state})` : ''} · Select a service to initiate federated cross-agency verification.
            </p>
          </div>

          <div style={{ padding: '12px 18px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 10px var(--color-success)' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: identityMap ? 'var(--color-success)' : 'var(--color-accent-amber)',
                  letterSpacing: '0.05em',
                }}>
                  {identityMap ? 'Federated Identity Active' : 'Self-Registered (Unlinked)'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: '"JetBrains Mono", monospace' }}>
                {onegovId}
              </p>
            </div>
          </div>
        </div>

        {!identityMap && (
          <div style={{
            marginBottom: 24,
            padding: '14px 18px',
            background: 'var(--warning-tint)',
            border: '1px solid var(--warning)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <ShieldAlert size={20} color="var(--warning)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Self-Registered Account · Department Records Unlinked
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                This account was created via self-registration and is not yet federated with upstream departmental databases (UIDAI, CBDT, NAD). You can initiate applications to test workflow execution, where the system will cleanly report that no federated records exist. To test full multi-agency approval paths, sign in using credentials from <code>DEMO_CREDENTIALS.md</code>.
              </p>
            </div>
          </div>
        )}

        {/* 8 Connected Department Silos Bar */}
        <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 10, padding: '16px 20px', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>
              8 Interconnected Government Silos (Federated via OneGov ID)
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 600 }}>
              All 8 Connectors Online
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            {CONNECTED_SILOS.map((silo) => (
              <div
                key={silo.name}
                style={{
                  padding: '8px 10px',
                  background: 'var(--color-bg-base)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ color: 'var(--color-accent-primary)' }}>{silo.icon}</span>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {silo.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--color-text-tertiary)', fontFamily: '"JetBrains Mono", monospace' }}>
                    {silo.code}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {servicesList.map((srv) => (
            <div
              key={srv.id}
              style={{
                background: srv.highlight ? 'var(--color-bg-surface)' : 'var(--color-bg-base)',
                border: srv.highlight ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border-subtle)',
                borderRadius: 12,
                padding: '28px',
                position: 'relative',
                boxShadow: srv.highlight ? 'var(--shadow-md)' : 'none',
              }}
            >
              {srv.highlight && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    right: 24,
                    background: 'var(--primary)',
                    color: 'var(--on-primary)',
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
                  <Sparkles size={12} /> Flagship Verification Flow
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
                      Required Federated Inter-Agency Lookups:
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
                  <Button
                    onClick={() => handleApply(srv.id)}
                    disabled={loadingService !== null}
                    variant={srv.highlight ? 'primary' : 'secondary'}
                    size="lg"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {loadingService === srv.id ? 'Initiating Pipeline…' : 'Apply with Consent'}
                    <ArrowRight size={16} />
                  </Button>
                  <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif', textAlign: 'right' }}>
                    Zero physical paper upload
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
