import React from 'react';

interface ServiceStatus {
  key: string;
  label: string;
  ok: boolean;
  latencyMs: number;
  detail?: string;
}

interface HealthData {
  status: 'healthy' | 'degraded';
  timestamp: string;
  backend: { ok: boolean; label: string };
  services: ServiceStatus[];
}

const BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:3000';

function Dot({ ok, pulsing }: { ok: boolean; pulsing?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: ok ? 'var(--success)' : 'var(--danger)',
        boxShadow: ok ? '0 0 0 2px var(--success-tint)' : '0 0 0 2px var(--danger-tint)',
        animation: pulsing && ok ? 'healthPulse 2s ease-in-out infinite' : 'none',
        flexShrink: 0,
      }}
    />
  );
}

export function SystemHealthBar() {
  const [health, setHealth] = React.useState<HealthData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const fetchHealth = React.useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/health/services`);
      if (res.ok) {
        const data: HealthData = await res.json();
        setHealth(data);
        setLastUpdated(new Date());
      }
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading) return null;

  const allServices = health
    ? [
        { key: 'backend', label: 'Backend', ok: health.backend.ok, latencyMs: 0 },
        ...health.services,
      ]
    : [];
  const overallOk = health?.status === 'healthy';

  return (
    <>
      <style>{`
        @keyframes healthPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          background: 'var(--panel)',
          border: `1px solid ${overallOk ? 'var(--success)' : 'var(--danger)'}`,
          borderRadius: 10,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          minWidth: 180,
          maxWidth: 300,
          fontFamily: '"Inter", system-ui, sans-serif',
        }}
      >
        {/* Header bar — always visible */}
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Dot ok={overallOk} pulsing />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-nav-text)', flex: 1, textAlign: 'left' }}>
            {health ? (overallOk ? 'All Systems Operational' : 'Service Degraded') : 'Offline'}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-nav-text-muted)' }}>
            {expanded ? '▴' : '▾'}
          </span>
        </button>

        {/* Expanded detail panel */}
        {expanded && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8px 12px 10px' }}>
            {allServices.map((svc) => (
              <div
                key={svc.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <Dot ok={svc.ok} />
                <span style={{ fontSize: '0.7rem', color: 'var(--color-nav-text)', flex: 1 }}>{svc.label}</span>
                {svc.latencyMs > 0 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-nav-text-muted)', fontFamily: '"JetBrains Mono", monospace' }}>
                    {svc.latencyMs}ms
                  </span>
                )}
              </div>
            ))}

            <p style={{ margin: '6px 0 0', fontSize: '0.62rem', color: 'var(--color-nav-text-muted)', textAlign: 'right' }}>
              Updated {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'} · auto-refresh 10s
            </p>
          </div>
        )}
      </div>
    </>
  );
}
