import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  ClipboardList, LogOut, Menu, X, Shield, LayoutGrid,
  ShieldCheck, Languages, FileArchive, Server, Scale, ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NotificationBell } from '../NotificationBell';

/* ─── Shared nav-link style helper ──────────────────────────────────────── */
const navItemBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '5px 10px',
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
          ? '#FCFAF6'
          : amber
          ? 'rgba(246,168,31,0.85)'
          : 'rgba(252,250,246,0.55)',
        background: isActive
          ? amber
            ? 'rgba(246,168,31,0.18)'
            : 'rgba(229,71,45,0.22)'
          : 'transparent',
      })}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        if (!el.getAttribute('aria-current')) {
          el.style.background = amber
            ? 'rgba(246,168,31,0.10)'
            : 'rgba(252,250,246,0.07)';
          el.style.color = amber ? 'rgba(246,168,31,1)' : '#FCFAF6';
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        if (!el.getAttribute('aria-current')) {
          el.style.background = 'transparent';
          el.style.color = amber ? 'rgba(246,168,31,0.85)' : 'rgba(252,250,246,0.55)';
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
  const { i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('govlink_lang', nextLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* Derive initials for avatar */
  const initials = name
    ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '';

  return (
    <nav
      className="w-full sticky top-0 z-50"
      style={{
        background: 'var(--color-nav-bg)',
        borderBottom: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-5 h-[58px] flex items-center gap-4">

        {/* ── Logo / Wordmark ─────────────────────────────────────────────── */}
        <NavLink
          to="/services"
          className="flex items-center gap-2.5 no-underline shrink-0"
          style={{ marginRight: '4px' }}
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

        {/* ── Desktop Nav Links ────────────────────────────────────────────── */}
        {name && (
          <>
            <VDivider />

            {/* Citizen links */}
            <div className="hidden md:flex items-center gap-0.5">
              <NavItem to="/dashboard"       icon={<LayoutGrid size={13} />}    label="Dashboard" />
              <NavItem to="/services"        icon={<Shield size={13} />}         label="Services" />
              <NavItem to="/consent-dashboard" icon={<ShieldCheck size={13} />} label="My Consents" />
              <NavItem to="/audit"           icon={<ClipboardList size={13} />}  label="Audit Trail" />
              <NavItem to="/data-export"     icon={<FileArchive size={13} />}    label="My Data" />
              <NavItem to="/ops"             icon={<Shield size={13} />}         label="Ops" />
            </div>

            {/* Admin links */}
            {isAdmin && (
              <>
                <VDivider />
                <div className="hidden md:flex items-center gap-0.5">
                  <NavItem to="/admin/onboarding" icon={<Server size={13} />} label="Registry" amber />
                  <NavItem to="/admin/appeals"    icon={<Scale size={13} />}  label="Appeals"  amber />
                </div>
              </>
            )}

            {/* ── Right section ─────────────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-2 ml-auto">
              {/* Notification bell */}
              <NotificationBell />

              <VDivider />

              {/* User badge */}
              <div
                className="flex items-center gap-2"
                style={{
                  padding: '5px 10px 5px 6px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                {/* Avatar circle */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--color-accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                    letterSpacing: '0.04em',
                  }}
                >
                  {initials}
                </div>
                <div className="flex flex-col leading-none" style={{ gap: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-nav-text)' }}>
                    {name}{state ? <span style={{ fontWeight: 400, color: 'rgba(252,250,246,0.45)', fontSize: '11px' }}> · {state}</span> : ''}
                  </span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: 'rgba(252,250,246,0.38)' }}>
                    {onegovId}
                  </span>
                </div>
                {/* Online pulse */}
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--color-success)',
                    boxShadow: '0 0 5px var(--color-success)',
                    animation: 'pulse 2s infinite',
                    flexShrink: 0,
                  }}
                />
              </div>

              {/* Language toggle */}
              <button
                onClick={toggleLanguage}
                title="Switch Language / भाषा बदलें"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 9px',
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
                <Languages size={12} color="var(--color-accent-amber)" />
                {i18n.language === 'hi' ? 'हिन्दी' : 'EN'}
              </button>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '6px',
                  color: 'rgba(252,250,246,0.45)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'border-color 150ms, color 150ms, background 150ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(229,71,45,0.12)';
                  e.currentTarget.style.borderColor = 'rgba(229,71,45,0.45)';
                  e.currentTarget.style.color = '#E5472D';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                  e.currentTarget.style.color = 'rgba(252,250,246,0.45)';
                }}
              >
                <LogOut size={12} />
                Sign out
              </button>
            </div>
          </>
        )}

        {/* ── Mobile hamburger ─────────────────────────────────────────────── */}
        {name && (
          <button
            className="md:hidden bg-transparent border-0 cursor-pointer p-1.5 ml-auto rounded"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              color: 'var(--color-nav-text)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px',
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </div>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {mobileOpen && name && (
        <div
          className="md:hidden"
          style={{
            background: 'var(--color-nav-bg)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="max-w-[1400px] mx-auto px-5 py-4 flex flex-col gap-3">
            {/* User info */}
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'var(--color-accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-nav-text)' }}>{name}</div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(252,250,246,0.4)' }}>{onegovId}</div>
              </div>
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'rgba(252,250,246,0.3)' }} />
            </div>

            {/* Links */}
            {[
              { to: '/dashboard',         label: 'Dashboard',            icon: <LayoutGrid size={14} /> },
              { to: '/services',          label: 'Services',             icon: <Shield size={14} /> },
              { to: '/consent-dashboard', label: 'My Consents',          icon: <ShieldCheck size={14} /> },
              { to: '/audit',             label: 'Audit Trail',          icon: <ClipboardList size={14} /> },
              { to: '/data-export',       label: 'My Data',              icon: <FileArchive size={14} /> },
              { to: '/ops',               label: 'Ops',                  icon: <Shield size={14} /> },
            ].map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '9px 12px', borderRadius: '7px', textDecoration: 'none',
                  fontSize: '13.5px', fontWeight: 500,
                  color: isActive ? '#FCFAF6' : 'rgba(252,250,246,0.6)',
                  background: isActive ? 'rgba(229,71,45,0.2)' : 'transparent',
                })}
              >
                {icon}{label}
              </NavLink>
            ))}

            {isAdmin && (
              <>
                <div style={{ height: '1px', background: 'rgba(246,168,31,0.2)', margin: '2px 0' }} />
                {[
                  { to: '/admin/onboarding', label: 'Registry Onboarding', icon: <Server size={14} /> },
                  { to: '/admin/appeals',    label: 'Appeals & Grievances', icon: <Scale size={14} /> },
                ].map(({ to, label, icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    style={() => ({
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '9px 12px', borderRadius: '7px', textDecoration: 'none',
                      fontSize: '13.5px', fontWeight: 600,
                      color: 'var(--color-accent-amber)',
                    })}
                  >
                    {icon}{label}
                  </NavLink>
                ))}
              </>
            )}

            {/* Bottom row */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '2px 0' }} />
            <div className="flex items-center justify-between">
              <button
                onClick={toggleLanguage}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 12px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)', borderRadius: '7px',
                  color: 'var(--color-nav-text)', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Languages size={13} color="var(--color-accent-amber)" />
                {i18n.language === 'hi' ? 'हिन्दी' : 'EN'}
              </button>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', background: 'rgba(229,71,45,0.10)',
                  border: '1px solid rgba(229,71,45,0.25)', borderRadius: '7px',
                  color: '#E5472D', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

