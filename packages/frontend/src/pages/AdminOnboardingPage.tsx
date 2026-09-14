import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import {
  Server,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  Key,
  Globe,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export function AdminOnboardingPage() {
  const { role, name, email } = useAuthStore();
  const isAdmin = role === 'ADMIN';

  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Form states
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('IDENTITY');
  const [baseUrl, setBaseUrl] = useState('http://mock-identity:4001');
  const [authMethod, setAuthMethod] = useState('NONE');
  const [apiKey, setApiKey] = useState('');
  const [timeoutMs, setTimeoutMs] = useState(5000);
  const [maxRetries, setMaxRetries] = useState(3);
  const [fieldSchemaJson, setFieldSchemaJson] = useState('{\n  "version": "1.0",\n  "fields": ["verified", "name", "dob", "maskedId"]\n}');

  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadConnectors = async () => {
    setRefreshing(true);
    try {
      const data = await api.getRegisteredConnectors();
      setConnectors(data.connectors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnectors();
  }, []);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (newCat === 'IDENTITY') {
      setSlug('identity-custom');
      setBaseUrl('http://mock-identity:4001');
    } else if (newCat === 'EDUCATION') {
      setSlug('education-custom');
      setBaseUrl('http://mock-education:4002');
    } else if (newCat === 'INCOME') {
      setSlug('revenue-custom');
      setBaseUrl('http://mock-revenue:4003');
    } else {
      setSlug(`${newCat.toLowerCase()}-provider`);
      setBaseUrl('http://localhost:4001');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResultMsg(null);

    let parsedSchema = {};
    try {
      parsedSchema = JSON.parse(fieldSchemaJson);
    } catch (err: any) {
      setResultMsg({ type: 'error', text: `Invalid Field Schema JSON: ${err.message}` });
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.registerConnector({
        slug: slug.trim(),
        category,
        baseUrl: baseUrl.trim(),
        authMethod,
        authConfig: apiKey ? { apiKey: apiKey.trim() } : {},
        fieldSchema: parsedSchema,
        timeoutMs: Number(timeoutMs),
        maxRetries: Number(maxRetries),
        isActive: true,
      });

      setResultMsg({
        type: 'success',
        text: `Connector '${res.slug}' successfully validated and onboarded into registry!`,
      });
      loadConnectors();
    } catch (err: any) {
      setResultMsg({ type: 'error', text: err.message || 'Registration failed' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <AppShell>
        <div style={{ maxWidth: '40rem', margin: '80px auto', padding: '40px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--color-error-bg)',
              border: '1px solid rgba(196, 58, 34, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-error)',
              margin: '0 auto 16px',
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Restricted Administrative Console
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginTop: 12 }}>
            Your account (<strong>{name || email}</strong>) has standard citizen clearance (<span style={{ fontFamily: 'monospace' }}>{role || 'CITIZEN'}</span>).
            Self-onboarding new government connectors requires the <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>ADMIN</span> role.
          </p>
          <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--color-bg-sunken)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--color-text-tertiary)', border: '1px solid var(--color-border-subtle)' }}>
            💡 To promote your account to administrator, run:<br />
            <code style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--color-accent-primary)' }}>
              node scripts/make-admin.js --email {email || 'your-email@govlink.demo'}
            </code>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: '68rem', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-accent-primary)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              <ShieldCheck size={14} /> Administrative Registry
            </div>
            <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
              Department Connector Self-Onboarding
            </h1>
            <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
              Register new department data manifests into the OneGov engine without code redeployment.
            </p>
          </div>

          <Button variant="secondary" onClick={loadConnectors} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh Registry ({connectors.length})
          </Button>
        </div>

        {/* Feedback Alert */}
        {resultMsg && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 8,
              background: resultMsg.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
              border: `1px solid ${resultMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
              color: resultMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 28,
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            {resultMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {resultMsg.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'start' }}>
          {/* Form */}
          <form
            onSubmit={handleRegister}
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 12,
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlusCircle size={18} color="var(--color-accent-primary)" /> Register Manifest
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Unique Connector Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. identity-aadhaar-sandbox"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-sunken)', color: 'var(--color-text-primary)', fontSize: '0.9rem', fontFamily: '"JetBrains Mono", monospace' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Data Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-sunken)', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                >
                  <option value="IDENTITY">IDENTITY</option>
                  <option value="EDUCATION">EDUCATION</option>
                  <option value="INCOME">INCOME</option>
                  <option value="TRANSPORT">TRANSPORT</option>
                  <option value="POLICE">POLICE</option>
                  <option value="BANKING">BANKING</option>
                  <option value="WELFARE">WELFARE</option>
                  <option value="MUNICIPAL">MUNICIPAL</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Auth Method *
                </label>
                <select
                  value={authMethod}
                  onChange={(e) => setAuthMethod(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-sunken)', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                >
                  <option value="NONE">NONE (Public/Intranet)</option>
                  <option value="API_KEY">API_KEY (Bearer/Header)</option>
                  <option value="OAUTH2">OAUTH2 Token</option>
                  <option value="MUTUAL_TLS">MUTUAL_TLS (mTLS)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Base URL (Must serve /health) *
              </label>
              <input
                type="url"
                required
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://mock-identity:4001"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-sunken)', color: 'var(--color-text-primary)', fontSize: '0.9rem', fontFamily: '"JetBrains Mono", monospace' }}
              />
            </div>

            {authMethod === 'API_KEY' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  API Key Secret (Masked)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="govlink_live_key_..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-sunken)', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-sunken)', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Max Retries
                </label>
                <input
                  type="number"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-sunken)', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Field Mapping Schema (JSON)
              </label>
              <textarea
                value={fieldSchemaJson}
                onChange={(e) => setFieldSchemaJson(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-sunken)', color: 'var(--color-text-primary)', fontSize: '0.8rem', fontFamily: '"JetBrains Mono", monospace' }}
              />
            </div>

            <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
              <Server size={16} /> {submitting ? 'Verifying & Registering…' : 'Ping & Register Manifest'}
            </Button>
          </form>

          {/* Active Connectors List */}
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color="var(--color-accent-primary)" /> Registered Connectors ({connectors.length})
            </h2>

            {loading ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Loading registry…</p>
            ) : connectors.length === 0 ? (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem' }}>No active connectors registered yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {connectors.map((c) => (
                  <div
                    key={c.id || c.slug}
                    style={{
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: 8,
                      padding: '16px 20px',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                          {c.slug}
                        </span>
                        <span style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 12, background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                          {c.category}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: c.isActive ? 'var(--color-success)' : 'var(--color-text-tertiary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} /> {c.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Globe size={13} color="var(--color-text-tertiary)" />
                        <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{c.baseUrl}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Key size={13} color="var(--color-text-tertiary)" />
                        <span>Auth: {c.authMethod}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={13} color="var(--color-text-tertiary)" />
                        <span>Timeout: {c.timeoutMs}ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
