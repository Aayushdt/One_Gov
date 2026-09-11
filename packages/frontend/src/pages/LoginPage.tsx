import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import { Shield, Sparkles, CheckCircle, RefreshCw, Slash, ArrowRight, Lock } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    email: 'priya@govlink.demo',
    name: 'Priya Sharma',
    badge: 'Eligible · ₹75,000 Award',
    badgeColor: 'var(--color-success)',
    note: 'NIT Trichy B.Tech CSE · Meets low-income criteria. Demonstrates data minimization & successful approval.',
    icon: <CheckCircle size={15} color="var(--color-success)" />,
  },
  {
    email: 'rahul@govlink.demo',
    name: 'Rahul Verma',
    badge: 'Ineligible · High Income',
    badgeColor: 'var(--color-accent-amber)',
    note: 'IIT Delhi M.Tech · Exceeds ₹3 LPA income band ceiling. Demonstrates policy criteria rejection.',
    icon: <Lock size={15} color="var(--color-accent-amber)" />,
  },
  {
    email: 'sneha@govlink.demo',
    name: 'Sneha Patel',
    badge: 'Resilience · Auto Retry',
    badgeColor: '#3b82f6',
    note: 'Delhi University M.Sc · Injects 503 upstream network fault on Revenue service. Demonstrates automated BullMQ backoff retry.',
    icon: <RefreshCw size={15} color="#3b82f6" />,
  },
  {
    email: 'vikram@govlink.demo',
    name: 'Vikramaditya Roy',
    badge: 'Consent Revocation Demo',
    badgeColor: '#a855f7',
    note: 'Jadavpur University B.A. · Use to test mid-flight consent withdrawal or fresh applicant journeys.',
    icon: <Slash size={15} color="#a855f7" />,
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const citizenId = useAuthStore((s) => s.citizenId);
  const [email, setEmail] = React.useState('priya@govlink.demo');
  const [password, setPassword] = React.useState('demo123');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (citizenId) navigate('/services');
  }, [citizenId, navigate]);

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setError('');
    setLoading(true);
    try {
      const data = await api.login(loginEmail, loginPass);
      login(data.citizenId, data.name, data.token);
      navigate('/services');
    } catch {
      setError('Invalid email or password. Check demo credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
    await executeLogin(demoEmail, 'demo123');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      {/* Left dark column */}
      <div
        className="hidden md:flex"
        style={{
          width: '45%',
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
                GovLink
              </span>
              <p style={{ margin: 0, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-nav-text-muted)', fontFamily: '"Inter", sans-serif' }}>
                Interoperability Middleware
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
            Consent-Driven Digital Government Services.
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-nav-text-muted)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.65, margin: '0 0 32px' }}>
            GovLink connects simulated department silos (Identity, Education, Revenue) with cryptographic hash-chain audits and zero-knowledge data minimization.
          </p>

          <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Sparkles size={16} color="var(--color-accent-amber)" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-nav-text)', fontFamily: '"Inter", sans-serif' }}>
                Hackathon Demo Guide
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-nav-text-muted)', fontFamily: '"Inter", sans-serif', lineHeight: 1.5 }}>
              Click any demo account below for <strong>1-Click Instant Login</strong> with pre-seeded government records.
            </p>
          </div>
        </div>

        {/* Demo persona cards */}
        <div>
          <p style={{ margin: '0 0 12px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-nav-text-muted)', fontFamily: '"Inter", system-ui, sans-serif' }}>
            Select Demo Persona (Click to Instant Login)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => handleQuickLogin(a.email)}
                disabled={loading}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: email === a.email ? 'rgba(184,75,41,0.18)' : 'rgba(255,255,255,0.04)',
                  border: email === a.email ? '1px solid var(--color-accent-primary)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast)',
                }}
                onMouseEnter={(e) => {
                  if (email !== a.email) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (email !== a.email) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {a.icon}
                    <span style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-nav-text)' }}>
                      {a.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.08)',
                      color: a.badgeColor,
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    {a.badge}
                  </span>
                </div>
                <p style={{ margin: '0 0 2px', fontSize: '0.75rem', color: 'var(--color-nav-text-muted)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.4 }}>
                  {a.note}
                </p>
                <span style={{ fontSize: '0.7rem', fontFamily: '"JetBrains Mono", monospace', color: 'rgba(255,255,255,0.35)' }}>
                  {a.email} · password: demo123
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right form column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 'clamp(32px,6vw,80px)' }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          {/* Mobile wordmark */}
          <div className="md:hidden" style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--color-accent-primary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="white" />
            </div>
            <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              GovLink
            </span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
              Citizen Authentication
            </span>
            <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '8px 0 8px', lineHeight: 1.2 }}>
              Citizen Portal Sign In
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
              Sign in to initiate data-consented service applications.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Input label="Citizen Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="priya@govlink.demo" />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" error={error || undefined} />

            <Button type="submit" disabled={loading} fullWidth size="lg">
              {loading ? 'Authenticating…' : 'Sign In & Access Services'}
              <ArrowRight size={16} />
            </Button>
          </form>

          {/* Quick login for mobile */}
          <div className="md:hidden" style={{ marginTop: 32, borderTop: '1px solid var(--color-border-subtle)', paddingTop: 20 }}>
            <p style={{ margin: '0 0 10px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-tertiary)' }}>1-Click Quick Demo Accounts:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => handleQuickLogin(a.email)}
                  style={{ padding: '8px 12px', textAlign: 'left', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 6, cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{a.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'block' }}>{a.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
