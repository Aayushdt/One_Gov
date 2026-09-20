import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  ClipboardList, LogOut, Menu, X, Shield, LayoutGrid,
  ShieldCheck, Languages, FileArchive, Server, Scale, ChevronRight,
  User, ChevronDown, Check, Copy, FileDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NotificationBell } from '../NotificationBell';
import { ThemeToggle } from '../ThemeToggle';

/* ─── Shared nav-link style helper ──────────────────────────────────────── */
const navItemBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '5px 9px',
  borderRadius: '6px',
  fontSize: '12.5px',
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'background 150ms, color 150ms',
  whiteSpace: 'nowrap',
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  amber?: boolean;
  onClick?: () => void;
}

function NavItem({ to, icon, label, amber, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      style={({ isActive }) => ({
        ...navItemBase,
        color: isActive
          ? 'var(--panel-text)'
          : amber
          ? 'var(--panel-accent)'
          : 'var(--panel-text-2)',
        background: isActive
          ? amber
            ? 'rgba(250, 143, 44, 0.25)'
            : 'rgba(217, 62, 48, 0.32)'
          : 'transparent',
        border: isActive
          ? amber
            ? '1px solid rgba(250, 143, 44, 0.45)'
            : '1px solid rgba(217, 62, 48, 0.45)'
          : '1px solid transparent',
      })}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        if (!el.getAttribute('aria-current')) {
          el.style.background = amber
            ? 'rgba(250, 143, 44, 0.12)'
            : 'rgba(255, 255, 255, 0.08)';
          el.style.color = amber ? 'var(--panel-accent)' : 'var(--panel-text)';
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        if (!el.getAttribute('aria-current')) {
          el.style.background = 'transparent';
          el.style.color = amber ? 'var(--panel-accent)' : 'var(--panel-text-2)';
        }
      }}
    >
      {icon}
      {label}
    </NavLink>
  );
}

/* ─── Vertical divider ───────────────────────────────────────────────────── */
function VDivider() {
  return (
    <div
      style={{
        width: '1px',
        height: '20px',
        background: 'rgba(255,255,255,0.12)',
        flexShrink: 0,
      }}
    />
  );
}

