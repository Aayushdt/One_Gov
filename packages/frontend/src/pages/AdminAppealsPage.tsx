import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import {
  Scale,
  Flag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export function AdminAppealsPage() {
  const { role, email, name } = useAuthStore();
  const isAdmin = role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'APPEALS' | 'GRIEVANCES'>('APPEALS');

  // Appeals state
  const [appeals, setAppeals] = useState<any[]>([]);
  const [appealFilter, setAppealFilter] = useState<string>('ALL');
  const [loadingAppeals, setLoadingAppeals] = useState(false);

  // Grievances state
  const [grievances, setGrievances] = useState<any[]>([]);
  const [grievanceFilter, setGrievanceFilter] = useState<string>('ALL');
  const [loadingGrievances, setLoadingGrievances] = useState(false);

  // Resolution modal / prompt state
  const [adminNote, setAdminNote] = useState<string>('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAppeals = async () => {
    setLoadingAppeals(true);
    try {
      const res = await api.getAppeals(appealFilter === 'ALL' ? undefined : appealFilter);
      setAppeals(res.appeals || []);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load appeals' });
    } finally {
      setLoadingAppeals(false);
    }
  };

  const loadGrievances = async () => {
    setLoadingGrievances(true);
    try {
      const res = await api.getGrievances(grievanceFilter === 'ALL' ? undefined : grievanceFilter);
      setGrievances(res.grievances || []);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load grievances' });
    } finally {
      setLoadingGrievances(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'APPEALS') {
        loadAppeals();
      } else {
        loadGrievances();
      }
    }
  }, [isAdmin, activeTab, appealFilter, grievanceFilter]);

  const handleUpdateAppeal = async (id: string, status: string) => {
    setActionInProgress(id);
    setMsg(null);
    try {
      const note = adminNote.trim() || `Determination updated to ${status} by administrator`;
      await api.updateAppealStatus(id, status, note);
      setMsg({ type: 'success', text: `Appeal #${id.slice(0, 8)} marked as ${status}.` });
      setAdminNote('');
      await loadAppeals();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update appeal' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRerun = async (id: string) => {
    setActionInProgress(id);
    setMsg(null);
    try {
      const res = await api.rerunAppeal(id);
      setMsg({
        type: 'success',
        text: `Application rerun triggered successfully! New Run ID: ${res.newRunId?.slice(0, 8)}…`,
      });
      await loadAppeals();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to trigger rerun' });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResolveGrievance = async (id: string, status: string) => {
    setActionInProgress(id);
    setMsg(null);
    try {
      const note = adminNote.trim() || `Grievance evaluated and marked ${status} by administrative audit officer`;
      await api.resolveGrievance(id, status, note);
      setMsg({ type: 'success', text: `Audit grievance #${id.slice(0, 8)} marked as ${status}.` });
      setAdminNote('');
      await loadGrievances();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to resolve grievance' });
    } finally {
      setActionInProgress(null);
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
            Appeals moderation and grievance adjudication require the <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>ADMIN</span> role.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-accent-primary)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              <Scale size={14} /> Administrative Justice &amp; Oversight
            </div>
            <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
              Appeals &amp; Grievance Review Queue
            </h1>
            <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
              Adjudicate citizen reconsideration requests, trigger workflow re-runs, and moderate immutable audit grievances.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={activeTab === 'APPEALS' ? loadAppeals : loadGrievances}
            disabled={loadingAppeals || loadingGrievances}
          >
            <RefreshCw size={15} className={loadingAppeals || loadingGrievances ? 'animate-spin' : ''} /> Refresh Queue
          </Button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--color-border-subtle)', marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab('APPEALS')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              fontFamily: '"Inter", sans-serif',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'APPEALS' ? 700 : 500,
              color: activeTab === 'APPEALS' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'APPEALS' ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            <Scale size={16} /> Citizen Ineligibility Appeals ({appeals.length})
          </button>
          <button
            onClick={() => setActiveTab('GRIEVANCES')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              fontFamily: '"Inter", sans-serif',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'GRIEVANCES' ? 700 : 500,
              color: activeTab === 'GRIEVANCES' ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'GRIEVANCES' ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            <Flag size={16} /> Audit Trail Grievance Flags ({grievances.length})
          </button>
        </div>

        {/* Alert Feedback */}
        {msg && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 'var(--radius-md, 6px)',
              background: msg.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
              border: `1px solid ${msg.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
              color: msg.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            {msg.text}
          </div>
        )}

        {/* Admin Determination Note Input */}
        <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg, 10px)', padding: '16px 20px', marginBottom: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', marginBottom: 6 }}>
            <MessageSquare size={13} /> Administrative Finding / Officer Note (Attached to Action)
          </label>
          <input
            type="text"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="e.g., 'Rectified tax challan verified with RTO CBDT nodal desk; upholding reconsideration.'"
            style={{
              width: '100%',
              padding: '9px 14px',
              background: 'var(--color-bg-base)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md, 6px)',
              fontSize: '0.875rem',
              color: 'var(--color-text-primary)',
              fontFamily: '"Inter", sans-serif',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Tab 1: Appeals Queue */}
        {activeTab === 'APPEALS' && (
          <div>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'UPHELD', 'DISMISSED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setAppealFilter(f)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: '1px solid',
                    borderColor: appealFilter === f ? 'var(--color-accent-primary)' : 'var(--color-border-default)',
                    background: appealFilter === f ? 'var(--color-accent-primary)' : 'var(--color-bg-surface)',
                    color: appealFilter === f ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {loadingAppeals ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)' }}>
                Loading appeals queue…
              </div>
            ) : appeals.length === 0 ? (
              <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg, 10px)', padding: '40px 24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                  No appeals currently match the selected filter.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {appeals.map((appeal) => (
                  <div
                    key={appeal.id}
                    style={{
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-lg, 10px)',
                      padding: '20px 24px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                            Appeal ID: {appeal.id.slice(0, 8)}…
                          </span>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: 'var(--color-bg-sunken)', color: 'var(--color-accent-primary)', fontWeight: 700 }}>
                            Category: {appeal.disputedCategory}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 10px',
                              borderRadius: 12,
                              background:
                                appeal.status === 'UPHELD'
                                  ? 'var(--color-success-bg)'
                                  : appeal.status === 'DISMISSED'
                                  ? 'var(--color-error-bg)'
                                  : 'var(--color-bg-sunken)',
                              color:
                                appeal.status === 'UPHELD'
                                  ? 'var(--color-success)'
                                  : appeal.status === 'DISMISSED'
                                  ? 'var(--color-error)'
                                  : 'var(--color-text-secondary)',
                            }}
                          >
                            {appeal.status}
                          </span>
                        </div>
                        <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '8px 0 4px' }}>
                          Applicant: {appeal.citizen?.name || 'Citizen'} ({appeal.citizen?.onegovId || appeal.citizenId})
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-tertiary)', fontFamily: '"JetBrains Mono", monospace' }}>
                          Target Run ID: {appeal.workflowRunId} · Filed: {new Date(appeal.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Action Controls */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {appeal.status !== 'UNDER_REVIEW' && appeal.status !== 'UPHELD' && appeal.status !== 'DISMISSED' && (
                          <button
                            onClick={() => handleUpdateAppeal(appeal.id, 'UNDER_REVIEW')}
                            disabled={actionInProgress === appeal.id}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-md, 6px)',
                              background: 'var(--color-bg-sunken)',
                              border: '1px solid var(--color-border-default)',
                              color: 'var(--color-text-secondary)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Mark Under Review
                          </button>
                        )}
                        {appeal.status !== 'UPHELD' && (
                          <button
                            onClick={() => handleUpdateAppeal(appeal.id, 'UPHELD')}
                            disabled={actionInProgress === appeal.id}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 'var(--radius-md, 6px)',
                              background: 'var(--color-success)',
                              border: 'none',
                              color: 'var(--color-text-inverse)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <CheckCircle2 size={14} /> Uphold Appeal
                          </button>
                        )}
                        {appeal.status !== 'DISMISSED' && (
                          <button
                            onClick={() => handleUpdateAppeal(appeal.id, 'DISMISSED')}
                            disabled={actionInProgress === appeal.id}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 'var(--radius-md, 6px)',
                              background: 'var(--color-error)',
                              border: 'none',
                              color: 'var(--color-text-inverse)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <XCircle size={14} /> Dismiss
                          </button>
                        )}
                        {appeal.status === 'UPHELD' && (
                          <button
                            onClick={() => handleRerun(appeal.id)}
                            disabled={actionInProgress === appeal.id}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 'var(--radius-md, 6px)',
                              background: 'var(--color-accent-primary)',
                              border: 'none',
                              color: 'var(--color-text-inverse)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <RotateCcw size={14} /> Trigger Workflow Re-run
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reason statement */}
                    <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md, 6px)', padding: '12px 16px', margin: '12px 0' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>
                        Citizen Grounds for Reconsideration:
                      </p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        "{appeal.reason}"
                      </p>
                      {appeal.evidenceUrl && (
                        <div style={{ marginTop: 8 }}>
                          <a
                            href={appeal.evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.78rem',
                              color: 'var(--color-accent-primary)',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            <ExternalLink size={12} /> Inspect Supporting Documentation: {appeal.evidenceUrl}
                          </a>
                        </div>
                      )}
                    </div>

                    {appeal.adminNote && (
                      <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                        Officer Finding: "{appeal.adminNote}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Grievances Queue */}
        {activeTab === 'GRIEVANCES' && (
          <div>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {['ALL', 'OPEN', 'RESOLVED', 'DISMISSED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setGrievanceFilter(f)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: '1px solid',
                    borderColor: grievanceFilter === f ? 'var(--color-accent-primary)' : 'var(--color-border-default)',
                    background: grievanceFilter === f ? 'var(--color-accent-primary)' : 'var(--color-bg-surface)',
                    color: grievanceFilter === f ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {loadingGrievances ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)' }}>
                Loading grievance queue…
              </div>
            ) : grievances.length === 0 ? (
              <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg, 10px)', padding: '40px 24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                  No audit trail grievances currently match the selected filter.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {grievances.map((g) => (
                  <div
                    key={g.id}
                    style={{
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-lg, 10px)',
                      padding: '20px 24px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                            Grievance #{g.id.slice(0, 8)}…
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 10px',
                              borderRadius: 12,
                              background:
                                g.status === 'RESOLVED'
                                  ? 'var(--color-success-bg)'
                                  : g.status === 'DISMISSED'
                                  ? 'var(--color-error-bg)'
                                  : 'var(--color-bg-sunken)',
                              color:
                                g.status === 'RESOLVED'
                                  ? 'var(--color-success)'
                                  : g.status === 'DISMISSED'
                                  ? 'var(--color-error)'
                                  : 'var(--color-text-secondary)',
                            }}
                          >
                            {g.status}
                          </span>
                        </div>
                        <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '8px 0 4px' }}>
                          Citizen: {g.citizen?.name || 'Citizen'} ({g.citizen?.onegovId || g.citizenId})
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-tertiary)', fontFamily: '"JetBrains Mono", monospace' }}>
                          Flagged Audit Log ID: {g.auditEntryId} · Filed: {new Date(g.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {g.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolveGrievance(g.id, 'RESOLVED')}
                            disabled={actionInProgress === g.id}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 'var(--radius-md, 6px)',
                              background: 'var(--color-success)',
                              border: 'none',
                              color: 'var(--color-text-inverse)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <CheckCircle2 size={14} /> Resolve Grievance
                          </button>
                        )}
                        {g.status !== 'DISMISSED' && (
                          <button
                            onClick={() => handleResolveGrievance(g.id, 'DISMISSED')}
                            disabled={actionInProgress === g.id}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 'var(--radius-md, 6px)',
                              background: 'var(--color-error)',
                              border: 'none',
                              color: 'var(--color-text-inverse)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <XCircle size={14} /> Dismiss Flag
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md, 6px)', padding: '12px 16px', margin: '12px 0' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>
                        Dispute Detail:
                      </p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        "{g.reason}"
                      </p>
                    </div>

                    {g.adminNote && (
                      <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                        Resolution finding: "{g.adminNote}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
