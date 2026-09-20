import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../hooks/useApi';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  Download,
  Copy,
  Check,
  ArrowLeft,
  Lock,
} from 'lucide-react';

interface CertificateData {
  certificate: {
    id: string;
    runId: string;
    algorithm: string;
    signature: string;
    issuedAt: string;
    expiresAt: string;
    payload: {
      citizenName: string;
      onegovId: string;
      serviceType: string;
      eligibleResult: boolean;
      issuedAt: string;
      expiresAt: string;
    };
  };
  token: string;
}

export function CertificatePage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CertificateData | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!runId) return;

    api
      .getCertificate(runId)
      .then(async (res) => {
        setData(res);
        const verifyUrl = `${window.location.origin}/verify/certificate?token=${encodeURIComponent(
          res.token
        )}`;
        const qr = await QRCode.toDataURL(verifyUrl, {
          margin: 1,
          width: 200,
          color: { dark: '#261F1D', light: '#FDFBF6' },
        });
        setQrUrl(qr);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load certificate');
      })
      .finally(() => setLoading(false));
  }, [runId]);

  const handleCopyToken = () => {
    if (!data?.token) return;
    navigator.clipboard.writeText(data.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onegov-certificate-${runId?.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-secondary)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-tertiary)' }}>
            Loading cryptographic certificate…
          </div>
        ) : error ? (
          <div
            style={{
              padding: '2rem',
              background: 'var(--color-error-bg)',
              border: '1px solid rgba(196, 58, 34, 0.3)',
              borderRadius: '10px',
              color: 'var(--color-error)',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', margin: '0 0 0.5rem' }}>Certificate Not Available</h3>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
          </div>
        ) : data ? (
          <div>
            {/* Certificate Frame */}
            <div
              id="printable-cert"
              style={{
                background: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                borderRadius: '12px',
                padding: '2.5rem',
                border: '4px double var(--color-border-default)',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
              }}
            >
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'inline-flex', padding: '0.5rem', background: 'rgba(229, 71, 45, 0.1)', borderRadius: '50%', marginBottom: '0.5rem' }}>
                  <ShieldCheck size={36} color="var(--color-accent-primary)" />
                </div>
                <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.65rem', fontWeight: 600, letterSpacing: '0.02em', margin: 0, color: 'var(--color-text-primary)' }}>
                  Digital Eligibility Certificate
                </h2>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  GovLink National Interoperability Framework · Republic of India
                </span>
              </div>

              {/* Body details */}
              <div style={{ padding: '2rem 0', display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    This cryptographically verifiable document certifies that:
                  </p>
                  <h3 style={{ margin: '0.4rem 0', fontSize: '1.5rem', fontWeight: 700, fontFamily: '"Playfair Display", Georgia, serif', color: 'var(--color-text-primary)' }}>
                    {data.certificate.payload.citizenName}
                  </h3>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontFamily: '"JetBrains Mono", monospace', color: 'var(--color-text-secondary)' }}>
                    Universal ID: <strong>{data.certificate.payload.onegovId}</strong>
                  </p>

                  <div style={{ background: 'var(--color-bg-sunken)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border-subtle)', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                      Scheme Qualification
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '0.2rem', fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {data.certificate.payload.serviceType}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Check size={16} /> Deemed Fully Eligible Under Verified Department Criteria
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    <div>
                      <span style={{ color: 'var(--color-text-tertiary)' }}>Issued On:</span>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {new Date(data.certificate.issuedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-tertiary)' }}>Valid Until:</span>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {new Date(data.certificate.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code Container */}
                <div style={{ textAlign: 'center' }}>
                  {qrUrl && (
                    <div style={{ padding: '8px', background: 'var(--color-bg-base)', borderRadius: '8px', border: '1px solid var(--color-border-default)' }}>
                      <img
                        src={qrUrl}
                        alt="Certificate Verification QR"
                        style={{ width: '180px', height: '180px', display: 'block', borderRadius: '4px' }}
                      />
                    </div>
                  )}
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem', fontWeight: 500 }}>
                    Scan to Verify Online
                  </span>
                </div>
              </div>

              {/* Cryptographic Signature Stamp */}
              <div
                style={{
                  borderTop: '1px solid var(--color-border-subtle)',
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-tertiary)',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Lock size={14} color="var(--color-success)" />
                  <span>
                    Signed via <strong>{data.certificate.algorithm}</strong> with National Root Key
                  </span>
                </div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem' }}>
                  Cert ID: {data.certificate.id.slice(0, 16)}…
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={handleCopyToken}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1rem',
                  background: 'var(--color-bg-surface)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all var(--duration-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-default)')}
              >
                {copied ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                {copied ? 'Copied Token!' : 'Copy Verification Token'}
              </button>

              <button
                onClick={handleDownloadJson}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  background: 'var(--color-accent-primary)',
                  color: 'var(--color-text-inverse)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'opacity var(--duration-base)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <Download size={16} /> Download JSON Certificate
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
