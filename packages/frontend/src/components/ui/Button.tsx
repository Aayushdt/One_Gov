import React from 'react';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--color-accent-primary)', color: 'var(--color-text-inverse)', border: 'none' },
  secondary: { background: 'transparent', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border-default)' },
  destructive: { background: 'transparent', color: 'var(--color-error)', border: '1.5px solid var(--color-error)' },
  ghost: { background: 'transparent', color: 'var(--color-text-secondary)', border: 'none' },
};

const hoverStyles: Record<Variant, Partial<React.CSSProperties>> = {
  primary: { background: 'var(--color-accent-secondary)' },
  secondary: { background: 'var(--color-bg-surface)' },
  destructive: { background: 'var(--color-error-bg)' },
  ghost: { color: 'var(--color-text-primary)' },
};

const padding: Record<Size, string> = { sm: '6px 12px', md: '10px 20px', lg: '12px 28px' };
const fontSize: Record<Size, string> = { sm: '0.8125rem', md: '0.875rem', lg: '1rem' };

export function Button({ variant = 'primary', size = 'md', fullWidth = false, children, disabled, style, onMouseEnter, onMouseLeave, ...props }: ButtonProps) {
  const [hovered, setHovered] = React.useState(false);

  const base: React.CSSProperties = {
    ...styles[variant],
    ...(hovered && !disabled ? hoverStyles[variant] : {}),
    padding: padding[size],
    fontSize: fontSize[size],
    fontWeight: 600,
    fontFamily: '"Inter", system-ui, sans-serif',
    borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    width: fullWidth ? '100%' : undefined,
    transition: 'background var(--duration-fast), color var(--duration-fast), border-color var(--duration-fast)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...style,
  };

  return (
    <button
      {...props}
      disabled={disabled}
      style={base}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e); }}
    >
      {children}
    </button>
  );
}
