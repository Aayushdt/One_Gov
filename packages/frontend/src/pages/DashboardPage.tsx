import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../hooks/useApi';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WorkflowRunSummary {
  id: string;
  serviceType: string;
  state: string;
  eligibleResult: boolean | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const SERVICE_NAMES: Record<string, string> = {
  SCHOLARSHIP: 'National Merit STEM Fellowship',
  TRANSPORT: 'Commercial Transport Fast-Pass',
  WELFARE: 'Direct Benefit Transfer & Welfare',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [runs, setRuns] = useState<WorkflowRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const formatState = (state: string) => {
    const norm = state.toUpperCase();
    if (norm === 'SUBMITTED') return t('dashboard.statusSubmitted');
    if (norm === 'ACTIVE' || norm === 'IN_PROGRESS') return t('dashboard.statusActive');
    if (norm === 'FAILED') return t('dashboard.statusFailed');
    if (norm === 'APPROVED') return t('dashboard.statusApproved');
    return state;
  };

  const getFilterLabel = (st: string) => {
    if (st === 'ALL') return t('dashboard.filterAll');
    if (st === 'SUBMITTED') return t('dashboard.filterSubmitted');
    if (st === 'ACTIVE') return t('dashboard.filterActive');
    if (st === 'FAILED') return t('dashboard.filterFailed');
    return st;
  };

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const data = await api.getMyWorkflows();
      setRuns(data.runs || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const filteredRuns = runs.filter((run) => {
    const serviceName = SERVICE_NAMES[run.serviceType] || run.serviceType;
    const matchesSearch =
      serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'SUBMITTED') return matchesSearch && run.state === 'SUBMITTED';
    if (statusFilter === 'FAILED') return matchesSearch && run.state === 'FAILED';
    if (statusFilter === 'ACTIVE')
      return matchesSearch && run.state !== 'SUBMITTED' && run.state !== 'FAILED';
    return matchesSearch;
  });

  const totalRuns = runs.length;
  const completedRuns = runs.filter((r) => r.state === 'SUBMITTED').length;
  const approvedRuns = runs.filter((r) => r.eligibleResult === true).length;
  const inProgressRuns = runs.filter((r) => r.state !== 'SUBMITTED' && r.state !== 'FAILED').length;

  return (
    <AppShell>
      <div style={{ maxWidth: '68rem', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
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
              Unified Citizen Portal
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
              {t('dashboard.title')}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {t('dashboard.subtitle')}
            </p>
          </div>
          <button
            onClick={() => navigate('/services')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              background: 'var(--color-accent-primary)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity var(--duration-base)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <PlusCircle size={16} /> {t('dashboard.newApp')}
          </button>
        </div>

        {/* Metrics row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '10px',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              {t('dashboard.total')}
            </span>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                marginTop: '4px',
                fontFamily: '"Playfair Display", Georgia, serif',
              }}
            >
              {totalRuns}
            </div>
          </div>
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '10px',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--color-success)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              {t('dashboard.eligible')}
            </span>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--color-success)',
                marginTop: '4px',
                fontFamily: '"Playfair Display", Georgia, serif',
              }}
            >
              {approvedRuns}
            </div>
          </div>
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '10px',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--color-accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              {t('dashboard.completed')}
            </span>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--color-accent-primary)',
                marginTop: '4px',
                fontFamily: '"Playfair Display", Georgia, serif',
              }}
            >
              {completedRuns}
            </div>
          </div>
          <div
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '10px',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--color-warning)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              {t('dashboard.inProgress')}
            </span>
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--color-warning)',
                marginTop: '4px',
                fontFamily: '"Playfair Display", Georgia, serif',
              }}
            >
              {inProgressRuns}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-default)',
              borderRadius: '8px',
              padding: '8px 14px',
              flex: '1',
              maxWidth: '380px',
            }}
          >
            <Search size={16} color="var(--color-text-tertiary)" style={{ marginRight: '8px' }} />
            <input
              type="text"
              placeholder={t('dashboard.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
                width: '100%',
                fontFamily: '"Inter", sans-serif',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--color-text-tertiary)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Filter:</span>
            {['ALL', 'SUBMITTED', 'ACTIVE', 'FAILED'].map((st) => {
              const isSelected = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--color-accent-primary)' : 'var(--color-bg-surface)',
                    color: isSelected ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                    borderColor: isSelected ? 'var(--color-accent-primary)' : 'var(--color-border-default)',
                    transition: 'all var(--duration-fast)',
                  }}
                >
                  {getFilterLabel(st)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-tertiary)' }}>Loading applications…</div>
        ) : error ? (
          <div style={{ padding: '1rem', background: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid rgba(196, 58, 34, 0.25)', borderRadius: '8px' }}>
            {error}
          </div>
        ) : filteredRuns.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              background: 'var(--color-bg-surface)',
              borderRadius: '10px',
              border: '1px dashed var(--color-border-default)',
            }}
          >
            <FileText size={40} color="var(--color-text-tertiary)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', color: 'var(--color-text-primary)', margin: '0 0 0.5rem' }}>No Applications Found</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your filters.'
                : 'You have not submitted any scheme applications yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredRuns.map((run) => {
              const displayName = SERVICE_NAMES[run.serviceType] || run.serviceType;
              const isSubmitted = run.state === 'SUBMITTED';
              const isFailed = run.state === 'FAILED';

              return (
                <div
                  key={run.id}
                  style={{
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '10px',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'border-color var(--duration-fast)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontFamily: '"Playfair Display", Georgia, serif',
                            fontSize: '1.15rem',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {displayName}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontFamily: '"JetBrains Mono", monospace',
                            color: 'var(--color-text-tertiary)',
                            background: 'var(--color-bg-sunken)',
                            border: '1px solid var(--color-border-subtle)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {run.serviceType}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"JetBrains Mono", monospace' }}>
                        Run ID: {run.id.slice(0, 12)}… · Applied: {new Date(run.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* State Badge */}
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: isSubmitted
                            ? 'var(--color-success-bg)'
                            : isFailed
                            ? 'var(--color-error-bg)'
                            : 'var(--color-warning-bg)',
                          color: isSubmitted
                            ? 'var(--color-success)'
                            : isFailed
                            ? 'var(--color-error)'
                            : 'var(--color-warning)',
                          border: `1px solid ${
                            isSubmitted
                              ? 'rgba(43, 138, 104, 0.25)'
                              : isFailed
                              ? 'rgba(196, 58, 34, 0.25)'
                              : 'rgba(246, 168, 31, 0.25)'
                          }`,
                        }}
                      >
                        {isSubmitted ? (
                          <CheckCircle2 size={13} />
                        ) : isFailed ? (
                          <XCircle size={13} />
                        ) : (
                          <Clock size={13} />
                        )}
                        {formatState(run.state)}
                      </span>

                      {/* Eligibility Pill if completed */}
                      {isSubmitted && run.eligibleResult !== null && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: run.eligibleResult
                              ? 'var(--color-success-bg)'
                              : 'var(--color-warning-bg)',
                            color: run.eligibleResult ? 'var(--color-success)' : 'var(--color-warning)',
                            border: `1px solid ${
                              run.eligibleResult
                                ? 'rgba(43, 138, 104, 0.3)'
                                : 'rgba(246, 168, 31, 0.3)'
                            }`,
                          }}
                        >
                          {run.eligibleResult ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                        </span>
                      )}
                    </div>
                  </div>

                  {isFailed && run.failureReason && (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: 'var(--color-error-bg)',
                        borderLeft: '3px solid var(--color-error)',
                        borderRadius: '0 6px 6px 0',
                        fontSize: '0.8rem',
                        color: 'var(--color-error)',
                      }}
                    >
                      Halt reason: {run.failureReason}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--color-border-subtle)',
                      paddingTop: '12px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Link
                        to={`/apply/${run.id}`}
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--color-text-secondary)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 500,
                        }}
                      >
                        <ShieldCheck size={14} color="var(--color-accent-primary)" /> Review Consents
                      </Link>
                    </div>

                    <button
                      onClick={() => navigate(isSubmitted ? `/result/${run.id}` : `/status/${run.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'transparent',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: '6px',
                        color: 'var(--color-accent-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '6px 12px',
                        cursor: 'pointer',
                        transition: 'all var(--duration-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-accent-primary)';
                        e.currentTarget.style.background = 'var(--color-bg-sunken)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border-default)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {isSubmitted ? 'View Verification Result' : 'View Pipeline Status'}
                      <ArrowRight size={14} />
                    </button>
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
