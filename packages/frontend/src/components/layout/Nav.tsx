import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ClipboardList, LogOut, Menu, X, Shield, LayoutGrid, ShieldCheck, Languages, FileArchive, Server, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NotificationBell } from '../NotificationBell';

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

  return (
    <nav className="w-full sticky top-0 z-50" style={{ background: 'var(--color-nav-bg)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <NavLink to="/services" className="flex items-center gap-2.5 no-underline">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'var(--color-accent-primary)' }}>
            <Shield size={16} color="white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-medium leading-none" style={{ color: 'var(--color-nav-text)' }}>OneGov</span>
            <span className="text-[10px] tracking-wider uppercase" style={{ color: 'var(--color-nav-text-muted)' }}>Interoperability Middleware</span>
          </div>
        </NavLink>

        {/* Desktop nav */}
        {name && (
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/dashboard" className={({ isActive }) =>
              `text-caption no-underline transition-colors duration-100 ${isActive ? 'border-b-2 pb-0.5' : ''}`
            } style={({ isActive }) => ({ color: isActive ? 'var(--color-nav-active)' : 'var(--color-nav-text-muted)', borderColor: isActive ? 'var(--color-nav-active)' : 'transparent' })}>
              <span className="flex items-center gap-1.5"><LayoutGrid size={13} />Dashboard</span>
            </NavLink>

            <NavLink to="/services" className={({ isActive }) =>
              `text-caption no-underline transition-colors duration-100 ${isActive ? 'border-b-2 pb-0.5' : ''}`
            } style={({ isActive }) => ({ color: isActive ? 'var(--color-nav-active)' : 'var(--color-nav-text-muted)', borderColor: isActive ? 'var(--color-nav-active)' : 'transparent' })}>
              <span className="flex items-center gap-1.5"><Shield size={13} />Services</span>
            </NavLink>

            <NavLink to="/consent-dashboard" className={({ isActive }) =>
              `text-caption no-underline transition-colors duration-100 ${isActive ? 'border-b-2 pb-0.5' : ''}`
            } style={({ isActive }) => ({ color: isActive ? 'var(--color-nav-active)' : 'var(--color-nav-text-muted)', borderColor: isActive ? 'var(--color-nav-active)' : 'transparent' })}>
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} />My Consents</span>
            </NavLink>

            <NavLink to="/audit" className={({ isActive }) =>
              `text-caption no-underline transition-colors duration-100 ${isActive ? 'border-b-2 pb-0.5' : ''}`
            } style={({ isActive }) => ({ color: isActive ? 'var(--color-nav-active)' : 'var(--color-nav-text-muted)', borderColor: isActive ? 'var(--color-nav-active)' : 'transparent' })}>
              <span className="flex items-center gap-1.5"><ClipboardList size={13} />Audit Trail</span>
            </NavLink>

            <NavLink to="/data-export" className={({ isActive }) =>
              `text-caption no-underline transition-colors duration-100 ${isActive ? 'border-b-2 pb-0.5' : ''}`
            } style={({ isActive }) => ({ color: isActive ? 'var(--color-nav-active)' : 'var(--color-nav-text-muted)', borderColor: isActive ? 'var(--color-nav-active)' : 'transparent' })}>
              <span className="flex items-center gap-1.5"><FileArchive size={13} />My Data</span>
            </NavLink>

            <NavLink to="/ops" className={({ isActive }) =>
              `text-caption no-underline transition-colors duration-100 ${isActive ? 'border-b-2 pb-0.5' : ''}`
            } style={({ isActive }) => ({ color: isActive ? 'var(--color-nav-active)' : 'var(--color-nav-text-muted)', borderColor: isActive ? 'var(--color-nav-active)' : 'transparent' })}>
              <span className="flex items-center gap-1.5"><Shield size={13} />Ops</span>
            </NavLink>

            {isAdmin && (
              <>
                <NavLink to="/admin/onboarding" className={({ isActive }) =>
                  `text-caption no-underline transition-colors duration-100 ${isActive ? 'border-b-2 pb-0.5' : ''}`
                } style={({ isActive }) => ({ color: isActive ? 'var(--color-nav-active)' : 'var(--color-accent-amber)', borderColor: isActive ? 'var(--color-nav-active)' : 'transparent' })}>
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--color-accent-amber)' }}><Server size={13} />Registry</span>
                </NavLink>

                <NavLink to="/admin/appeals" className={({ isActive }) =>
                  `text-caption no-underline transition-colors duration-100 ${isActive ? 'border-b-2 pb-0.5' : ''}`
                } style={({ isActive }) => ({ color: isActive ? 'var(--color-nav-active)' : 'var(--color-accent-amber)', borderColor: isActive ? 'var(--color-nav-active)' : 'transparent' })}>
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--color-accent-amber)' }}><Scale size={13} />Appeals</span>
                </NavLink>
              </>
            )}

            {/* Notifications */}
            <NotificationBell />

            {/* Universal Citizen Badge */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-success)' }} />
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--color-nav-text)' }}>{name} {state ? `(${state})` : ''}</span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--color-nav-text-muted)' }}>{onegovId}</span>
              </div>
            </div>

            {/* Language Switcher (Item 6) */}
            <button
              onClick={toggleLanguage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '4px',
                color: 'var(--color-nav-text)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Switch Language / भाषा बदलें"
            >
              <Languages size={13} color="var(--color-accent-amber)" />
              <span>{i18n.language === 'hi' ? 'हिन्दी' : 'EN'}</span>
            </button>

            <button onClick={handleLogout} className="text-caption transition-colors duration-100 cursor-pointer bg-transparent border-0 p-0" style={{ color: 'var(--color-nav-text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-nav-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-nav-text-muted)')}>
              <span className="flex items-center gap-1"><LogOut size={13} />Sign out</span>
            </button>
          </div>
        )}

        {/* Mobile hamburger */}
        {name && (
          <button className="md:hidden bg-transparent border-0 cursor-pointer p-1" onClick={() => setMobileOpen(!mobileOpen)} style={{ color: 'var(--color-nav-text)' }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && name && (
        <div className="md:hidden" style={{ background: 'var(--color-nav-bg)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-4">
            <div className="flex flex-col">
              <span className="text-body-sm font-semibold" style={{ color: 'var(--color-nav-text)' }}>{name}</span>
              <span className="text-caption font-mono" style={{ color: 'var(--color-nav-text-muted)' }}>{onegovId}</span>
            </div>
            <NavLink to="/dashboard" className="text-body-sm no-underline" style={{ color: 'var(--color-nav-text)' }} onClick={() => setMobileOpen(false)}>Dashboard</NavLink>
            <NavLink to="/services" className="text-body-sm no-underline" style={{ color: 'var(--color-nav-text)' }} onClick={() => setMobileOpen(false)}>Services</NavLink>
            <NavLink to="/consent-dashboard" className="text-body-sm no-underline" style={{ color: 'var(--color-nav-text)' }} onClick={() => setMobileOpen(false)}>My Consents</NavLink>
            <NavLink to="/audit" className="text-body-sm no-underline" style={{ color: 'var(--color-nav-text)' }} onClick={() => setMobileOpen(false)}>Audit Trail (Hash View)</NavLink>
            <NavLink to="/my-history" className="text-body-sm no-underline" style={{ color: 'var(--color-nav-text)' }} onClick={() => setMobileOpen(false)}>Access History (Plain)</NavLink>
            <NavLink to="/data-export" className="text-body-sm no-underline" style={{ color: 'var(--color-nav-text)' }} onClick={() => setMobileOpen(false)}>My Data (Export)</NavLink>
            {isAdmin && (
              <>
                <NavLink to="/admin/onboarding" className="text-body-sm no-underline font-semibold" style={{ color: 'var(--color-accent-amber)' }} onClick={() => setMobileOpen(false)}>Registry Onboarding</NavLink>
                <NavLink to="/admin/appeals" className="text-body-sm no-underline font-semibold" style={{ color: 'var(--color-accent-amber)' }} onClick={() => setMobileOpen(false)}>Appeals &amp; Grievances</NavLink>
              </>
            )}
            <button onClick={handleLogout} className="text-body-sm text-left bg-transparent border-0 cursor-pointer p-0" style={{ color: 'var(--color-nav-text-muted)' }}>Sign out</button>
          </div>
        </div>
      )}
    </nav>
  );
}
