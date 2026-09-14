import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { api } from '../hooks/useApi';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  Calendar,
  User,
  Award,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';

export function VerifyCertificatePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .verifyPublicCertificate(token)
      .then((res) => {
        setResult(res);
      })
      .catch((err) => {
        setError(err.message || 'Verification failed');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <AppShell>
      <div style={{ maxWidth: '44rem', margin: '0 auto', padding: '48px 24px' }}>
        {/* Back Link */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.85rem',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            marginBottom: 24,
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> Return to Portal Home
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--color-bg-sunken)',
              border: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--color-accent-primary)',
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-text-tertiary)',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Trust &amp; Public Verification Registry
          </span>
          <h1
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '2rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              margin: '6px 0 8px',
            }}
          >
            Cryptographic Credential Verification
          </h1>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.9rem',
              maxWidth: '34rem',
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            Zero-knowledge Ed25519 digital signature validation for OneGov issued eligibility certificates.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div
            style={{
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-lg, 10px)',
              border: '1px solid var(--color-border-subtle)',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.95rem' }}>
              Validating Ed25519 signature against authoritative registry key…
            </p>
          </div>
        )}

        {/* Missing Token State */}
        {!loading && !token && (
          <div
            style={{
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-lg, 10px)',
              border: '1px solid var(--color-border-subtle)',
              padding: '36px 24px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: '0 0 16px' }}>
              No credential verification token provided. Scan an official OneGov QR code or provide a verification URL.
            </p>
            <Link
              to="/services"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: 'var(--color-accent-primary)',
                color: 'var(--color-text-inverse)',
                borderRadius: 'var(--radius-md, 6px)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              Explore Public Schemes
            </Link>
          </div>
        )}

        {/* Error / Invalid State */}
        {!loading && token && (error || !result?.valid) && (
          <div
            style={{
              background: 'var(--color-error-bg)',
              borderRadius: 'var(--radius-lg, 10px)',
              border: '1px solid rgba(196,58,34,0.3)',
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            <XCircle size={40} color="var(--color-error)" style={{ margin: '0 auto 12px' }} />
            <h2
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '1.4rem',
                fontWeight: 600,
                color: 'var(--color-error)',
                margin: '0 0 8px',
              }}
            >
              Verification Failed: Invalid or Revoked Certificate
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                maxWidth: '28rem',
                margin: '0 auto',
                lineHeight: 1.5,
              }}
            >
              {result?.reason
                ? `Reason: ${result.reason}`
                : error ||
                  'The digital signature could not be verified, or the certificate has expired or been revoked by administrative order.'}
            </p>
          </div>
        )}

        {/* Success / Valid Certificate State */}
        {!loading && result?.valid && (
          <div
            style={{
              background: 'var(--color-bg-surface)',
              borderRadius: 'var(--radius-lg, 10px)',
              border: '1px solid var(--color-border-subtle)',
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden',
            }}
          >
            {/* Validity Banner */}
            <div
              style={{
                background: 'var(--color-success-bg)',
                borderBottom: '1px solid rgba(43,138,104,0.25)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <CheckCircle2 size={24} color="var(--color-success)" style={{ flexShrink: 0 }} />
              <div>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'var(--color-success)',
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  Authentic Cryptographic Certificate
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: '0.78rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Verified via authoritative Ed25519 public key. No tampering detected.
                </p>
              </div>
            </div>

            {/* Credential Details Grid */}
            <div style={{ padding: '24px 28px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '20px',
                  marginBottom: 24,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--color-text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      marginBottom: 4,
                    }}
                  >
                    <User size={13} /> Beneficiary / Citizen
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {result.certificate?.citizenName || 'Verified Citizen'}
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-tertiary)',
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    UID: {result.certificate?.onegovId}
                  </p>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--color-text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      marginBottom: 4,
                    }}
                  >
                    <Award size={13} /> Entitlement Scheme
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {result.certificate?.serviceType}
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 4,
                      padding: '2px 8px',
                      background: 'var(--color-success-bg)',
                      color: 'var(--color-success)',
                      borderRadius: 12,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    ELIGIBILITY DEEMED &amp; APPROVED
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--color-text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      marginBottom: 4,
                    }}
                  >
                    <Calendar size={13} /> Issuance Date
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {result.certificate?.issuedAt
                      ? new Date(result.certificate.issuedAt).toLocaleString()
                      : '—'}
                  </p>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--color-text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      marginBottom: 4,
                    }}
                  >
                    <KeyRound size={13} /> Signing Algorithm
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      fontFamily: '"JetBrains Mono", monospace',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {result.certificate?.algorithm || 'Ed25519 (RFC 8032)'}
                  </p>
                </div>
              </div>

              {/* Certificate ID Bar */}
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--color-bg-sunken)',
                  borderRadius: 'var(--radius-md, 6px)',
                  border: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileCheck size={16} color="var(--color-accent-primary)" />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Certificate Fingerprint:
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.72rem',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {result.certificate?.certificateId || '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