/* ─── Main Nav ───────────────────────────────────────────────────────────── */
export function Nav() {
  const { name, onegovId, state, role, logout } = useAuthStore();
  const isAdmin = role === 'ADMIN';
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login');
  };

  // Close dropdown on pointerdown outside
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        avatarButtonRef.current &&
        !avatarButtonRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('pointerdown', handlePointerDown);
    }
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [profileOpen]);

  // Close on Escape and return focus to avatar button
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && profileOpen) {
        setProfileOpen(false);
        avatarButtonRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profileOpen]);

  const copyOneGovId = async () => {
    if (!onegovId) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(onegovId);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      const input = document.createElement('input');
      input.value = onegovId;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* Derive initials for avatar */
  const initials = name
    ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'U';

  return (
    <nav
      className="w-full sticky top-0 z-50"
      style={{
        background: 'var(--color-nav-bg)',
        borderBottom: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5 h-[58px] flex items-center justify-between gap-3">

        {/* ── Left: Logo / Wordmark ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 shrink-0">
          <NavLink
            to="/services"
            className="flex items-center gap-2.5 no-underline shrink-0"
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '7px',
                background: 'var(--color-accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(229,71,45,0.45)',
                flexShrink: 0,
              }}
            >
              <Shield size={15} color="white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="font-display font-semibold"
                style={{ fontSize: '15px', color: 'var(--color-nav-text)', letterSpacing: '-0.01em' }}
              >
                OneGov
              </span>
              <span
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(252,250,246,0.38)',
                  marginTop: '1px',
                }}
              >
                Interoperability Middleware
              </span>
            </div>
          </NavLink>
        </div>

        {/* ── Center: Desktop Nav Links ────────────────────────────────────────── */}
        {name && (
          <div className="hidden lg:flex items-center gap-1">
            <NavItem to="/dashboard"         icon={<LayoutGrid size={13} />}    label={t('nav.dashboard')} />
            <NavItem to="/services"          icon={<Shield size={13} />}         label={t('nav.services')} />
            <NavItem to="/consent-dashboard" icon={<ShieldCheck size={13} />}   label={t('nav.myConsents')} />
            <NavItem to="/audit"             icon={<ClipboardList size={13} />}  label={t('nav.auditTrail')} />
            <NavItem to="/data-export"       icon={<FileArchive size={13} />}    label={t('nav.myData')} />
            <NavItem to="/ops"               icon={<Shield size={13} />}         label={t('nav.ops')} />

            {isAdmin && (
              <>
                <VDivider />
                <NavItem to="/admin/onboarding" icon={<Server size={13} />} label={t('nav.registry')} amber />
                <NavItem to="/admin/appeals"    icon={<Scale size={13} />}  label={t('nav.appeals')}  amber />
              </>
            )}
          </div>
        )}

        {/* ── Right Section ───────────────────────────────────────────────────── */}
        {name ? (
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Notification bell */}
            <NotificationBell />

            {/* Quick Language Toggle */}
            <button
              onClick={toggleLanguage}
              title={t('login.languageToggleAria')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '6px',
                color: 'var(--color-nav-text)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            >
              <Languages size={13} color="var(--color-accent-amber)" />
              <span>{i18n.language === 'hi' ? 'हिन्दी' : 'EN'}</span>
            </button>

            {/* Quick Theme Toggle */}
            <ThemeToggle variant="icon-btn" />

            <VDivider />

            {/* ── Profile Avatar & Dropdown (Disclosure Pattern) ──────────── */}
            <div className="relative">
              <button
                ref={avatarButtonRef}
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                aria-controls="profile-dropdown-panel"
                aria-label={t('nav.userMenuAria')}
                className="flex items-center gap-1.5 p-1 rounded-full border border-white/10 hover:border-white/20 transition-all cursor-pointer bg-white/5 hover:bg-white/10"
                style={{ outline: 'none' }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'var(--color-accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--on-primary)',
                    flexShrink: 0,
                    letterSpacing: '0.04em',
                    position: 'relative',
                  }}
                >
                  {initials}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-1px',
                      right: '-1px',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: 'var(--color-success)',
                      border: '1.5px solid var(--color-nav-bg)',
                      boxShadow: '0 0 4px var(--color-success)',
                    }}
                  />
                </div>
                <ChevronDown
                  size={13}
                  color="rgba(252,250,246,0.6)"
                  style={{
                    transform: profileOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 150ms ease',
                    marginRight: '2px',
                  }}
                />
              </button>

              {/* Accessible Dropdown Popover */}
              {profileOpen && (
                <div
                  id="profile-dropdown-panel"
                  ref={dropdownRef}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '280px',
                    maxWidth: 'calc(100vw - 24px)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '8px',
                    zIndex: 100,
                  }}
                >
                  {/* User Identity Header */}
                  <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '13px',
                          color: 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '180px',
                        }}
                      >
                        {name || t('nav.citizenRole')}
                      </div>
                      <span
                        style={{
                          fontSize: '9.5px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isAdmin ? 'var(--warning-tint)' : 'var(--primary-tint)',
                          color: isAdmin ? 'var(--warning)' : 'var(--primary)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          flexShrink: 0,
                        }}
                      >
                        {isAdmin ? t('nav.adminRole') : t('nav.citizenRole')}
                      </span>
                    </div>
                    {state && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {state}
                      </div>
                    )}
                    {/* OneGov ID badge with copy */}
                    <div
                      className="flex items-center justify-between gap-1 mt-2.5"
                      style={{
                        background: 'var(--surface-2)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {onegovId}
                      </span>
                      <button
                        onClick={copyOneGovId}
                        title={copied ? t('nav.copied') : t('nav.copyId')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: copied ? 'var(--success)' : 'var(--text-muted)',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Menu options with Lucide icons */}
                  <div className="flex flex-col py-1">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        color: 'var(--text)',
                        textDecoration: 'none',
                        transition: 'background 120ms, color 120ms',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <User size={14} color="var(--primary)" />
                      <span>{t('nav.profile')}</span>
                    </Link>

                    <button
                      onClick={() => {
                        toggleLanguage();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        color: 'var(--text)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 120ms',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span className="flex items-center gap-2">
                        <Languages size={14} color="var(--accent)" />
                        <span>{t('nav.language')}</span>
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {i18n.language === 'hi' ? 'हिन्दी' : 'EN'}
                      </span>
                    </button>

                    {/* 3-State Theme Selector in popover */}
                    <ThemeToggle variant="row" />

                    <Link
                      to="/data-export"
                      onClick={() => setProfileOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        color: 'var(--text)',
                        textDecoration: 'none',
                        transition: 'background 120ms',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <FileDown size={14} color="var(--text-muted)" />
                      <span>{t('nav.downloadDossier')}</span>
                    </Link>

                    <Link
                      to="/consent-dashboard"
                      onClick={() => setProfileOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        color: 'var(--text)',
                        textDecoration: 'none',
                        transition: 'background 120ms',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <ShieldCheck size={14} color="var(--text-muted)" />
                      <span>{t('nav.privacyConsents')}</span>
                    </Link>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

                  {/* Sign Out Action */}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--danger)',
                      background: 'var(--danger-tint)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 120ms',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    <LogOut size={14} />
                    <span>{t('nav.signOut')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger toggle */}
            <button
              className="lg:hidden bg-transparent border-0 cursor-pointer p-1.5 ml-1 rounded"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                color: 'var(--color-nav-text)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '6px',
              }}
              aria-label="Toggle navigation drawer"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        ) : null}
      </div>

      {/* ── Mobile / Tablet Drawer ─────────────────────────────────────────── */}
      {mobileOpen && name && (
        <div
          className="lg:hidden"
          style={{
            background: 'var(--color-nav-bg)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-col gap-2">
            {/* User Profile Card */}
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-lg no-underline"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'var(--color-accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: 'var(--on-primary)', flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div className="overflow-hidden">
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-nav-text)' }}>
                  {name}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(252,250,246,0.45)' }}>
                  {onegovId}
                </div>
              </div>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'rgba(252,250,246,0.3)' }} />
            </Link>

            {/* Translated Navigation Links */}
            {[
              { to: '/dashboard',         label: t('nav.dashboard'),       icon: <LayoutGrid size={14} /> },
              { to: '/services',          label: t('nav.services'),        icon: <Shield size={14} /> },
              { to: '/consent-dashboard', label: t('nav.myConsents'),      icon: <ShieldCheck size={14} /> },
              { to: '/audit',             label: t('nav.auditTrail'),      icon: <ClipboardList size={14} /> },
              { to: '/data-export',       label: t('nav.myData'),          icon: <FileArchive size={14} /> },
              { to: '/ops',               label: t('nav.ops'),             icon: <Shield size={14} /> },
            ].map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', borderRadius: '6px', textDecoration: 'none',
                  fontSize: '13px', fontWeight: 500,
                  color: isActive ? 'var(--panel-text)' : 'var(--panel-text-2)',
                  background: isActive ? 'rgba(217, 62, 48, 0.28)' : 'transparent',
                  border: isActive ? '1px solid rgba(217, 62, 48, 0.40)' : '1px solid transparent',
                })}
              >
                {icon}{label}
              </NavLink>
            ))}

            {isAdmin && (
              <>
                <div style={{ height: '1px', background: 'rgba(246,168,31,0.2)', margin: '2px 0' }} />
                {[
                  { to: '/admin/onboarding', label: t('nav.registry'), icon: <Server size={14} /> },
                  { to: '/admin/appeals',    label: t('nav.appeals'),  icon: <Scale size={14} /> },
                ].map(({ to, label, icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    style={() => ({
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 10px', borderRadius: '6px', textDecoration: 'none',
                      fontSize: '13px', fontWeight: 600,
                      color: 'var(--color-accent-amber)',
                    })}
                  >
                    {icon}{label}
                  </NavLink>
                ))}
              </>
            )}

            {/* Bottom Actions Row */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '2px 0' }} />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLanguage}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '7px 12px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)', borderRadius: '6px',
                    color: 'var(--color-nav-text)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Languages size={13} color="var(--color-accent-amber)" />
                  <span>{i18n.language === 'hi' ? 'हिन्दी' : 'EN'}</span>
                </button>
                <ThemeToggle variant="icon-btn" />
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 12px', background: 'var(--danger-tint)',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  color: 'var(--danger)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <LogOut size={13} />
                <span>{t('nav.signOut')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
