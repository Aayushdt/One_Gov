import React, { useState } from 'react';
import { Flag, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../hooks/useApi';

interface GrievanceFlagButtonProps {
  auditEntryId: string;
  seq: number;
  eventType: string;
  onFlagged?: () => void;
}

export function GrievanceFlagButton({ auditEntryId, seq, eventType, onFlagged }: GrievanceFlagButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await api.flagAuditEntry(auditEntryId, reason.trim());
      setSuccess(true);
      if (onFlagged) onFlagged();
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setReason('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to record grievance flag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 4,
          border: '1px solid var(--color-border-default)',
          background: 'var(--color-bg-sunken)',
          color: 'var(--color-text-secondary)',
          fontSize: '0.7rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all var(--duration-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-warning)';
          e.currentTarget.style.borderColor = 'var(--color-warning)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-secondary)';
          e.currentTarget.style.borderColor = 'var(--color-border-default)';
        }}
        title="Flag this audit entry for administrative review"
      >
        <Flag size={11} /> Flag
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(26, 19, 17, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 440,
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flag size={16} color="var(--color-warning)" />
                <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                  Flag Audit Log Discrepancy
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Attach an administrative discrepancy flag to log block #{seq} ({eventType}). This creates an immutable citizen grievance dossier for review.
            </p>

            {success ? (
              <div style={{ padding: '12px 14px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: 8, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Grievance flag recorded and logged successfully!
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{ padding: '8px 12px', background: 'var(--color-error-bg)', border: '1px solid var(--color-error)', borderRadius: 6, color: 'var(--color-error)', fontSize: '0.8rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                    Discrepancy Reason / Grounds *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe why you believe this data access or state transition is incorrect (e.g. 'Consent was already revoked prior to this query timestamp')."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border-default)',
                      background: 'var(--color-bg-sunken)',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.85rem',
                      fontFamily: '"Inter", sans-serif',
                      lineHeight: 1.4,
                      resize: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--color-border-default)',
                      background: 'transparent',
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !reason.trim()}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'var(--color-warning)',
                      color: 'var(--color-nav-bg)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? 'Submitting…' : 'Submit Grievance'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
