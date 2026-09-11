import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';

const DEMO_ACCOUNTS = [
  { email: 'priya@govlink.demo', name: 'Priya Sharma', note: 'Eligible applicant' },
  { email: 'rahul@govlink.demo', name: 'Rahul Verma', note: 'Ineligible (high income)' },
  { email: 'sneha@govlink.demo', name: 'Sneha Patel', note: 'Revenue retry demo' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const citizenId = useAuthStore(s => s.citizenId);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => { if (citizenId) navigate('/services'); }, [citizenId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      login(data.citizenId, data.name, data.token);
      navigate('/services');
    } catch {
      setError('Invalid email or password. Check the demo credentials panel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left dark column */}
      <div className="hidden md:flex" style={{ width: '40%', background: 'var(--color-nav-bg)', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 40px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 36, height: 36, background: 'var(--color-accent-primary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '0.875rem' }}>GL</span>
            </div>
            <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-nav-text)' }}>GovLink</span>
          </div>

          <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-nav-text)', lineHeight: 1.25, margin: '0 0 16px' }}>
            Government Digital<br />Service Portal
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-nav-text-muted)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.65, margin: 0 }}>
            Consent-based interoperability middleware. Your data moves only with your explicit permission.
          </p>
        </div>

        {/* Demo credentials */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
          <p style={{ margin: '0 0 12px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-nav-text-muted)', fontFamily: '"Inter", system-ui, sans-serif' }}>
            Demo credentials (password: demo123)
          </p>
          {DEMO_ACCOUNTS.map(a => (
            <button key={a.email} onClick={() => { setEmail(a.email); setPassword('demo123'); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 12px', marginBottom: 8, cursor: 'pointer', transition: 'background var(--duration-fast)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
              <p style={{ margin: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8125rem', color: 'var(--color-nav-text)' }}>{a.email}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-nav-text-muted)', fontFamily: '"Inter", system-ui, sans-serif' }}>{a.name} — {a.note}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right form column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(32px,8vw,80px)' }}>
        <div style={{ maxWidth: 400, width: '100%' }}>
          {/* Mobile wordmark */}
          <div className="md:hidden" style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: 'var(--color-accent-primary)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>GL</span>
            </div>
            <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>GovLink</span>
          </div>

          <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 1.2 }}>Welcome back.</h2>
          <p style={{ margin: '0 0 32px', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Sign in to continue your scholarship application.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" error={error || undefined} />
            <Button type="submit" disabled={loading} fullWidth>{loading ? 'Signing in…' : 'Sign in'}</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
