import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import {
  Shield, Sparkles, RefreshCw, AlertTriangle, Users, Building2,
  UserCircle2, ChevronDown, LogIn, UserPlus, Info, Languages
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../components/ThemeToggle';

const AVATAR_COLORS = [
  'var(--dept-1)',
  'var(--dept-2)',
  'var(--dept-3)',
  'var(--dept-4)',
  'var(--dept-5)',
  'var(--dept-6)',
  'var(--dept-7)',
  'var(--dept-8)',
];

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const citizenId = useAuthStore((s) => s.citizenId);
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
  };

  const [tab, setTab] = React.useState<'login' | 'register'>('login');

  // Sign in state
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Registration state
  const [regName, setRegName] = React.useState('');
  const [regEmail, setRegEmail] = React.useState('');
  const [regPassword, setRegPassword] = React.useState('');
  const [regState, setRegState] = React.useState('Delhi');

  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [citizenDirectory, setCitizenDirectory] = React.useState<any[]>([]);
  const [directoryOpen, setDirectoryOpen] = React.useState(false);

  React.useEffect(() => {
    if (citizenId) navigate('/services');
    api.getCitizens().then((data) => setCitizenDirectory(data.citizens || [])).catch(() => {});
  }, [citizenId, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email.trim(), password);
      login(data);
      navigate('/services');
    } catch (err: any) {
      setError(err?.message === 'INVALID_CREDENTIALS'
        ? 'Invalid email or password. For seeded citizen credentials, consult DEMO_CREDENTIALS.md.'
        : err?.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        state: regState.trim(),
      });
      login(data);
      navigate('/services');
    } catch (err: any) {
      setError(err?.message === 'EMAIL_ALREADY_EXISTS'
        ? 'This email is already registered. Please sign in.'
        : err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-base)', position: 'relative' }}>
      {/* Floating Language & Theme Controls */}
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 50, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ThemeToggle variant="pill" />

        <button
          onClick={toggleLanguage}
          title={i18n.language === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            background: 'var(--panel)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            color: 'var(--panel-text)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow)',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-3)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--panel)')}
        >
          <Languages size={14} color="var(--panel-accent)" />
          <span>{i18n.language === 'hi' ? 'हिन्दी' : 'EN'}</span>
        </button>
      </div>

      {/* ── Left dark panel ── */}
      <div
        style={{
          width: '40%',
          minWidth: 320,
          background: 'var(--panel)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 40px',
          borderRight: '1px solid var(--border)',
          display: 'flex',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div
              style={{
                width: 38, height: 38,
                background: 'var(--primary-brand)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow)',
              }}
            >
              <Shield size={20} color="var(--on-primary)" />
            </div>
            <div>
              <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.35rem', fontWeight: 600, color: 'var(--panel-text)', letterSpacing: '-0.01em' }}>
                OneGov · GovLink
              </span>
              <p style={{ margin: 0, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--panel-text-2)', fontFamily: '"Inter", sans-serif' }}>
                Universal Interoperability Middleware
              </p>
            </div>
          </div>

          <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--panel-text)', lineHeight: 1.25, margin: '0 0 16px' }}>
            Universal Citizen ID & Multi-Agency Federation.
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--panel-text-2)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.65, margin: '0 0 32px' }}>
            OneGov links 8 government department silos through synthetic Universal IDs (<code>OG-2026-XXXXXXXX</code>), zero-knowledge data minimization, and SHA-256 audit chains.
          </p>

          <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Sparkles size={16} color="var(--panel-accent)" />
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--panel-accent)', fontFamily: '"Inter", sans-serif' }}>
                50 Deterministic Citizens Pre-Populated
              </p>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--panel-text-2)', lineHeight: 1.5, fontFamily: '"Inter", sans-serif' }}>
              8 departmental silos: UIDAI Identity, CBDT Income Tax, NAD Higher Education, Parivahan RTO, CCTNS Police, Core Banking, PDS Welfare, and Municipal Records.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--panel-text-2)' }}>
              <Building2 size={14} color="var(--brown)" /> 8 Simulated Department Silos Connected
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--panel-text-2)' }}>
              <Shield size={14} color="var(--sage)" /> Zero-Knowledge Data Minimization & Tokenization
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--panel-text-2)' }}>
              <Users size={14} color="var(--accent-hi)" /> Universal Citizen IDs: <code>OG-2026-00000001</code> → <code>00000050</code>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--panel-text-2)', fontFamily: '"Inter", sans-serif' }}>
            Universal Citizen Portal — Secure authentication with multi-agency federated interoperability.
          </p>
        </div>
      </div>

      {/* ── Right panel: Login & Registration Form + 50-Citizen Registry ── */}
      <div style={{ flex: 1, padding: 'clamp(24px, 4vw, 48px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: 640, width: '100%', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
              Citizen Portal Access
            </span>
            <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.85rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '4px 0 6px' }}>
              Sign In to GovLink
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
              Enter your citizen credentials to access cross-agency public services, or register a new citizen account.
            </p>
          </div>

          {/* Form container */}
          <div style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            boxShadow: 'var(--shadow-sm)',
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: 20, gap: 8 }}>
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === 'login' ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                  color: tab === 'login' ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
                  fontWeight: tab === 'login' ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                <LogIn size={15} /> Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === 'register' ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
                  color: tab === 'register' ? 'var(--color-accent-primary)' : 'var(--color-text-tertiary)',
                  fontWeight: tab === 'register' ? 700 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                <UserPlus size={15} /> Register New Citizen
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(197,48,48,0.08)', border: '1px solid var(--color-error)', borderRadius: 6, marginBottom: 16, fontSize: '0.8125rem', color: 'var(--color-error)' }}>
                {error}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6, fontFamily: '"Inter", sans-serif' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahul@govlink.demo"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border-default)',
                      background: 'var(--color-bg-base)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.875rem',
                      fontFamily: '"Inter", sans-serif',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6, fontFamily: '"Inter", sans-serif' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border-default)',
                      background: 'var(--color-bg-base)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.875rem',
                      fontFamily: '"Inter", sans-serif',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: 4,
                    padding: '11px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--color-accent-primary)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {loading && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {loading ? 'Authenticating…' : 'Log In'}
                </button>

                <div style={{ marginTop: 6, padding: '10px 12px', background: 'var(--color-bg-sunken)', borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Info size={15} color="var(--color-text-tertiary)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.45, fontFamily: '"Inter", sans-serif' }}>
                    <strong>Presenter / Tester Note:</strong> To log in as any of the 50 seeded registry citizens (with pre-linked department records), check <code>DEMO_CREDENTIALS.md</code> for their login emails and passwords. You can browse all 50 citizens in the registry below.
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6, fontFamily: '"Inter", sans-serif' }}>
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border-default)',
                      background: 'var(--color-bg-base)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.875rem',
                      fontFamily: '"Inter", sans-serif',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6, fontFamily: '"Inter", sans-serif' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. rajesh.kumar@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border-default)',
                      background: 'var(--color-bg-base)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.875rem',
                      fontFamily: '"Inter", sans-serif',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6, fontFamily: '"Inter", sans-serif' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create account password"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border-default)',
                      background: 'var(--color-bg-base)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.875rem',
                      fontFamily: '"Inter", sans-serif',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6, fontFamily: '"Inter", sans-serif' }}>
                    State / Union Territory
                  </label>
                  <input
                    type="text"
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    placeholder="e.g. Delhi, Karnataka, Maharashtra"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border-default)',
                      background: 'var(--color-bg-base)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.875rem',
                      fontFamily: '"Inter", sans-serif',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: 4,
                    padding: '11px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--color-accent-primary)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {loading && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                  {loading ? 'Creating Account…' : 'Register Citizen Account'}
                </button>

                <div style={{ marginTop: 6, padding: '10px 12px', background: 'var(--warning-tint)', border: '1px solid var(--warning)', borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <AlertTriangle size={15} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.45, fontFamily: '"Inter", sans-serif' }}>
                    <strong>Federation Notice:</strong> Self-registered citizens are generated in Postgres with a new Universal ID (<code>OG-2026-9XXXXXXX</code>) without linked department records (UIDAI, CBDT, NAD). Workflows will report that departmental records are unlinked. For simulated cross-department approvals, sign in with a seeded persona.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Full 50-citizen directory (reference only) */}
          {citizenDirectory.length > 0 && (
            <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 10, overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setDirectoryOpen((v) => !v)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} color="var(--color-accent-primary)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: '"Inter", sans-serif' }}>
                    Browse 50-Citizen Registry ({citizenDirectory.length} Citizens)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', background: 'var(--color-bg-sunken)', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>
                    Reference Directory
                  </span>
                  <ChevronDown size={16} color="var(--color-text-tertiary)" style={{ transform: directoryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </button>

              {directoryOpen && (
                <div style={{ borderTop: '1px solid var(--color-border-subtle)', maxHeight: 380, overflowY: 'auto' }}>
                  {citizenDirectory.map((c: any, i: number) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 700, color: 'var(--on-primary)',
                      }}>
                        <UserCircle2 size={14} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', display: 'block' }}>
                          {c.name}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontFamily: '"JetBrains Mono", monospace', color: 'var(--color-text-tertiary)' }}>
                          {c.onegovId} · {c.state || 'National Registry'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-success)', background: 'rgba(43,138,104,0.08)', border: '1px solid rgba(43,138,104,0.2)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                        Federated Records Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
