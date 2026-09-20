import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/layout/Nav';
import { useAuthStore } from '../store/authStore';
import { api } from '../hooks/useApi';
import { useTranslation } from 'react-i18next';
import {
  User, Shield, ShieldCheck, FileArchive, Check, Copy,
  AlertTriangle, RefreshCw, Lock, Award, ArrowLeft,
} from 'lucide-react';

/* ─── Safe Base64url JWT Decoder ─────────────────────────────────────────── */
function parseJwt(token: string | null) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const decodePart = (str: string) => {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
      return JSON.parse(decodeURIComponent(escape(atob(padded))));
    };

    const header = decodePart(parts[0]);
    const payload = decodePart(parts[1]);
    return { header, payload };
  } catch {
    return null;
  }
}

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { name: storeName, onegovId: storeId, role: storeRole } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [consentsData, setConsentsData] = useState<any[] | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setProfileError(null);
    setConsentError(false);

    try {
      const me = await api.getMe();
      setProfileData(me);
    } catch (err: any) {
      setProfileError(err?.message || t('profile.errorLoadingProfile'));
      setLoading(false);
      return;
    }

    try {
      const consentsRes = await api.getAllConsents();
      setConsentsData(consentsRes?.artefacts || []);
    } catch {
      setConsentError(true);
      setConsentsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const copyId = async () => {
    const idToCopy = profileData?.onegovId || storeId;
    if (!idToCopy) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(idToCopy);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      const input = document.createElement('input');
      input.value = idToCopy;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // JWT inspection
  const rawToken = localStorage.getItem('govlink_token');
  const jwt = parseJwt(rawToken);
  const tokenAlg = jwt?.header?.alg || 'EdDSA (Ed25519)';
  const tokenExp = jwt?.payload?.exp ? jwt.payload.exp * 1000 : null;
  const isExpired = tokenExp ? tokenExp < Date.now() : false;
  const formattedExpiry = tokenExp
    ? new Date(tokenExp).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

  // Formatters
  const formatGender = (gender: string | null | undefined) => {
    if (!gender) return '—';
    const norm = gender.trim().toUpperCase();
    if (norm === 'MALE' || norm === 'M') return t('profile.genderMale');
    if (norm === 'FEMALE' || norm === 'F') return t('profile.genderFemale');
    if (norm === 'OTHER' || norm === 'O') return t('profile.genderOther');
    return gender;
  };

  const formatDob = (dobStr: string | null | undefined) => {
    if (!dobStr) return '—';
    try {
      const date = new Date(dobStr);
      if (isNaN(date.getTime())) return dobStr;
      return new Intl.DateTimeFormat(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      return dobStr;
    }
  };

  const formatPhone = (phone: string | null | undefined) => {
    if (!phone) return '—';
    // Mask middle digits if unmasked
    if (phone.length >= 10 && !phone.includes('X')) {
      const clean = phone.trim();
      return `${clean.slice(0, 5)}XXXX${clean.slice(-3)}`;
    }
    return phone;
  };

  const activeConsentsCount = consentsData ? consentsData.filter((c) => c.status === 'GRANTED').length : 0;
  const revokedConsentsCount = consentsData ? consentsData.filter((c) => c.status === 'REVOKED').length : 0;

  const currentRole = profileData?.role || storeRole || 'CITIZEN';
  const isAdmin = currentRole === 'ADMIN';

  const initials = (profileData?.name || storeName || 'U')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}>
      <Nav />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* Back Link */}
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-text-secondary)',
            fontSize: '13px',
            textDecoration: 'none',
            marginBottom: '20px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
        >
          <ArrowLeft size={14} />
          <span>{t('profile.backToDashboard')}</span>
        </Link>

        {/* Loading State */}
        {loading && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid rgba(229,71,45,0.2)',
                borderTopColor: 'var(--color-accent-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              {t('profile.loadingProfile')}
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && profileError && (
          <div
            style={{
              padding: '24px',
              background: 'var(--color-error-bg)',
              border: '1px solid rgba(196,58,34,0.3)',
              borderRadius: '10px',
              textAlign: 'center',
            }}
          >
            <AlertTriangle size={32} color="var(--color-error)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 8px', color: 'var(--color-error)' }}>{t('profile.errorLoadingProfile')}</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{profileError}</p>
            <button
              onClick={fetchProfile}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--color-accent-primary)',
                color: 'var(--on-primary)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} />
              {t('profile.retryButton')}
            </button>
          </div>
        )}

        {/* Loaded Profile Content */}
        {!loading && !profileError && profileData && (
          <div className="flex flex-col gap-6">

            {/* ── Header Banner Card ─────────────────────────────────────── */}
            <div
              style={{
                background: 'var(--color-nav-bg)',
                color: 'var(--color-nav-text)',
                borderRadius: '12px',
                padding: '28px 24px',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
              }}
            >
              <div className="flex items-center gap-4">
                {/* Avatar Badge */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--color-accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: 'var(--on-primary)',
                    boxShadow: 'var(--shadow)',
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 600, color: 'var(--panel-text)' }}>
                      {profileData.name}
                    </h1>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: isAdmin ? 'var(--warning-tint)' : 'var(--success-tint)',
                        color: isAdmin ? 'var(--color-accent-amber)' : 'var(--color-success)',
                        border: `1px solid ${isAdmin ? 'var(--warning)' : 'var(--success)'}`,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      {isAdmin ? t('profile.adminBadge') : t('profile.citizenBadge')}
                    </span>
                  </div>

                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--panel-text-2)' }}>
                    {profileData.district ? `${profileData.district}, ` : ''}{profileData.state || '—'}
                  </p>
                </div>
              </div>

              {/* OneGov ID Badge with Copy */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--panel-text-2)', letterSpacing: '0.08em' }}>
                    {t('profile.onegovId')}
                  </div>
                  <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: 'var(--panel-text)' }}>
                    {profileData.onegovId}
                  </div>
                </div>

                <button
                  onClick={copyId}
                  title={copied ? t('nav.copied') : t('nav.copyId')}
                  style={{
                    background: copied ? 'var(--success-tint)' : 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: copied ? 'var(--color-success)' : 'var(--panel-text)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 500,
                    transition: 'all 150ms',
                  }}
                >
                  {copied ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
                  <span>{copied ? t('nav.copied') : t('nav.copyId')}</span>
                </button>
              </div>
            </div>

            {/* ── 2-Column Grid of Detail Cards ──────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Card 1: Identity & Demographics */}
              <div
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '10px',
                  padding: '22px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <User size={17} color="var(--color-accent-primary)" />
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                    {t('profile.demographicsTitle')}
                  </h2>
                </div>
                <p style={{ margin: '0 0 18px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {t('profile.demographicsSubtitle')}
                </p>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5 text-[13px]">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('profile.fullName')}</span>
                    <span style={{ fontWeight: 600 }}>{profileData.name || '—'}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5 text-[13px]">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('profile.dob')}</span>
                    <span style={{ fontWeight: 500 }}>{formatDob(profileData.dateOfBirth)}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5 text-[13px]">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('profile.gender')}</span>
                    <span style={{ fontWeight: 500 }}>{formatGender(profileData.gender)}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5 text-[13px]">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('profile.email')}</span>
                    <span style={{ fontWeight: 500 }}>{profileData.email || '—'}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5 text-[13px]">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('profile.phone')}</span>
                    <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{formatPhone(profileData.phone)}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5 text-[13px]">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('profile.district')}</span>
                    <span style={{ fontWeight: 500 }}>{profileData.district || '—'}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5 text-[13px]">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('profile.state')}</span>
                    <span style={{ fontWeight: 500 }}>{profileData.state || '—'}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5 text-[13px]">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('profile.pincode')}</span>
                    <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{profileData.pincode || '—'}</span>
                  </div>

                  <div className="pt-1 text-[12.5px]">
                    <div style={{ color: 'var(--color-text-secondary)', marginBottom: '3px' }}>{t('profile.address')}</div>
                    <div style={{ fontWeight: 500, lineHeight: 1.4 }}>{profileData.primaryAddress || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Card 2: Federated Registries */}
              <div
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '10px',
                  padding: '22px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={17} color="var(--color-accent-primary)" />
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                    {t('profile.registryTitle')}
                  </h2>
                </div>
                <p style={{ margin: '0 0 18px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {t('profile.registrySubtitle')}
                </p>

                {profileData.identityMap ? (
                  <div className="flex flex-col gap-3.5">
                    {/* UIDAI Aadhaar */}
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '7px',
                        background: 'var(--color-bg-base)',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{t('profile.aadhaarRef')}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--color-success)', fontWeight: 600 }}>
                          ✓ {t('profile.statusLinked')}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        {profileData.identityMap.identityDeptId || '—'}
                      </div>
                    </div>

                    {/* Income Tax PAN */}
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '7px',
                        background: 'var(--color-bg-base)',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{t('profile.panRef')}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--color-success)', fontWeight: 600 }}>
                          ✓ {t('profile.statusLinked')}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        {profileData.identityMap.revenueDeptId || '—'}
                      </div>
                    </div>

                    {/* Academic Bank of Credits APAAR */}
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '7px',
                        background: 'var(--color-bg-base)',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{t('profile.academicRef')}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--color-success)', fontWeight: 600 }}>
                          ✓ {t('profile.statusLinked')}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        {profileData.identityMap.educationDeptId || '—'}
                      </div>
                    </div>

                    {/* Transport DL */}
                    {profileData.identityMap.transportDeptId && (
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '7px',
                          background: 'var(--color-bg-base)',
                          border: '1px solid var(--color-border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{t('profile.transportRef')}</span>
                          <span style={{ fontSize: '10.5px', color: 'var(--color-success)', fontWeight: 600 }}>
                            ✓ {t('profile.statusLinked')}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          {profileData.identityMap.transportDeptId}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '24px',
                      background: 'var(--color-bg-base)',
                      borderRadius: '7px',
                      textAlign: 'center',
                      color: 'var(--color-text-secondary)',
                      fontSize: '13px',
                    }}
                  >
                    {t('profile.noRegistries')}
                  </div>
                )}
              </div>

              {/* Card 3: Consent & Privacy Governance */}
              <div
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '10px',
                  padding: '22px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={17} color="var(--color-accent-primary)" />
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                    {t('profile.consentTitle')}
                  </h2>
                </div>
                <p style={{ margin: '0 0 18px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {t('profile.consentSubtitle')}
                </p>

                {consentError && (
                  <div
                    style={{
                      padding: '10px 12px',
                      background: 'var(--color-warning-bg)',
                      border: '1px solid rgba(246,168,31,0.3)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '14px',
                    }}
                  >
                    ⚠ {t('profile.consentLoadWarning')}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div
                    style={{
                      background: 'var(--color-bg-base)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: '7px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                      {t('profile.activeConsents')}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '2px' }}>
                      {activeConsentsCount}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--color-bg-base)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: '7px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                      {t('profile.revokedConsents')}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {revokedConsentsCount}
                    </div>
                  </div>
                </div>

                <Link
                  to="/consent-dashboard"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: 'var(--color-accent-primary)',
                    color: 'var(--on-primary)',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'opacity 150ms',
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>{t('profile.manageConsents')}</span>
                </Link>
              </div>

              {/* Card 4: Security & Session Status */}
              <div
                style={{
                  background: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '10px',
                  padding: '22px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={17} color="var(--color-accent-primary)" />
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                    {t('profile.securityTitle')}
                  </h2>
                </div>
                <p style={{ margin: '0 0 18px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {t('profile.securitySubtitle')}
                </p>

                <div className="flex flex-col gap-3 mb-5">
                  <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5 text-[13px]">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('profile.authMode')}</span>
                    <span style={{ fontWeight: 600 }}>{t('profile.authModeVal')}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5 text-[13px]">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('profile.algorithm')}</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{tokenAlg}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5 text-[13px]">
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {isExpired ? t('profile.sessionExpired') : t('profile.sessionActive')}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: isExpired ? 'var(--color-error)' : 'var(--color-success)',
                      }}
                    >
                      {isExpired ? '● EXPIRED' : '● ACTIVE'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-black/5 dark:border-white/5 text-[13px]">
                    <span style={{ color: 'var(--color-text-secondary)' }}>{t('profile.sessionExpires')}</span>
                    <span style={{ fontWeight: 500, fontSize: '12.5px' }}>{formattedExpiry}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/data-export"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      background: 'transparent',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      textDecoration: 'none',
                    }}
                  >
                    <FileArchive size={13} />
                    <span>{t('profile.exportDossier')}</span>
                  </Link>

                  <Link
                    to="/my-history"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      background: 'transparent',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      textDecoration: 'none',
                    }}
                  >
                    <Award size={13} />
                    <span>{t('profile.viewAudit')}</span>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
