import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../hooks/useApi';
import { Clock, RefreshCw, XCircle, UserCheck } from 'lucide-react';

interface ConsentItem {
  id: string;
  category: string;
  purpose: string;
  requestedBy: string;
  grantedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  maxUses: number | null;
  useCount: number;
  guardianId: string | null;
  workflowRunId: string;
  workflowRun?: {
    serviceType: string;
    createdAt: string;
    state: string;
  };
}

export function ConsentDashboardPage() {
  const [artefacts, setArtefacts] = useState<ConsentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const data = await api.getAllConsents();
      setArtefacts(data.artefacts || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load consent artefacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const handleRevoke = async (runId: string, category: string) => {
    setActionLoading(`${runId}-${category}`);
    try {
      await api.revokeConsent(runId, category);
      await fetchConsents();
    } catch (err: any) {
      alert(`Failed to revoke consent: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenew = async (runId: string) => {
    setActionLoading(`renew-${runId}`);
    try {
      await api.renewConsent(runId, 48); // extend 48 hours
      await fetchConsents();
    } catch (err: any) {
      alert(`Failed to renew consent: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = artefacts.filter((a) => a.status === 'ACTIVE').length;
  const revokedCount = artefacts.filter((a) => a.status === 'REVOKED').length;
  const expiredCount = artefacts.filter((a) => a.status === 'EXPIRED').length;

  return (
    <AppShell>
      <div style={{ maxWidth: '68rem', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--color-text-tertiary)',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              Consent &amp; Privacy Control
            </span>
            <h1
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '2.25rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                margin: '6px 0 8px',
                lineHeight: 1.2,
              }}
            >
              Citizen Consent Dashboard
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Inspect, renew, or revoke granular data-sharing consents across all your OneGov applications.
            </p>
          </div>
          <button
            onClick={fetchConsents}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--duration-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-default)')}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--color-error-bg)', border: '1px solid rgba(196, 58, 34, 0.3)', borderRadius: '8px', padding: '1rem', color: 'var(--color-error)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Quick KPI Counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '10px', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ color: 'var(--color-success)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Consents</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px', fontFamily: '"Playfair Display", Georgia, serif' }}>
              {activeCount}
            </div>
          </div>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '10px', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ color: 'var(--color-error)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Revoked Consents</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-error)', marginTop: '4px', fontFamily: '"Playfair Display", Georgia, serif' }}>
              {revokedCount}
            </div>
          </div>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '10px', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expired Consents</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginTop: '4px', fontFamily: '"Playfair Display", Georgia, serif' }}>
              {expiredCount}
            </div>
          </div>
        </div>

        {/* Artefact Cards */}
        {artefacts.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-bg-surface)', border: '1px dashed var(--color-border-default)', borderRadius: '10px', color: 'var(--color-text-secondary)' }}>
            No consent records found for your account yet. Apply for a service to view granular consents.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {artefacts.map((a) => {
              const isExpiring = new Date(a.expiresAt).getTime() - Date.now() < 24 * 3600 * 1000 && a.status === 'ACTIVE';
              return (
                <div
                  key={a.id}
                  style={{
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '10px',
                    padding: '20px 24px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '1.5rem',
                    alignItems: 'center',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background:
                            a.status === 'ACTIVE'
                              ? 'var(--color-success-bg)'
                              : a.status === 'REVOKED'
                              ? 'var(--color-error-bg)'
                              : 'var(--color-bg-sunken)',
                          color:
                            a.status === 'ACTIVE'
                              ? 'var(--color-success)'
                              : a.status === 'REVOKED'
                              ? 'var(--color-error)'
                              : 'var(--color-text-tertiary)',
                          border: `1px solid ${
                            a.status === 'ACTIVE'
                              ? 'rgba(43, 138, 104, 0.25)'
                              : a.status === 'REVOKED'
                              ? 'rgba(196, 58, 34, 0.25)'
                              : 'var(--color-border-subtle)'
                          }`,
                        }}
                      >
                        {a.status}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {a.category}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>•</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        {a.workflowRun?.serviceType || 'SCHOLARSHIP'}
                      </span>
                      {a.maxUses && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-primary)', background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border-subtle)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          Single-Use ({a.useCount}/{a.maxUses})
                        </span>
                      )}
                      {a.guardianId && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-accent-amber)', background: 'var(--color-warning-bg)', border: '1px solid rgba(246, 168, 31, 0.3)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <UserCheck size={12} /> Guardian/Delegate Consent
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {a.purpose}
                    </p>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', flexWrap: 'wrap' }}>
                      <span>Granted: <strong style={{ color: 'var(--color-text-secondary)' }}>{new Date(a.grantedAt).toLocaleDateString()}</strong></span>
                      <span>
                        Expires:{' '}
                        <strong style={{ color: isExpiring ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                          {new Date(a.expiresAt).toLocaleDateString()} {new Date(a.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </strong>
                      </span>
                      {isExpiring && (
                        <span style={{ color: 'var(--color-warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> Expiring soon (&lt; 24h)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {a.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleRevoke(a.workflowRunId, a.category)}
                        disabled={actionLoading === `${a.workflowRunId}-${a.category}`}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          background: 'var(--color-error-bg)',
                          border: '1px solid rgba(196, 58, 34, 0.3)',
                          color: 'var(--color-error)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all var(--duration-fast)',
                        }}
                      >
                        <XCircle size={14} />
                        {actionLoading === `${a.workflowRunId}-${a.category}` ? 'Revoking…' : 'Revoke'}
                      </button>
                    )}

                    {isExpiring && (
                      <button
                        onClick={() => handleRenew(a.workflowRunId)}
                        disabled={actionLoading === `renew-${a.workflowRunId}`}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          background: 'var(--color-accent-primary)',
                          border: 'none',
                          color: 'var(--color-text-inverse)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all var(--duration-fast)',
                        }}
                      >
                        <RefreshCw size={14} />
                        {actionLoading === `renew-${a.workflowRunId}` ? 'Renewing…' : 'Extend +48h'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
