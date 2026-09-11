import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import { Shield, Sparkles, CheckCircle, RefreshCw, Slash, ArrowRight, Lock, AlertTriangle, Users, Building2 } from 'lucide-react';

const HIGHLIGHTED_PERSONAS = [
  {
    onegovId: 'OG-2026-00000001',
    email: 'rahul@govlink.demo',
    name: 'Rahul Kumar Singh',
    badge: 'Golden Standard · All Clean',
    badgeColor: 'var(--color-success)',
    note: 'NIT Trichy B.Tech CSE (CGPA 8.92) · Low Income · Clean DL · Cleared Police · Active DBT Bank · Approved on all flows.',
    icon: <CheckCircle size={15} color="var(--color-success)" />,
  },
  {
    onegovId: 'OG-2026-00000002',
    email: 'priya@govlink.demo',
    name: 'Priya Sharma',
    badge: 'Flagship Merit · ₹75k Award',
    badgeColor: 'var(--color-success)',
    note: 'IIT Delhi M.Tech (CGPA 9.10) · Meets low-income criteria. Demonstrates zero-knowledge data minimization & instant certificate.',
    icon: <CheckCircle size={15} color="var(--color-success)" />,
  },
  {
    onegovId: 'OG-2026-00000003',
    email: 'amitabh@govlink.demo',
    name: 'Amitabh Ramesh Patel',
    badge: 'Transport Edge · Expired DL',
    badgeColor: 'var(--color-accent-amber)',
    note: 'Delhi Univ M.Sc · Medium Income · Driving license expired in 2023. Apply TRANSPORT flow to see the rejection path with reason: DRIVING_LICENCE_EXPIRED.',
    icon: <Lock size={15} color="var(--color-accent-amber)" />,
  },
  {
    onegovId: 'OG-2026-00000004',
    email: 'sneha@govlink.demo',
    name: 'Sneha Kumari Gupta',
    badge: '503 Resilient · Auto-Retry Demo',
    badgeColor: '#3b82f6',
    note: 'Jadavpur Univ B.A. · Low Income · Revenue dept (SIM-PAN-000004) is configured to inject one 503 fault. Watch BullMQ exponential backoff auto-retry live on the status page.',
    icon: <RefreshCw size={15} color="#3b82f6" />,
  },
  {
    onegovId: 'OG-2026-00000005',
    email: 'mohammed@govlink.demo',
    name: 'Mohammed Tariq Khan',
    badge: 'Identity Mismatch · PAN Mismatch',
    badgeColor: '#eab308',
    note: 'IISc Bengaluru M.S. · Name variation between Aadhaar token & PAN tax record.',
    icon: <AlertTriangle size={15} color="#eab308" />,
  },
  {
    onegovId: 'OG-2026-00000006',
    email: 'ananya@govlink.demo',
    name: 'Ananya Sundaram Iyer',
    badge: 'Security · Police Verification Pending',
    badgeColor: '#f97316',
    note: 'Anna Univ B.Tech · Police CCTNS clearance is in PENDING verification state.',
    icon: <Lock size={15} color="#f97316" />,
  },
  {
    onegovId: 'OG-2026-00000007',
    email: 'vikramaditya@govlink.demo',
    name: 'Vikramaditya Roy',
    badge: 'High Income & Bank KYC Overdue',
    badgeColor: '#a855f7',
    note: 'Univ of Mumbai B.Com · Exceeds ₹12 LPA income band and Bank KYC is overdue. Demonstrates multi-criteria failure.',
    icon: <Slash size={15} color="#a855f7" />,
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const citizenId = useAuthStore((s) => s.citizenId);
  const [email, setEmail] = React.useState('rahul@govlink.demo');
  const [password, setPassword] = React.useState('demo123');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [citizenDirectory, setCitizenDirectory] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (citizenId) navigate('/services');
    api.getCitizens().then((data) => setCitizenDirectory(data.citizens || [])).catch(() => {});
  }, [citizenId, navigate]);

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setError('');
    setLoading(true);
    try {
      const data = await api.login(loginEmail, loginPass);
      login(data);
      navigate('/services');
    } catch {
      setError('Invalid credentials. Check demo credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleQuickLogin = async (personaEmail: string) => {
    setEmail(personaEmail);
    setPassword('demo123');
    await executeLogin(personaEmail, 'demo123');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      {/* Left dark column */}
      <div
        className="hidden md:flex"
        style={{
          width: '42%',
          background: 'var(--color-nav-bg)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 40px',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div
              style={{
                width: 38,
                height: 38,
                background: 'var(--color-accent-primary)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(184,75,41,0.3)',
              }}
            >
              <Shield size={20} color="white" />
            </div>
            <div>
              <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.35rem', fontWeight: 600, color: 'var(--color-nav-text)', letterSpacing: '-0.01em' }}>
                OneGov · GovLink
              </span>
              <p style={{ margin: 0, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-nav-text-muted)', fontFamily: '"Inter", sans-serif' }}>
                Universal Interoperability Middleware
              </p>
            </div>
          </div>

          <h1
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '2rem',
              fontWeight: 600,
              color: 'var(--color-nav-text)',
              lineHeight: 1.25,
              margin: '0 0 16px',
            }}
          >
            Universal Citizen ID &amp; Multi-Agency Federation.
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-nav-text-muted)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.65, margin: '0 0 32px' }}>
            OneGov links 8 government department silos through synthetic Universal IDs (<code>OG-2026-XXXXXXXX</code>), zero-knowledge data minimization, and SHA-256 audit chains.
          </p>

          <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Sparkles size={16} color="var(--color-accent-amber)" />
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-accent-amber)', fontFamily: '"Inter", sans-serif' }}>
                50 Deterministic Citizens Pre-Populated
              </p>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-nav-text-muted)', lineHeight: 1.5, fontFamily: '"Inter", sans-serif' }}>
              Includes 8 departmental silos: UIDAI Identity, Income Tax CBDT, Higher Education NAD, Parivahan RTO, CCTNS Police, Core Banking, PDS Welfare, and Municipal Records.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--color-nav-text-muted)' }}>
              <Building2 size={14} color="var(--color-accent-primary)" /> 8 Simulated Department Silos Connected
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--color-nav-text-muted)' }}>
              <Shield size={14} color="var(--color-success)" /> Zero-Knowledge Data Minimization &amp; Tokenization
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--color-nav-text-muted)' }}>
              <Users size={14} color="#3b82f6" /> Universal Citizen ID: <code>OG-2026-00000001</code> to <code>00000050</code>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-nav-text-muted)', fontFamily: '"Inter", sans-serif' }}>
            Production-grade zero-knowledge federated government interoperability.
          </p>
        </div>
      </div>

      {/* Right form and persona switcher column */}
      <div style={{ flex: 1, padding: 'clamp(24px, 4vw, 48px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: 640, width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
              Citizen Portal Access
            </span>
            <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.85rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '4px 0 6px' }}>
              Authenticate with OneGov
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
              Select a deterministic test persona below or enter your login credentials.
            </p>
          </div>

          {/* Quick Persona Selector */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
                Featured Deterministic Test Personas
              </p>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                1-Click Sign In
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {HIGHLIGHTED_PERSONAS.map((p) => (
                <div
                  key={p.email}
                  onClick={() => handleQuickLogin(p.email)}
                  style={{
                    padding: '12px 16px',
                    background: email === p.email ? 'var(--color-bg-sunken)' : 'var(--color-bg-surface)',
                    border: email === p.email ? '1.5px solid var(--color-accent-primary)' : '1px solid var(--color-border-subtle)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all var(--duration-fast)',
                  }}
                  className="hover:border-stone-400"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {p.icon}
                      <strong style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{p.name}</strong>
                      <span style={{ fontSize: '0.7rem', fontFamily: '"JetBrains Mono", monospace', color: 'var(--color-text-tertiary)', background: 'var(--color-bg-base)', padding: '2px 6px', borderRadius: 4 }}>
                        {p.onegovId}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: p.badgeColor,
                        background: 'rgba(0,0,0,0.03)',
                        padding: '2px 8px',
                        borderRadius: 12,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {p.badge}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.45, fontFamily: '"Inter", sans-serif' }}>
                    {p.note}
                  </p>
                </div>
              ))}
            </div>

            {/* Dropdown for all 50 citizens */}
            {citizenDirectory.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                  Or browse full 50-Citizen Registry:
                </label>
                <select
                  value={email}
                  onChange={(e) => handleQuickLogin(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--color-border-default)',
                    background: 'var(--color-bg-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.8125rem',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {citizenDirectory.map((c: any) => (
                    <option key={c.email} value={c.email}>
                      [{c.onegovId}] {c.name} — {c.state} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 10, padding: 24 }}>
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(197, 48, 48, 0.08)', border: '1px solid var(--color-error)', borderRadius: 6, marginBottom: 16, fontSize: '0.8rem', color: 'var(--color-error)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label="Citizen Email / Digital ID"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Passcode"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <Button type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Authenticating…' : 'Enter Citizen Portal'}
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
