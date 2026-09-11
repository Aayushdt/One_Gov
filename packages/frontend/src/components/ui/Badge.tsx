import React from 'react';

type BadgeVariant = 'active' | 'revoked' | 'expired' | 'pending' | 'success' | 'error' | 'warning';

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  active:  { background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success)' },
  success: { background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success)' },
  revoked: { background: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid var(--color-error)' },
  error:   { background: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid var(--color-error)' },
  expired: { background: 'var(--color-warning-bg)', color: '#8a5a00', border: '1px solid var(--color-accent-amber)' },
  warning: { background: 'var(--color-warning-bg)', color: '#8a5a00', border: '1px solid var(--color-accent-amber)' },
  pending: { background: 'var(--color-bg-sunken)', color: 'var(--color-text-tertiary)', border: '1px solid var(--color-border-default)' },
};

export function Badge({ variant, children, label }: { variant: BadgeVariant; children: React.ReactNode; label?: string }) {
  return (
    <span
      aria-label={label ?? String(children)}
      style={{ ...variantStyles[variant], fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', fontFamily: '"Inter", system-ui, sans-serif', transition: 'all var(--duration-base)' }}>
      {children}
    </span>
  );
}
