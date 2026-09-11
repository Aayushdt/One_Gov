import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ClipboardList, LogOut, Menu, X } from 'lucide-react';

export function Nav() {
  const { name, citizenId, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="w-full sticky top-0 z-50" style={{ background: 'var(--color-nav-bg)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <NavLink to="/services" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'var(--color-accent-primary)' }}>
            <span className="text-white font-bold text-xs">GL</span>
          </div>
          <span className="font-display text-lg font-medium" style={{ color: 'var(--color-nav-text)' }}>GovLink</span>
        </NavLink>

        {/* Desktop nav */}
        {citizenId && (
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/audit" className={({ isActive }) =>
              `text-caption no-underline transition-colors duration-100 ${isActive ? 'border-b-2 pb-0.5' : ''}`
            } style={({ isActive }) => ({ color: isActive ? 'var(--color-nav-active)' : 'var(--color-nav-text-muted)', borderColor: isActive ? 'var(--color-nav-active)' : 'transparent' })}>
              <span className="flex items-center gap-1.5"><ClipboardList size={13} />Audit Trail</span>
            </NavLink>
            <span className="text-caption" style={{ color: 'var(--color-nav-text-muted)' }}>{name}</span>
            <button onClick={handleLogout} className="text-caption transition-colors duration-100 cursor-pointer bg-transparent border-0 p-0" style={{ color: 'var(--color-nav-text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-nav-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-nav-text-muted)')}>
              <span className="flex items-center gap-1"><LogOut size={13} />Sign out</span>
            </button>
          </div>
        )}

        {/* Mobile hamburger */}
        {citizenId && (
          <button className="md:hidden bg-transparent border-0 cursor-pointer p-1" onClick={() => setMobileOpen(!mobileOpen)} style={{ color: 'var(--color-nav-text)' }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && citizenId && (
        <div className="md:hidden" style={{ background: '#0F0C0B', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-4">
            <NavLink to="/audit" className="text-body-sm no-underline" style={{ color: 'var(--color-nav-text)' }} onClick={() => setMobileOpen(false)}>Audit Trail</NavLink>
            <span className="text-caption" style={{ color: 'var(--color-nav-text-muted)' }}>{name}</span>
            <button onClick={handleLogout} className="text-body-sm text-left bg-transparent border-0 cursor-pointer p-0" style={{ color: 'var(--color-nav-text-muted)' }}>Sign out</button>
          </div>
        </div>
      )}
    </nav>
  );
}
