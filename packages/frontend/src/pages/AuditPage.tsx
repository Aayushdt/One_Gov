import React from 'react';
import { AppShell } from '../components/layout/AppShell';

import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { AuditEntry } from '../types';
import { useAuthStore } from '../store/authStore';
import { ChevronDown, ChevronUp, Copy, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

const EVENT_COLORS: Record<string, string> = {
  CONSENT_GRANTED: 'var(--color-success)',
  CONSENT_REVOKED: 'var(--color-error)',
  CONNECTOR_FAILED: 'var(--color-accent-amber)',
  ELIGIBILITY_RESULT: 'var(--color-success)',
  CITIZEN_LOGIN: '',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const handle = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={handle} style={{ background: 'transparent', border: '1px solid var(--color-border-default)', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Copy size={11} />{copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function AuditPage() {
  const { citizenId } = useAuthStore();
  const [entries, setEntries] = React.useState<AuditEntry[]>([]);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [verifyResult, setVerifyResult] = React.useState<{ valid: boolean; brokenAt?: number; totalEntries: number } | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const fetchTrail = React.useCallback(async () => {
    if (!citizenId) return;
    try { const data = await api.getAuditTrail(citizenId); setEntries(data.entries); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, [citizenId]);

  React.useEffect(() => {
    fetchTrail();
    const interval = setInterval(fetchTrail, 3000);
    return () => clearInterval(interval);
  }, [fetchTrail]);

  const handleVerify = async () => {
    if (!citizenId) return;
    setVerifying(true);
    try { const result = await api.verifyAuditChain(citizenId); setVerifyResult(result); }
    catch { }
    finally { setVerifying(false); }
  };

  const toggleRow = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <AppShell>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Citizen Audit Trail</p>
            <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 1.25 }}>Every data access, permanently recorded.</h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', maxWidth: 520, lineHeight: 1.65 }}>
              Each entry is hash-chained to the previous one. Any retroactive modification would break the chain and be detected immediately.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={handleVerify} disabled={verifying}>
              <ShieldCheck size={15} />{verifying ? 'Verifying…' : 'Verify Chain Integrity'}
            </Button>
            {verifyResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontFamily: '"Inter", system-ui, sans-serif', color: verifyResult.valid ? 'var(--color-success)' : 'var(--color-error)' }}>
                {verifyResult.valid ? <CheckCircle size={13} /> : <XCircle size={13} />}
                {verifyResult.valid ? `Chain valid — ${verifyResult.totalEntries} entries verified` : `Tamper detected at entry #${verifyResult.brokenAt}`}
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

        {/* Table */}
        {loading ? (
          <p style={{ padding: '32px 0', fontSize: '0.875rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Loading audit trail…</p>
        ) : entries.length === 0 ? (
          <p style={{ padding: '32px 0', fontSize: '0.875rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>No audit entries yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: '"Inter", system-ui, sans-serif' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-surface)' }}>
                  {['Seq', 'Time', 'Event', 'Actor', 'Summary', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', textAlign: h === 'Seq' ? 'right' : 'left', borderBottom: '1px solid var(--color-border-subtle)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => {
                  const borderColor = EVENT_COLORS[entry.eventType];
                  const isOpen = expanded.has(entry.id);
                  return (
                    <React.Fragment key={entry.id}>
                      <tr onClick={() => toggleRow(entry.id)} style={{ borderBottom: '1px solid var(--color-border-subtle)', borderLeft: borderColor ? `3px solid ${borderColor}` : '3px solid transparent', cursor: 'pointer', transition: 'background var(--duration-fast)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-surface)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '10px 12px', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', textAlign: 'right' }}>{entry.seq}</td>
                        <td style={{ padding: '10px 12px', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>{new Date(entry.createdAt).toLocaleTimeString()}</td>
                        <td style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.03em', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{entry.eventType}</td>
                        <td style={{ padding: '10px 12px', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.actor}</td>
                        <td style={{ padding: '10px 12px', fontSize: '0.875rem', color: 'var(--color-text-primary)', maxWidth: 240 }}>
                          {(entry.payload as any).department && `${(entry.payload as any).department}`}
                          {(entry.payload as any).categories && ` ${((entry.payload as any).categories as string[]).join(', ')}`}
                          {(entry.payload as any).eligible !== undefined && ((entry.payload as any).eligible ? ' ✓ Eligible' : ' ✗ Ineligible')}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--color-text-tertiary)' }}>{isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={6} style={{ padding: 0, background: 'var(--color-bg-sunken)' }}>
                            <div style={{ padding: '16px 20px' }}>
                              <div style={{ marginBottom: 12 }}>
                                <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Payload</p>
                                <pre style={{ margin: 0, padding: '12px 16px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: 6, fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace', color: 'var(--color-text-secondary)', overflowX: 'auto', lineHeight: 1.6 }}>
                                  {JSON.stringify(entry.payload, null, 2)}
                                </pre>
                              </div>
                              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                {[{ label: 'prevHash', value: entry.prevHash }, { label: 'hash', value: entry.hash }].map(({ label, value }) => (
                                  <div key={label}>
                                    <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>{label}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'var(--color-text-secondary)', letterSpacing: '0.02em' }}>{value.slice(0, 20)}…</span>
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
