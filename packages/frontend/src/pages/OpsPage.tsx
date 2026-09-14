import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { RefreshCw } from 'lucide-react';
import { api } from '../hooks/useApi';

interface ConnectorMetricItem {
  connectorSlug: string;
  category: string;
  totalCalls: number;
  successes: number;
  failures: number;
  retries: number;
  circuitOpens: number;
  successRate: number;
  avgDurationMs: number;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
  rateLimitUsagePercent?: number;
  lastFailureReason?: string | null;
  failCount: number;
  isActive?: boolean;
}

export function OpsPage() {
  const [metrics, setMetrics] = useState<ConnectorMetricItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resettingSlug, setResettingSlug] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getOpsMetrics();
      setMetrics(data.connectors || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ops metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleResetBreaker = async (slug: string) => {
    setResettingSlug(slug);
    try {
      await api.resetCircuitBreaker(slug);
      await fetchMetrics();
    } catch (err: any) {
      alert(`Failed to reset circuit breaker: ${err.message}`);
    } finally {
      setResettingSlug(null);
    }
  };

  const totalCalls = metrics.reduce((acc, m) => acc + m.totalCalls, 0);
  const totalSuccesses = metrics.reduce((acc, m) => acc + m.successes, 0);
  const overallSuccessRate = totalCalls > 0 ? Math.round((totalSuccesses / totalCalls) * 100) : 100;
  const openCircuits = metrics.filter((m) => m.circuitBreakerState !== 'closed').length;

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
              System Operations &amp; Telemetry
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
              Resilience &amp; Circuit Breakers
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Real-time monitoring of federated connectors, circuit breaker trip states, and rate limits.
            </p>
          </div>
          <button
            onClick={fetchMetrics}
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

        {/* Aggregate KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '10px', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Invocations (24h)</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px', fontFamily: '"Playfair Display", Georgia, serif' }}>
              {totalCalls}
            </div>
          </div>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '10px', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ color: 'var(--color-success)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Success Rate</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px', fontFamily: '"Playfair Display", Georgia, serif' }}>
              {overallSuccessRate}%
            </div>
          </div>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '10px', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ color: openCircuits > 0 ? 'var(--color-error)' : 'var(--color-success)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Open Circuits</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: openCircuits > 0 ? 'var(--color-error)' : 'var(--color-success)', marginTop: '4px', fontFamily: '"Playfair Display", Georgia, serif' }}>
              {openCircuits}
            </div>
          </div>
        </div>

        {/* Connector Health Grid */}
        <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.35rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 16px' }}>
          Federated Connector Latency &amp; Fault Registry
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {metrics.map((m) => {
            const isTripped = m.circuitBreakerState !== 'closed';
            return (
              <div
                key={m.connectorSlug}
                style={{
                  background: 'var(--color-bg-surface)',
                  border: isTripped ? '1px solid var(--color-error)' : '1px solid var(--color-border-subtle)',
                  borderRadius: '10px',
                  padding: '20px 22px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', color: 'var(--color-text-primary)' }}>
                      {m.connectorSlug}
                    </span>
                    <span style={{ marginLeft: '8px', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--color-bg-sunken)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-subtle)', fontWeight: 600 }}>
                      {m.category}
                    </span>
                  </div>

                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background:
                        m.circuitBreakerState === 'closed'
                          ? 'var(--color-success-bg)'
                          : m.circuitBreakerState === 'half-open'
                          ? 'var(--color-warning-bg)'
                          : 'var(--color-error-bg)',
                      color:
                        m.circuitBreakerState === 'closed'
                          ? 'var(--color-success)'
                          : m.circuitBreakerState === 'half-open'
                          ? 'var(--color-warning)'
                          : 'var(--color-error)',
                      border: `1px solid ${
                        m.circuitBreakerState === 'closed'
                          ? 'rgba(43, 138, 104, 0.25)'
                          : m.circuitBreakerState === 'half-open'
                          ? 'rgba(246, 168, 31, 0.25)'
                          : 'rgba(196, 58, 34, 0.25)'
                      }`,
                    }}
                  >
                    Breaker: {m.circuitBreakerState}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'var(--color-bg-sunken)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Success Rate</span>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>{m.successRate}%</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Avg Latency</span>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>{m.avgDurationMs}ms</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Trips / Retries</span>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>{m.circuitOpens} / {m.retries}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    Conseq. Failures: <strong style={{ color: m.failCount > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>{m.failCount}</strong>
                  </span>

                  {isTripped && (
                    <button
                      onClick={() => handleResetBreaker(m.connectorSlug)}
                      disabled={resettingSlug === m.connectorSlug}
                      style={{
                        padding: '4px 12px',
                        background: 'var(--color-error-bg)',
                        border: '1px solid rgba(196, 58, 34, 0.3)',
                        borderRadius: '4px',
                        color: 'var(--color-error)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all var(--duration-fast)',
                      }}
                    >
                      {resettingSlug === m.connectorSlug ? 'Resetting…' : 'Reset Breaker'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
