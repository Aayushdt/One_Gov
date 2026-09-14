import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import {
  Download,
  FileArchive,
  CheckCircle2,
  FileJson,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface ExportItem {
  id: string;
  status: string;
  downloadUrl: string | null;
  fileSize: number | null;
  createdAt: string;
  completedAt: string | null;
}

export function DataExportPage() {
  const { onegovId } = useAuthStore();
  const [exports, setExports] = useState<ExportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchExports = async () => {
    setLoading(true);
    try {
      const res = await api.getMyDataExports();
      setExports(res.exports || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data exports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExports();
  }, []);

  const handleRequestExport = async () => {
    setRequesting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.requestDataExport();
      setSuccessMsg('Your personal data portability export is ready for immediate download!');
      await fetchExports();
    } catch (err: any) {
      setError(err.message || 'Failed to generate data export');
    } finally {
      setRequesting(false);
    }
  };

  const handleDownload = async (exportId: string) => {
    try {
      const blob = await api.downloadExport(exportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onegov-citizen-data-${exportId.slice(0, 8)}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: '68rem', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
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
            Data Portability &amp; Right to Access
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
              Citizen Data Portability (DPDP Act)
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
              Compliant &amp; Active
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Download an authenticated dossier of all personal data, consent grants, applications, and cryptographic audit records stored under your Universal ID (<strong>{onegovId}</strong>).
          </p>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--color-error-bg)',
              border: '1px solid rgba(196, 58, 34, 0.3)',
              borderRadius: '8px',
              color: 'var(--color-error)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--color-success-bg)',
              border: '1px solid rgba(43, 138, 104, 0.3)',
              borderRadius: '8px',
              color: 'var(--color-success)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {/* Request Export Card */}
        <div
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '10px',
            padding: '24px 28px',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: 'rgba(229, 71, 45, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent-primary)',
                flexShrink: 0,
              }}
            >
              <FileArchive size={22} />
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <h2
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  margin: '0 0 6px',
                }}
              >
                Generate Fresh Portable Data Package
              </h2>
              <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Bundles your profile attributes, federated departmental identifiers, verified eligibility certificates, and tamper-evident SHA-256 access logs into standardized machine-readable JSON format.
              </p>

              <div
                style={{
                  background: 'var(--color-bg-sunken)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Package Contents:</div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                  <li>Citizen Identity &amp; 8-Department Federated Cross-Reference Map</li>
                  <li>All active, expired, and revoked consent agreements &amp; purposes</li>
                  <li>Complete workflow run state histories &amp; eligibility determinations</li>
                  <li>Cryptographic Ed25519 verifiable credentials &amp; raw audit sequence hashes</li>
                </ul>
              </div>

              <button
                onClick={handleRequestExport}
                disabled={requesting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'var(--color-accent-primary)',
                  color: 'var(--color-text-inverse)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: requesting ? 'not-allowed' : 'pointer',
                  opacity: requesting ? 0.7 : 1,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'opacity var(--duration-base)',
                }}
              >
                <Sparkles size={16} /> {requesting ? 'Generating Bundle…' : 'Compile & Export My Data'}
              </button>
            </div>
          </div>
        </div>

        {/* Existing Exports History */}
        <div>
          <h2
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '1.35rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              margin: '0 0 16px',
            }}
          >
            Export History &amp; Downloads
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)' }}>Loading exports…</div>
          ) : exports.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem',
                background: 'var(--color-bg-surface)',
                border: '1px dashed var(--color-border-default)',
                borderRadius: '8px',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
              }}
            >
              No exports requested yet. Click &quot;Compile &amp; Export My Data&quot; above to generate your first dossier.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {exports.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '8px',
                    padding: '14px 18px',
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
                        width: '34px',
                        height: '34px',
                        borderRadius: '6px',
                        background: 'var(--color-bg-sunken)',
                        border: '1px solid var(--color-border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <FileJson size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        OneGov Citizen Dossier ({exp.fileSize ? `${Math.round(exp.fileSize / 1024)} KB` : 'JSON'})
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"JetBrains Mono", monospace' }}>
                        ID: {exp.id.slice(0, 12)}… · Created: {new Date(exp.createdAt).toLocaleDateString()} {new Date(exp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'var(--color-success-bg)',
                        color: 'var(--color-success)',
                        border: '1px solid rgba(43, 138, 104, 0.25)',
                      }}
                    >
                      {exp.status}
                    </span>

                    <button
                      onClick={() => handleDownload(exp.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        background: 'transparent',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: '6px',
                        color: 'var(--color-accent-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
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
                      <Download size={14} /> Download Package
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
