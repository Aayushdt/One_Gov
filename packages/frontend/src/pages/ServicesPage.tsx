import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { api } from '../hooks/useApi';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Shield, GraduationCap, Banknote } from 'lucide-react';

const DEPT_TAGS = [
  { label: 'Identity Dept', icon: <Shield size={11} /> },
  { label: 'Education Dept', icon: <GraduationCap size={11} /> },
  { label: 'Revenue Dept', icon: <Banknote size={11} /> },
];

export function ServicesPage() {
  const navigate = useNavigate();
  const { name } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  const handleApply = async () => {
    setLoading(true);
    try {
      const { runId } = await api.startWorkflow();
      navigate(`/apply/${runId}`);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '48px 24px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Services</p>
          <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 1.2 }}>What would you like to do today?</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif' }}>Signed in as <strong style={{ color: 'var(--color-text-primary)' }}>{name}</strong></p>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

        {/* Scholarship service entry */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start', padding: '32px 0' }}>
          <div style={{ flex: '1 1 400px' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: '"Inter", system-ui, sans-serif' }}>National Merit Scholarship 2025</h2>
            <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif', lineHeight: 1.65, maxWidth: 480 }}>
              Apply for a merit-based scholarship using your verified government records. GovLink pulls data directly from the relevant departments — you review and grant consent before anything moves.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DEPT_TAGS.map(t => (
                <span key={t.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
                  {t.icon}{t.label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0, paddingTop: 4 }}>
            <Button onClick={handleApply} disabled={loading} style={{ whiteSpace: 'nowrap' }}>
              {loading ? 'Starting…' : 'Apply for Scholarship'}<ArrowRight size={16} />
            </Button>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif', textAlign: 'right', maxWidth: 220 }}>
              You'll review and grant data consent before proceeding.
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />
      </div>
    </AppShell>
  );
}
