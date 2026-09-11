import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { AuditEntry } from '../types';
import { useAuthStore } from '../store/authStore';
import { ChevronDown, ChevronUp, Copy, CheckCircle, XCircle, ShieldCheck, Zap, RotateCcw, Link2, Filter, AlertTriangle } from 'lucide-react';

const EVENT_COLORS: Record<string, string> = {
  CONSENT_GRANTED: 'var(--color-success)',
  CONSENT_REVOKED: 'var(--color-error)',
  CONNECTOR_CALLED: '#3b82f6',
  CONNECTOR_SUCCESS: 'var(--color-success)',
  CONNECTOR_FAILED: 'var(--color-accent-amber)',
  ELIGIBILITY_RESULT: 'var(--color-success)',
  WORKFLOW_STATE_CHANGE: '#8b5cf6',
  CITIZEN_LOGIN: '#64748b',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handle}
      style={{
        background: 'transparent',
        border: '1px solid var(--color-border-default)',
        borderRadius: 4,
        padding: '2px 8px',
        cursor: 'pointer',
        fontSize: '0.75rem',
        color: 'var(--color-text-tertiary)',
        fontFamily: '"Inter", system-ui, sans-serif',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Copy size={11} />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function AuditPage() {
  const { citizenId, name } = useAuthStore();
  const [entries, setEntries] = React.useState<AuditEntry[]>([]);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [verifyResult, setVerifyResult] = React.useState<{ valid: boolean; brokenAt?: number; totalEntries: number } | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  const [tampering, setTampering] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<{ text: string; type: 'info' | 'warn' | 'success' } | null>(null);
  const [selectedFilter, setSelectedFilter] = React.useState<string>('ALL');
  const [loading, setLoading] = React.useState(true);

  const fetchTrail = React.useCallback(async () => {
    if (!citizenId) return;
    try {
      const data = await api.getAuditTrail(citizenId);
      setEntries(data.entries);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [citizenId]);

  React.useEffect(() => {
    fetchTrail();
    const interval = setInterval(fetchTrail, 3000);
    return () => clearInterval(interval);
  }, [fetchTrail]);

  const handleVerify = async () => {
    if (!citizenId) return;
    setVerifying(true);
    try {
      const result = await api.verifyAuditChain(citizenId);
      setVerifyResult(result);
    } catch (e: any) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  const handleTamper = async () => {
    if (!citizenId) return;
    setTampering(true);
    try {
      const res = await api.tamperAuditChain(citizenId);
      setActionMessage({ text: `Simulated direct database mutation on Audit Entry #${res.tamperedSeq}. Click "Verify Chain Integrity" to test tamper detection.`, type: 'warn' });
      await fetchTrail();
      setVerifyResult(null);
    } catch (e: any) {
      setActionMessage({ text: 'Tamper failed: ' + e.message, type: 'info' });
    } finally {
      setTampering(false);
    }
  };

  const handleRestore = async () => {
    if (!citizenId) return;
    setRestoring(true);
    try {
      await api.restoreAuditChain(citizenId);
      setActionMessage({ text: 'Audit chain restored and re-sealed with valid SHA-256 signatures.', type: 'success' });
      await fetchTrail();
      setVerifyResult(null);
    } catch (e: any) {
      setActionMessage({ text: 'Restore failed: ' + e.message, type: 'info' });
    } finally {
      setRestoring(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const filteredEntries = entries.filter((e) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'CONSENT') return e.eventType.startsWith('CONSENT');
    if (selectedFilter === 'CONNECTOR') return e.eventType.startsWith('CONNECTOR');
    if (selectedFilter === 'WORKFLOW') return e.eventType.startsWith('WORKFLOW') || e.eventType === 'ELIGIBILITY_RESULT';
    if (selectedFilter === 'AUTH') return e.eventType.startsWith('CITIZEN');
    return true;
  });

  return (
    <AppShell>
      <div style={{ maxWidth: '76rem', margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
                Cryptographic Verification Center
              </span>
              <span style={{ padding: '2px 8px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 12, fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontFamily: '"JetBrains Mono", monospace' }}>
                SHA-256 Hash Chain
              </span>
            </div>
            <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2.25rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 1.25 }}>
              Citizen Immutable Audit Ledger
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', maxWidth: 580, lineHeight: 1.65 }}>
              Every authentication, consent grant, inter-agency API request, and eligibility decision is permanently linked in a per-citizen cryptographic hash chain.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button onClick={handleVerify} disabled={verifying || entries.length === 0} size="md">
                <ShieldCheck size={16} />
                {verifying ? 'Verifying Hash Chain…' : 'Verify Chain Integrity'}
              </Button>

              <Button variant="secondary" onClick={handleTamper} disabled={tampering || entries.length === 0} size="md" title="Simulate a database attack">
                <Zap size={15} color="var(--color-accent-amber)" />
                {tampering ? 'Tampering…' : '⚡ Simulate DB Tamper'}
              </Button>

              <Button variant="ghost" onClick={handleRestore} disabled={restoring || entries.length === 0} size="md" title="Restore and re-sign chain">
                <RotateCcw size={15} />
                {restoring ? 'Restoring…' : 'Restore Chain'}
              </Button>
            </div>

            {/* Verification result badge */}
            {verifyResult && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 6,
                  background: verifyResult.valid ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                  border: `1px solid ${verifyResult.valid ? 'var(--color-success)' : 'var(--color-error)'}`,
                  fontSize: '0.8125rem',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  color: verifyResult.valid ? 'var(--color-success)' : 'var(--color-error)',
                }}
              >
                {verifyResult.valid ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <strong>
                  {verifyResult.valid
                    ? `Chain Valid — ${verifyResult.totalEntries} Sequential SHA-256 Blocks Verified from Genesis`
                    : `🚨 Tamper Detected at Block #${verifyResult.brokenAt}! Hash mismatch broke the cryptographic chain.`}
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Action message notification */}
        {actionMessage && (
          <div
            style={{
              marginBottom: 24,
              padding: '12px 18px',
              borderRadius: 8,
              background: actionMessage.type === 'warn' ? 'var(--color-warning-bg)' : actionMessage.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-bg-surface)',
              border: `1px solid ${actionMessage.type === 'warn' ? 'var(--color-accent-amber)' : actionMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-border-default)'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {actionMessage.type === 'warn' ? <AlertTriangle size={16} color="var(--color-accent-amber)" /> : <CheckCircle size={16} color="var(--color-success)" />}
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', fontFamily: '"Inter", sans-serif' }}>
                {actionMessage.text}
              </span>
            </div>
            <button onClick={() => setActionMessage(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>×</button>
          </div>
        )}

        {/* Visual Chain Diagram */}
        {entries.length > 0 && (
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 10, padding: '20px 24px', marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
                Live Blockchain / Hash Chain Visualization (Latest Blocks)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
                Genesis: <code style={{ fontFamily: '"JetBrains Mono", monospace' }}>000000000000…</code>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
              <div style={{ flexShrink: 0, padding: '8px 12px', background: 'var(--color-bg-base)', border: '1px dashed var(--color-border-default)', borderRadius: 6, textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Genesis</span>
                <p style={{ margin: 0, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>#0 · 0000…00</p>
              </div>

              {entries.slice(-6).map((e) => (
                <React.Fragment key={e.id}>
                  <Link2 size={14} color="var(--color-border-default)" style={{ flexShrink: 0 }} />
                  <div
                    onClick={() => toggleRow(e.id)}
                    style={{
                      flexShrink: 0,
                      padding: '8px 14px',
                      background: 'var(--color-bg-base)',
                      border: `1.5px solid ${EVENT_COLORS[e.eventType] || 'var(--color-border-default)'}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'transform var(--duration-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        Block #{e.seq}
                      </span>
                      <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: 3, background: 'var(--color-bg-surface)', color: EVENT_COLORS[e.eventType] || 'var(--color-text-secondary)', fontWeight: 600 }}>
                        {e.eventType.replace('_', ' ')}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>
                      {e.hash.slice(0, 12)}…
                    </p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} color="var(--color-text-tertiary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filter:</span>
            {['ALL', 'CONSENT', 'CONNECTOR', 'WORKFLOW', 'AUTH'].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--color-border-default)',
                  background: selectedFilter === f ? 'var(--color-accent-primary)' : 'transparent',
                  color: selectedFilter === f ? 'white' : 'var(--color-text-secondary)',
                  transition: 'all var(--duration-fast)',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", sans-serif' }}>
            Showing {filteredEntries.length} of {entries.length} entries for citizen <strong>{name}</strong>
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ padding: '32px 0', fontSize: '0.875rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
            Loading cryptographic audit trail…
          </p>
        ) : entries.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--color-bg-surface)', borderRadius: 8, border: '1px solid var(--color-border-subtle)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>No Audit Records Found</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Apply for a service to initiate audited data transactions.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Inter", system-ui, sans-serif' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-surface)' }}>
                  {['Seq', 'Timestamp', 'Event Type', 'Actor', 'Audit Payload Summary', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 14px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-tertiary)',
                        textAlign: h === 'Seq' ? 'right' : 'left',
                        borderBottom: '1px solid var(--color-border-subtle)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const borderColor = EVENT_COLORS[entry.eventType];
                  const isOpen = expanded.has(entry.id);
                  const isTampered = (entry.payload as any)._unauthorizedMutation;
                  return (
                    <React.Fragment key={entry.id}>
                      <tr
                        onClick={() => toggleRow(entry.id)}
                        style={{
                          borderBottom: '1px solid var(--color-border-subtle)',
                          borderLeft: isTampered ? '4px solid var(--color-error)' : borderColor ? `4px solid ${borderColor}` : '4px solid transparent',
                          background: isTampered ? 'rgba(197, 48, 48, 0.08)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background var(--duration-fast)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = isTampered ? 'rgba(197, 48, 48, 0.12)' : 'var(--color-bg-surface)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = isTampered ? 'rgba(197, 48, 48, 0.08)' : 'transparent')}
                      >
                        <td style={{ padding: '12px 14px', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', textAlign: 'right' }}>
                          #{entry.seq}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                          {new Date(entry.createdAt).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.03em', color: isTampered ? 'var(--color-error)' : 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                          {entry.eventType} {isTampered && '⚠️ [MUTATED]'}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {entry.actor}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', maxWidth: 320 }}>
                          {(entry.payload as any).department && <strong style={{ color: 'var(--color-text-primary)' }}>{(entry.payload as any).department} · </strong>}
                          {(entry.payload as any).categories && `Granted: ${((entry.payload as any).categories as string[]).join(', ')}`}
                          {(entry.payload as any).eligible !== undefined && ((entry.payload as any).eligible ? '✓ Decision: Eligible' : '✗ Decision: Criteria Not Met')}
                          {(entry.payload as any).fromState && `${(entry.payload as any).fromState} ➔ ${(entry.payload as any).toState}`}
                          {(entry.payload as any)._unauthorizedMutation && <span style={{ color: 'var(--color-error)', fontWeight: 700 }}> Direct DB Edit: {(entry.payload as any)._unauthorizedMutation}</span>}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-text-tertiary)' }}>
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={6} style={{ padding: 0, background: 'var(--color-bg-sunken)' }}>
                            <div style={{ padding: '20px 24px' }}>
                              <div style={{ marginBottom: 16 }}>
                                <p style={{ margin: '0 0 8px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>
                                  Parsed Audit Event Payload
                                </p>
                                <pre style={{ margin: 0, padding: '14px 18px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: 8, fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace', color: 'var(--color-text-secondary)', overflowX: 'auto', lineHeight: 1.6 }}>
                                  {JSON.stringify(entry.payload, null, 2)}
                                </pre>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                                {[
                                  { label: 'Previous Block Hash (prevHash)', value: entry.prevHash },
                                  { label: 'Calculated SHA-256 Hash', value: entry.hash },
                                ].map(({ label, value }) => (
                                  <div key={label} style={{ padding: '12px 16px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: 6 }}>
                                    <p style={{ margin: '0 0 6px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>
                                      {label}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>
                                        {value}
                                      </span>
                                      <CopyButton text={value} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
