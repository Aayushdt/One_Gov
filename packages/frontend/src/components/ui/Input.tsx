import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, id, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={inputId} style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontFamily: '"Inter", system-ui, sans-serif' }}>
        {label}
      </label>
      <input
        id={inputId}
        {...props}
        style={{
          background: 'var(--color-bg-surface)',
          border: `1.5px solid ${error ? 'var(--color-error)' : 'var(--color-border-default)'}`,
          borderRadius: 6,
          padding: '10px 14px',
          fontSize: '1rem',
          fontFamily: '"Inter", system-ui, sans-serif',
          color: 'var(--color-text-primary)',
          outline: 'none',
          width: '100%',
          transition: 'border-color var(--duration-fast)',
          ...props.style,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-primary)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(229,71,45,0.15)'; props.onFocus?.(e); }}
        onBlur={(e) => { e.currentTarget.style.borderColor = error ? 'var(--color-error)' : 'var(--color-border-default)'; e.currentTarget.style.boxShadow = 'none'; props.onBlur?.(e); }}
      />
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)', fontFamily: '"Inter", system-ui, sans-serif' }}>{error}</span>}
      {helper && !error && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontFamily: '"Inter", system-ui, sans-serif' }}>{helper}</span>}
    </div>
  );
}
