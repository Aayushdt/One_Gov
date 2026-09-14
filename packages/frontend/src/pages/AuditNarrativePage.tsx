import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Database,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GrievanceFlagButton } from '../components/GrievanceFlagButton';

interface NarrativeEntry {
  id: string;
  seq: number;
  eventType: string;
  key: string;
  params: Record<string, string>;
  createdAt: string;
}

export function AuditNarrativePage() {
  const { citizenId, name, onegovId } = useAuthStore();
  const { t } = useTranslation();
  const [narratives, setNarratives] = useState<NarrativeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNarratives = async () => {
    if (!citizenId) return;
    setLoading(true);
    try {
      const data = await api.getAuditNarrative(citizenId);
      setNarratives(data.narratives || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit narrative');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNarratives();
  }, [citizenId]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'CITIZEN_LOGIN':
        return <KeyRound size={16} color="var(--color-accent-primary)" />;
      case 'CONSENT_GRANTED':
        return <Shield size={16} color="var(--color-success)" />;
      case 'CONSENT_REVOKED':
        return <AlertCircle size={16} color="var(--color-error)" />;
      case 'CONNECTOR_SUCCESS':
      case 'ELIGIBILITY_RESULT':
        return <CheckCircle2 size={16} color="var(--color-success)" />;
      case 'CONNECTOR_FAILED':
        return <AlertCircle size={16} color="var(--color-warning)" />;
      case 'WORKFLOW_STATE_CHANGE':
        return <ArrowRight size={16} color="var(--color-text-secondary)" />;
      default:
        return <Clock size={16} color="var(--color-text-tertiary)" />;
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: '68rem', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header & Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
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
              Plain-Language Access History
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '2.25rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Data Access &amp; Activity Log
              </h1>
              <span
                style={{
                  background: 'var(--color-success-bg)',
                  color: 'var(--color-success)',
                  border: '1px solid rgba(43, 138, 104, 0.25)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                DPDP Transparent
              </span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              An immutable, human-readable timeline explaining every time government databases accessed your data.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link
              to="/audit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-default)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all var(--duration-fast)',
              }}
            >
              <Database size={14} color="var(--color-accent-primary)" /> Switch to Technical Hash View
            </Link>
          </div>
        </div>

        {/* Citizen Card Banner */}
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(229, 71, 45, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent-primary)',
                fontWeight: 700,
                fontSize: '0.95rem',
                fontFamily: '"Playfair Display", Georgia, serif',
              }}
            >
              {name ? name.charAt(0) : 'C'}
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"JetBrains Mono", monospace' }}>
                Universal ID: {onegovId}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Total Audit Checkpoints: <strong style={{ color: 'var(--color-text-primary)' }}>{narratives.length}</strong>
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-tertiary)' }}>Translating audit records…</div>
        ) : error ? (
          <div style={{ padding: '1rem', background: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid rgba(196, 58, 34, 0.3)', borderRadius: '8px' }}>
            {error}
          </div>
        ) : narratives.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-surface)', borderRadius: '8px', border: '1px dashed var(--color-border-default)' }}>
            No audit entries found.
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '2rem' }}>
            {/* Vertical timeline rule */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                bottom: '10px',
                left: '11px',
                width: '2px',
                background: 'var(--color-border-subtle)',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {narratives.map((entry) => {
                const sentence = t(entry.key, entry.params);
                const dateObj = new Date(entry.createdAt);

                return (
                  <div key={entry.id} style={{ position: 'relative' }}>
                    {/* Circle Node on Timeline */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-2rem',
                        top: '14px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--color-bg-surface)',
                        border: '2px solid var(--color-border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                      }}
                    >
                      {getEventIcon(entry.eventType)}
                    </div>

                    {/* Content Card */}
                    <div
                      style={{
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '8px',
                        padding: '16px 20px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontFamily: '"JetBrains Mono", monospace',
                              color: 'var(--color-text-tertiary)',
                              fontWeight: 600,
                            }}
                          >
                            #{entry.seq}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--color-bg-sunken)',
                              border: '1px solid var(--color-border-subtle)',
                              color: 'var(--color-text-secondary)',
                              fontWeight: 600,
                            }}
                          >
                            {entry.eventType}
                          </span>
                        </div>

                        <p
                          style={{
                            margin: '4px 0 6px',
                            fontSize: '0.9rem',
                            color: 'var(--color-text-primary)',
                            lineHeight: 1.5,
                            fontFamily: '"Inter", sans-serif',
                          }}
                        >
                          {sentence}
                        </p>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-tertiary)',
                          }}
                        >
                          {dateObj.toLocaleDateString()} at {dateObj.toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Grievance Flag Button */}
                      <div>
                        <GrievanceFlagButton
                          auditEntryId={entry.id}
                          seq={entry.seq}
                          eventType={entry.eventType}
                          onFlagged={fetchNarratives}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
